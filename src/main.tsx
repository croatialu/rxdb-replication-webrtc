import ReactDOM from 'react-dom/client'
import {
  RouterProvider,
  createBrowserRouter,
} from 'react-router-dom'
import App from './App.tsx'

import '@unocss/reset/normalize.css'

import 'virtual:uno.css'

import './index.css'
import Normal from './pages/normal/index.tsx'
import Shared from './pages/shared/index.tsx'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/normal',
    element: <Normal />,
  },
  {
    path: '/shared',
    element: <Shared />,
  },
], {
  basename: '/rxdb-replication-webrtc',
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <RouterProvider router={router} />,
)
