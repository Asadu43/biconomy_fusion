import { polygon } from 'viem/chains'

// Validate required environment variables
const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = import.meta.env[key]
  if (!value && !defaultValue) {
    console.warn(`⚠️ Environment variable ${key} is not set`)
  }
  return value || defaultValue || ''
}

export const config = {
  // Network configuration - Polygon Mainnet
  chain: polygon,
  
  // Default token configuration (from .env or defaults)
  defaultToken: {
    address: (getEnvVar('VITE_DEFAULT_TOKEN_ADDRESS') || '') as `0x${string}`,
    decimals: Number(getEnvVar('VITE_DEFAULT_TOKEN_DECIMALS') || ''),
    symbol: getEnvVar('VITE_DEFAULT_TOKEN_SYMBOL') || '',
    name: getEnvVar('VITE_DEFAULT_TOKEN_NAME') || ''
  },
  
  // Biconomy configuration (from .env - REQUIRED)
  biconomy: {
    apiKey: getEnvVar('VITE_BICONOMY_API_KEY'),
    projectId: getEnvVar('VITE_BICONOMY_PROJECT_ID'),
  },
  
  // Explorer URLs
  explorer: {
    baseUrl: 'https://meescan.biconomy.io',
    tx: (hash: string) => `https://meescan.biconomy.io/details/${hash}`,
    address: (address: string) => `https://polygonscan.com/address/${address}`,
  }
}

// Validate critical configuration
if (!config.biconomy.apiKey) {
  console.error('❌ VITE_BICONOMY_API_KEY is required. Please set it in your .env file.')
}

if (!config.biconomy.projectId) {
  console.error('❌ VITE_BICONOMY_PROJECT_ID is required. Please set it in your .env file.')
}


