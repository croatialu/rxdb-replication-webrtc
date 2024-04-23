import type { PostCollection } from './post'
import type { UserCollection } from './user'

export interface DatabaseCollections {
  // users: UserCollection;
  // post: PostCollection;

  user: UserCollection
  post: PostCollection
}
