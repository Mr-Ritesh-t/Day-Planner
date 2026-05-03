import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'


export default {
  server: {
    host: true,
    allowedHosts: true,
    hmr: {
      clientPort: 443
    }
  }
}