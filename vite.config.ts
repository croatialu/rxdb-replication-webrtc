import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import UnoCSS from 'unocss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/rxdb-replication-webrtc',
  plugins: [
    react(),
    UnoCSS(),
    VitePWA(),
  ],
})
