import { useState } from 'react'
import { createWalletClient, custom } from 'viem'
import type { WalletClient } from 'viem'
import { config } from '../config'

interface WalletConnectProps {
  onConnect: (client: WalletClient, address: string) => void
}

export default function WalletConnect({ onConnect }: WalletConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string>('')

  const connectWallet = async () => {
    setIsConnecting(true)
    setError('')

    try {
      // Check if MetaMask is installed
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed. Please install MetaMask to continue.')
      }

      // Check current chain and switch if needed
      const currentChainId = await window.ethereum.request({ method: 'eth_chainId' })
      const targetChainId = `0x${config.chain.id.toString(16)}`

      if (currentChainId !== targetChainId) {
        try {
          // Try to switch to Polygon network
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: targetChainId }],
          })
        } catch (switchError: any) {
          // This error code indicates that the chain has not been added to MetaMask
          if (switchError.code === 4902) {
            // Add Polygon network to MetaMask
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: targetChainId,
                chainName: config.chain.name,
                nativeCurrency: {
                  name: 'MATIC',
                  symbol: 'MATIC',
                  decimals: 18,
                },
                rpcUrls: [config.chain.rpcUrls.default.http[0]],
                blockExplorerUrls: [config.explorer.baseUrl],
              }],
            })
          } else {
            throw switchError
          }
        }
      }

      // Create wallet client
      const walletClient = createWalletClient({
        chain: config.chain,
        transport: custom(window.ethereum)
      })

      // Request account access
      const [address] = await walletClient.requestAddresses()

      if (!address) {
        throw new Error('No address returned from wallet')
      }

      onConnect(walletClient, address)
    } catch (err: any) {
      console.error('Wallet connection error:', err)
      setError(err.message || 'Failed to connect wallet')
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <div className="card">
      <h2>Connect Your Wallet</h2>
      <p style={{ marginBottom: '1.5rem', color: '#888' }}>
        Connect MetaMask or any EIP-1193 compatible wallet to get started
      </p>

      <button 
        onClick={connectWallet} 
        disabled={isConnecting}
        style={{ width: '100%', padding: '1em' }}
      >
        {isConnecting ? 'Connecting...' : '🦊 Connect Wallet'}
      </button>

      {error && (
        <div className="status error" style={{ marginTop: '1rem' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <div style={{ marginTop: '2rem', fontSize: '0.9em', color: '#888' }}>
        <p><strong>Network:</strong> {config.chain.name}</p>
        <p style={{ marginTop: '0.5rem' }}>
          Make sure your wallet is connected to {config.chain.name}
        </p>
      </div>
    </div>
  )
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: any
  }
}

