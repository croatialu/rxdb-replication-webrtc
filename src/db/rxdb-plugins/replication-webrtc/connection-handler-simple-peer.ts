import { Subject } from 'rxjs'

import type {
  SimplePeer as PeerType,

  Instance as SimplePeerInstance,
  Options as SimplePeerOptions,
} from 'simple-peer'

// @ts-expect-error type error
import _Peer from 'simple-peer/simplepeer.min.js'

import type { RxError, RxTypeError } from 'rxdb'
import { PROMISE_RESOLVE_VOID, ensureNotFalsy, getFromMapOrThrow, newRxError, promiseWait, randomCouchString } from 'rxdb'
import type {
  PeerWithMessage,
  PeerWithResponse,
  SyncOptionsWebRTC,
  WebRTCConnectionHandler,
  WebRTCConnectionHandlerCreator,
  WebRTCMessage,
  WebRTCResponse,
} from './webrtc-types.ts'

const Peer = _Peer as PeerType

export type SimplePeer = SimplePeerInstance & {
  // add id to make debugging easier
  id: string
}

export interface SimplePeerInitMessage {
  type: 'init'
  yourPeerId: string
}
export interface SimplePeerJoinMessage {
  type: 'join'
  room: string
}
export interface SimplePeerJoinedMessage {
  type: 'joined'
  otherPeerIds: string[]
}
export interface SimplePeerSignalMessage {
  type: 'signal'
  room: string
  senderPeerId: string
  receiverPeerId: string
  data: string
}
export interface SimplePeerPingMessage {
  type: 'ping'
}

export type PeerMessage =
  SimplePeerInitMessage |
  SimplePeerJoinMessage |
  SimplePeerJoinedMessage |
  SimplePeerSignalMessage |
  SimplePeerPingMessage

function sendMessage(ws: WebSocket, msg: PeerMessage) {
  ws.send(JSON.stringify(msg))
}

const DEFAULT_SIGNALING_SERVER_HOSTNAME = 'signaling.rxdb.info'
export const DEFAULT_SIGNALING_SERVER = `wss://${DEFAULT_SIGNALING_SERVER_HOSTNAME}/`
const sockets = new Map<string, WebSocket>()
let defaultServerWarningShown = false

export type SimplePeerWrtc = SimplePeerOptions['wrtc']
export type SimplePeerConfig = SimplePeerOptions['config']

export interface SimplePeerConnectionHandlerOptions {
  /**
   * If no server is specified, the default signaling server
   * from signaling.rxdb.info is used.
   * This server is not reliable and you should use
   * your own signaling server instead.
   */
  signalingServerUrl?: string
  wrtc?: SimplePeerWrtc
  config?: SimplePeerConfig
  webSocketConstructor?: typeof WebSocket
}

export const SIMPLE_PEER_PING_INTERVAL = 1000 * 60 * 2

/**
 * Returns a connection handler that uses simple-peer and the signaling server.
 */
export function getConnectionHandlerSimplePeer({
  signalingServerUrl: signalingServerUrlInput,
  wrtc,
  config,
  webSocketConstructor: webSocketConstructorInput,
}: SimplePeerConnectionHandlerOptions): WebRTCConnectionHandlerCreator<SimplePeer> {
  ensureProcessNextTickIsSet()

  const signalingServerUrl = signalingServerUrlInput || DEFAULT_SIGNALING_SERVER
  const WebSocketConstructor = webSocketConstructorInput || WebSocket

  if (
    signalingServerUrl.includes(DEFAULT_SIGNALING_SERVER_HOSTNAME)
    && !defaultServerWarningShown
  ) {
    defaultServerWarningShown = true
    console.warn(
      [
        'RxDB Warning: You are using the RxDB WebRTC replication plugin',
        'but you did not specify your own signaling server url.',
        `By default it will use a signaling server provided by RxDB at ${DEFAULT_SIGNALING_SERVER}`,
        'This server is made for demonstration purposes and tryouts. It is not reliable and might be offline at any time.',
        'In production you must always use your own signaling server instead.',
        'Learn how to run your own server at https://rxdb.info/replication-webrtc.html',
        'Also leave a ⭐ at the RxDB github repo 🙏 https://github.com/pubkey/rxdb 🙏',
      ].join(' '),
    )
  }
  const connect$ = new Subject<SimplePeer>()
  const disconnect$ = new Subject<SimplePeer>()
  const message$ = new Subject<PeerWithMessage<SimplePeer>>()
  const response$ = new Subject<PeerWithResponse<SimplePeer>>()
  const error$ = new Subject<RxError | RxTypeError>()

  const peers = new Map<string, SimplePeer>()
  let closed = false
  let ownPeerId: string

  /**
   * @recursive calls it self on socket disconnects
   * so that when the user goes offline and online
   * again, it will recreate the WebSocket connection.
   */
  function createSocket(roomName: string) {
    if (closed)
      return

    const cachedSocket = sockets.get(signalingServerUrl)

    if (cachedSocket)
      return cachedSocket

    const socket = new WebSocketConstructor(signalingServerUrl)
    sockets.set(signalingServerUrl, socket)
    socket.onclose = () => createSocket(roomName)
    socket.onopen = () => {
      ensureNotFalsy(socket).onmessage = (msgEvent: any) => {
        const msg: PeerMessage = JSON.parse(msgEvent.data as any)
        switch (msg.type) {
          case 'init':
            ownPeerId = msg.yourPeerId
            sendMessage(ensureNotFalsy(socket), {
              type: 'join',
              room: roomName,
            })
            break
          case 'joined':
            /**
             * PeerId is created by the signaling server
             * to prevent spoofing it.
             */
            // eslint-disable-next-line no-case-declarations
            function createPeerConnection(remotePeerId: string) {
              let disconnected = false
              const newSimplePeer: SimplePeer = new Peer({
                initiator: remotePeerId > ownPeerId,
                wrtc,
                config,
                trickle: true,
              }) as any
              newSimplePeer.id = randomCouchString(10)
              peers.set(remotePeerId, newSimplePeer)

              newSimplePeer.on('signal', (signal: any) => {
                sendMessage(ensureNotFalsy(socket), {
                  type: 'signal',
                  senderPeerId: ownPeerId,
                  receiverPeerId: remotePeerId,
                  room: roomName,
                  data: signal,
                })
              })

              newSimplePeer.on('data', (messageOrResponse: any) => {
                messageOrResponse = JSON.parse(messageOrResponse.toString())
                if (messageOrResponse.result) {
                  response$.next({
                    peer: newSimplePeer,
                    response: messageOrResponse,
                  })
                }
                else {
                  message$.next({
                    peer: newSimplePeer,
                    message: messageOrResponse,
                  })
                }
              })

              newSimplePeer.on('error', (error) => {
                error$.next(newRxError('RC_WEBRTC_PEER', {
                  error,
                }))
                newSimplePeer.destroy()
                if (!disconnected) {
                  disconnected = true
                  disconnect$.next(newSimplePeer)
                }
              })

              newSimplePeer.on('connect', () => {
                connect$.next(newSimplePeer)
              })

              newSimplePeer.on('close', () => {
                if (!disconnected) {
                  disconnected = true
                  disconnect$.next(newSimplePeer)
                }
                createPeerConnection(remotePeerId)
              })
            }
            msg.otherPeerIds.forEach((remotePeerId) => {
              if (
                remotePeerId === ownPeerId
                || peers.has(remotePeerId)
              )
                // eslint-disable-next-line no-useless-return
                return
              else
                createPeerConnection(remotePeerId)
            })
            break
          case 'signal':
            // eslint-disable-next-line no-case-declarations
            const peer = getFromMapOrThrow(peers, msg.senderPeerId)
            peer.signal(msg.data)
            break
        }
      }
    }
  };

  const creator: WebRTCConnectionHandlerCreator<SimplePeer> = async (options: SyncOptionsWebRTC<any, SimplePeer>) => {
    const socket: WebSocket | undefined = createSocket(options.topic);

    /**
     * Send ping signals to the server.
     */
    (async () => {
      while (true) {
        await promiseWait(SIMPLE_PEER_PING_INTERVAL / 2)
        if (closed)
          break

        if (socket)
          sendMessage(socket, { type: 'ping' })
      }
    })()

    const handler: WebRTCConnectionHandler<SimplePeer> = {
      error$,
      connect$,
      disconnect$,
      message$,
      response$,
      async send(peer: SimplePeer, message: WebRTCMessage | WebRTCResponse) {
        await peer.send(JSON.stringify(message))
      },
      destroy() {
        closed = true
        ensureNotFalsy(socket).close()
        sockets.delete(signalingServerUrl)
        error$.complete()
        connect$.complete()
        disconnect$.complete()
        message$.complete()
        response$.complete()
        return PROMISE_RESOLVE_VOID
      },
    }
    return handler
  }
  return creator
}

/**
 * Multiple people had problems because it requires to have
 * the nextTick() method in the runtime. So we check here and
 * throw a helpful error.
 */
export function ensureProcessNextTickIsSet() {
  if (
    // eslint-disable-next-line node/prefer-global/process
    typeof process === 'undefined'
    // eslint-disable-next-line node/prefer-global/process
    || typeof process.nextTick !== 'function'
  )
    throw newRxError('RC7')
}
