import { polygon } from 'viem/chains'

export const config = {
  // Network configuration - Polygon Mainnet
  chain: polygon,
  
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


