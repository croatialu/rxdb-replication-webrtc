import { useEffect, useState } from 'react'
import './App.css'
import type { Database } from './db/db'
import { createDatabase } from './db/db'
import { UserList } from './components/UserList'

function App() {
  const [database, setDatabase] = useState<Database>(0)

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

export default App
