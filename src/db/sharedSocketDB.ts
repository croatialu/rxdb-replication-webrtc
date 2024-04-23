import type {
  RxDatabase,
} from 'rxdb'
import {
  addRxPlugin,
  createRxDatabase,
  removeRxDatabase,
} from 'rxdb'
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode'
import { RxDBUpdatePlugin } from 'rxdb/plugins/update'
import { RxDBJsonDumpPlugin } from 'rxdb/plugins/json-dump'
import { RxDBCleanupPlugin } from 'rxdb/plugins/cleanup'
import { RxDBLeaderElectionPlugin } from 'rxdb/plugins/leader-election'
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie'
import {
  userSchema,
} from './collections/user'
import type { DatabaseCollections } from './collections'

import { postSchema } from './collections/post'
import { getConnectionHandlerSimplePeer, replicateWebRTC } from './rxdb-plugins/replication-webrtc'

addRxPlugin(RxDBLeaderElectionPlugin)
addRxPlugin(RxDBDevModePlugin)
addRxPlugin(RxDBUpdatePlugin)
addRxPlugin(RxDBJsonDumpPlugin)
addRxPlugin(RxDBCleanupPlugin)

export async function createDatabase() {
  const dbName = 'example_rxdb'
  await removeRxDatabase(dbName, getRxStorageDexie())
  const database = await createRxDatabase<DatabaseCollections>({
    name: dbName,
    storage: getRxStorageDexie(),
    multiInstance: true,
    ignoreDuplicate: true,
  })

  // show leadership in title
  database.waitForLeadership().then(() => {
    document.title = `♛ ${document.title}`
  })

  await database.addCollections({
    user: {
      schema: userSchema,
    },
    post: {
      schema: postSchema,
    },
  })

  /**
   * NEW
   */
  const creator = getConnectionHandlerSimplePeer({})
  //                        ^ create a creator
  Object.keys(database.collections).map(async (key) => {
    return replicateWebRTC({
      collection:
        database.collections[key as keyof typeof database.collections],
      connectionHandlerCreator: creator,
      //                           ^ use the creator
      topic: dbName,
      pull: {},
      push: {},
    })
  })

  return database
}

export type Database = RxDatabase<DatabaseCollections, any, any, unknown>
