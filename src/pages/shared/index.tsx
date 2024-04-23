import { useEffect, useState } from 'react'
import { type Database, createDatabase } from '../../db/sharedSocketDB'
import { UserList } from '../../components/UserList'

function Shared() {
  const [database, setDatabase] = useState<Database>()

  useEffect(() => {
    createDatabase().then((db) => {
      setDatabase(db)
    })
  }, [])

  if (!database)
    return <div>Loading....</div>

  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      <UserList
        title="User List"
        collection={database.user}
      />
      <UserList
        title="Post List"
        collection={database.post}
      />
    </div>
  )
}

export default Shared
