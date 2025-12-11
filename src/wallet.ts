import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { http } from 'wagmi'
import { QueryClient } from '@tanstack/react-query'
import type { Chain } from 'wagmi/chains'
import { config as appConfig } from './config'

const projectId = appConfig.walletConnect.projectId

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
  allowUnsupportedChain: true, // Allow unsupported chains - we handle network switching in our UI instead of AppKit's modal
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

