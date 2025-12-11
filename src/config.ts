import { polygon } from 'viem/chains'

// Get all values from environment variables (loaded via vite.config.ts)
const rpcUrl = import.meta.env.POLYGON_RPC_URL || ''
const walletConnectProjectId = import.meta.env.WALLETCONNECT_PROJECT_ID || ''
const biconomyApiKey = import.meta.env.BICONOMY_API_KEY || ''
const biconomyProjectId = import.meta.env.BICONOMY_PROJECT_ID || ''
const defaultTokenAddress = import.meta.env.DEFAULT_TOKEN_ADDRESS || ''
const defaultTokenDecimals = import.meta.env.DEFAULT_TOKEN_DECIMALS || '18'
const defaultTokenSymbol = import.meta.env.DEFAULT_TOKEN_SYMBOL || ''
const defaultTokenName = import.meta.env.DEFAULT_TOKEN_NAME || ''

// Debug: Log environment variables (remove in production)
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  console.log('🔧 Environment Variables:', {
    POLYGON_RPC_URL: rpcUrl ? '✓ Set' : '✗ Missing',
    WALLETCONNECT_PROJECT_ID: walletConnectProjectId ? '✓ Set' : '✗ Missing',
    BICONOMY_API_KEY: biconomyApiKey ? '✓ Set' : '✗ Missing',
    BICONOMY_PROJECT_ID: biconomyProjectId ? '✓ Set' : '✗ Missing',
  })
}

export const config = {
  // Network configuration - Polygon Mainnet with custom RPC
  chain: {
    ...polygon,
    rpcUrls: {
      default: {
        http: [rpcUrl]
      },
      public: {
        http: [rpcUrl]
      }
    }
  },
  // WalletConnect / Web3Modal configuration
  walletConnect: {
    projectId: walletConnectProjectId,
    metadata: {
      name: 'Fusion Transfer',
      description: 'Transfer tokens with Biconomy Fusion',
      url: typeof window !== 'undefined' ? window.location.origin : 'https://fusion-transaction',
      icons: ['https://avatars.githubusercontent.com/u/111761645?s=200&v=4']
    }
  },
  
  // Default token configuration
  defaultToken: {
    address: defaultTokenAddress as `0x${string}`,
    decimals: parseInt(defaultTokenDecimals, 10) || 18,
    symbol: defaultTokenSymbol,
    name: defaultTokenName
  },
  
  // Biconomy configuration
  biconomy: {
    apiKey: biconomyApiKey,
    projectId: biconomyProjectId,
  },
  
  // Explorer URLs
  explorer: {
    baseUrl: 'https://meescan.biconomy.io',
    tx: (hash: string) => `https://meescan.biconomy.io/details/${hash}`,
    address: (address: string) => `https://polygonscan.com/address/${address}`,
  }
}


