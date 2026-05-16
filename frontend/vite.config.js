// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react(),],
// })

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),basicSsl(),],
  server: {
    host: true, // Memungkinkan akses via IP Lokal (0.0.0.0)
    port: 5173, // Atau port yang Anda inginkan
  }
})
