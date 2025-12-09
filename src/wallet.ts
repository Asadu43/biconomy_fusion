import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { http } from 'wagmi'
import { QueryClient } from '@tanstack/react-query'
import type { Chain } from 'wagmi/chains'
import { config as appConfig } from './config'

const projectId = appConfig.walletConnect.projectId

if (!projectId || projectId === 'REPLACE_WITH_WALLETCONNECT_PROJECT_ID') {
  // Throw early so the UI can surface a helpful message instead of failing silently
  throw new Error('VITE_WALLETCONNECT_PROJECT_ID is missing in environment variables')
}

const chains: [Chain, ...Chain[]] = [appConfig.chain as Chain]

// Create Wagmi Adapter (without Coinbase Wallet to avoid SDK issues)
const wagmiAdapter = new WagmiAdapter({
  networks: chains,
  projectId,
  transports: {
    [appConfig.chain.id]: http(appConfig.chain.rpcUrls.default.http[0])
  },
  connectors: [] // Disable default connectors to avoid Coinbase SDK error
})

// Initialize AppKit (Reown's new wallet modal - supports MetaMask, WalletConnect, etc.)
createAppKit({
  adapters: [wagmiAdapter],
  networks: chains,
  projectId,
  metadata: appConfig.walletConnect.metadata,
  themeMode: 'dark',
  defaultNetwork: appConfig.chain,
  allowUnsupportedChain: false,
  features: {
    analytics: false,
    email: false,
    socials: []
  },
  excludeWalletIds: ['fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa'] // Exclude Coinbase Wallet
})

const queryClient = new QueryClient()
const wagmiConfig = wagmiAdapter.wagmiConfig

export { wagmiConfig, projectId, chains, queryClient }

