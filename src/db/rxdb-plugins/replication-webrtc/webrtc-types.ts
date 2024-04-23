import type { MaybePromise, ReplicationOptions, ReplicationPullOptions, ReplicationPushOptions, RxError, RxReplicationHandler, RxStorageDefaultCheckpoint, RxTypeError, StringKeys } from 'rxdb'
import type { RxReplicationState } from 'rxdb/plugins/replication'
import type { WebsocketMessageResponseType, WebsocketMessageType } from 'rxdb/plugins/replication-websocket'
import type { Observable, Subscription } from 'rxjs'

export type WebRTCReplicationCheckpoint = RxStorageDefaultCheckpoint

export type WebRTCMessage = Omit<WebsocketMessageType, 'method' | 'collection'> & {
  method: StringKeys<RxReplicationHandler<any, any>> | 'token'
  collectionName: string
}
export type WebRTCResponse = Omit<WebsocketMessageResponseType, 'collection'> & {
  collectionName: string
}
export interface PeerWithMessage<PeerType> {
  peer: PeerType
  message: WebRTCMessage
}
export interface PeerWithResponse<PeerType> {
  peer: PeerType
  response: WebRTCResponse
}

export interface WebRTCConnectionHandler<PeerType> {
  connect$: Observable<PeerType>
  disconnect$: Observable<PeerType>
  message$: Observable<PeerWithMessage<PeerType>>
  response$: Observable<PeerWithResponse<PeerType>>
  error$: Observable<RxError | RxTypeError>
  send: (peer: PeerType, message: WebRTCMessage | WebRTCResponse) => Promise<void>
  destroy: () => Promise<void>
}

export type WebRTCConnectionHandlerCreator<PeerType> = (
  opts: SyncOptionsWebRTC<any, PeerType>
) => Promise<WebRTCConnectionHandler<PeerType>>

export type WebRTCSyncPushOptions<RxDocType> = Omit<
    ReplicationPushOptions<RxDocType>,
    'handler'
> & NonNullable<unknown>

export type WebRTCSyncPullOptions<RxDocType> = Omit<
    ReplicationPullOptions<RxDocType, WebRTCReplicationCheckpoint>,
    'handler' | 'stream$'
> & NonNullable<unknown>

export type SyncOptionsWebRTC<RxDocType, PeerType> = Omit<
    ReplicationOptions<RxDocType, WebRTCReplicationCheckpoint>,
    'pull' |
    'push' |
    'replicationIdentifier' |
    'deletedField' |
    'live' |
    'autostart' |
    'waitForLeadership'
> & {
  /**
   * It will only replicate with other instances
   * that use the same topic.
   */
  topic: string
  connectionHandlerCreator: WebRTCConnectionHandlerCreator<PeerType>
  /**
   * Run on new peers so that bad peers can be blocked.
   * If returns true, the peer is valid and it will replicate.
   * If returns false, it will drop the peer.
   */
  isPeerValid?: (peer: PeerType) => MaybePromise<boolean>
  pull?: WebRTCSyncPullOptions<RxDocType>
  push?: WebRTCSyncPushOptions<RxDocType>
}

export type RxWebRTCReplicationState<RxDocType> = RxReplicationState<RxDocType, WebRTCReplicationCheckpoint>

export interface WebRTCPeerState<RxDocType, PeerType> {
  peer: PeerType
  // only exists when the peer was picked as master and the own client was picked as fork.
  replicationState?: RxWebRTCReplicationState<RxDocType>
  // clean this up when removing the peer
  subs: Subscription[]
}
