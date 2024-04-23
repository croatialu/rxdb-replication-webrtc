import { Link } from 'react-router-dom'
import './App.css'

function App() {
  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      <ul>
        <li>
          <Link to="/normal">normal ( the way of the default connection signaling service of rxdb. )</Link>
        </li>
        <li>
          <Link to="/shared">shared ( the way of the cache socket )</Link>
        </li>
      </ul>
    </div>
  )
}

export default App
