import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className="flex items-center justify-center h-dvh">
        <div className="flex flex-col items-center justify-center">
          <div>
            <a href="https://vitejs.dev" target="_blank" rel="noreferrer">
              <img src={viteLogo} className="w-[160px]" alt="Vite logo" />
            </a>
            <a href="https://react.dev" target="_blank" rel="noreferrer">
              <img src={reactLogo} className="w-[160px]" alt="React logo" />
            </a>
          </div>
          <h1 className="text-red">Vite + React + TS</h1>
          <div className="card">
            <button onClick={() => setCount(count => count + 1)}>

              count is
              {count}
            </button>
            <div className="i-mdi:access-point-network" />
            <p>
              Edit
              <code>src/App.tsx</code>
              and save to test HMR
            </p>
          </div>
          <p className="read-the-docs">
            Click on the Vite and React logos to learn more
          </p>
        </div>
      </div>
    </>
  )
}

export default App
