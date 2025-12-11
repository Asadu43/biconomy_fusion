import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load all environment variables (without VITE_ prefix requirement)
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    define: {
      global: 'globalThis',
      // Expose environment variables to import.meta.env
      'import.meta.env.POLYGON_RPC_URL': JSON.stringify(env.POLYGON_RPC_URL || ''),
      'import.meta.env.WALLETCONNECT_PROJECT_ID': JSON.stringify(env.WALLETCONNECT_PROJECT_ID || ''),
      'import.meta.env.BICONOMY_API_KEY': JSON.stringify(env.BICONOMY_API_KEY || ''),
      'import.meta.env.BICONOMY_PROJECT_ID': JSON.stringify(env.BICONOMY_PROJECT_ID || ''),
      'import.meta.env.DEFAULT_TOKEN_ADDRESS': JSON.stringify(env.DEFAULT_TOKEN_ADDRESS || ''),
      'import.meta.env.DEFAULT_TOKEN_DECIMALS': JSON.stringify(env.DEFAULT_TOKEN_DECIMALS || '18'),
      'import.meta.env.DEFAULT_TOKEN_SYMBOL': JSON.stringify(env.DEFAULT_TOKEN_SYMBOL || ''),
      'import.meta.env.DEFAULT_TOKEN_NAME': JSON.stringify(env.DEFAULT_TOKEN_NAME || ''),
    },
    resolve: {
      alias: {
        process: "process/browser",
        stream: "stream-browserify",
        zlib: "browserify-zlib",
        util: 'util'
      }
    }
  }
})


