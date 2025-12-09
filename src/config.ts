import { polygon } from 'viem/chains'

export const config = {
  // Network configuration - Polygon Mainnet with custom RPC
  chain: {
    ...polygon,
    rpcUrls: {
      default: {
        http: ['https://polygon-mainnet.g.alchemy.com/v2/j6ZNSZp6cDpLZMOeST0un']
      },
      public: {
        http: ['https://polygon-mainnet.g.alchemy.com/v2/j6ZNSZp6cDpLZMOeST0un']
      }
    }
  },
  // WalletConnect / Web3Modal configuration
  walletConnect: {
    projectId: '18244949caa0c68708c2025b6a32ed46',
    metadata: {
      name: 'Fusion Transfer',
      description: 'Transfer tokens with Biconomy Fusion',
      url: typeof window !== 'undefined' ? window.location.origin : 'https://fusion-transaction-demo',
      icons: ['https://avatars.githubusercontent.com/u/111761645?s=200&v=4']
    }
  },
  
  // Default token configuration
  defaultToken: {
    address: '0x82d824fC6982fE68d6c27195A1A705FFAbc3D2b6' as `0x${string}`,
    decimals: 18,
    symbol: 'MTK',
    name: 'MyToken'
  },
  
  // Biconomy configuration
  biconomy: {
    apiKey: 'mee_Qh35Xsqw9acrZPk5GcvNLP',
    projectId: '3fa275ac-0c70-463e-ac91-6ba925aebc5c',
  },
  
  // Explorer URLs
  explorer: {
    baseUrl: 'https://meescan.biconomy.io',
    tx: (hash: string) => `https://meescan.biconomy.io/details/${hash}`,
    address: (address: string) => `https://polygonscan.com/address/${address}`,
  }
}


