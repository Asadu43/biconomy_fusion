import { useEffect, useState } from 'react'
import { useAccount, useDisconnect, useWalletClient } from 'wagmi'
import { useAppKit } from '@reown/appkit/react'
import { config } from '../config'

export default function WalletConnect() {
  const { open } = useAppKit()
  const { address, isConnecting, status, connector } = useAccount()
  const { disconnect } = useDisconnect()
  const { data: walletClient } = useWalletClient()
  const [error, setError] = useState<string>('')
  const [walletInfo, setWalletInfo] = useState<string>('')

  useEffect(() => {
    setError('')
    
    // Detect which wallet is connected
    if (connector) {
      const name = connector.name || 'Unknown'
      setWalletInfo(`Connected via: ${name}`)
      console.log('🔗 Wallet connector:', name, connector.id)
      
      // Warn if multiple wallets detected
      if (typeof window !== 'undefined' && window.ethereum) {
        const providers = (window.ethereum as any).providers
        if (providers && providers.length > 1) {
          console.warn('⚠️ Multiple wallets detected:', providers.map((p: any) => 
            p.isMetaMask ? 'MetaMask' : p.isTrust ? 'Trust Wallet' : 'Unknown'
          ))
        }
      }
    }
  }, [address, status, connector])

  const handleConnect = async () => {
    try {
      setError('')
      await open({ view: 'Connect' })
    } catch (err: any) {
      setError(err?.message || 'Failed to open wallet modal')
    }
  }

  const handleDisconnect = () => {
    disconnect()
  }

  const connected = Boolean(address && walletClient)

  return (
    <div className="card">
      <h2>Connect Your Wallet</h2>
      <p style={{ marginBottom: '1.5rem', color: '#888' }}>
        Connect with any wallet (MetaMask, Trust Wallet, WalletConnect, etc.)
      </p>

      <button 
        onClick={connected ? handleDisconnect : handleConnect} 
        disabled={isConnecting}
        style={{ width: '100%', padding: '1em' }}
      >
        {isConnecting ? 'Connecting...' : connected ? 'Disconnect Wallet' : '🔌 Connect Wallet'}
      </button>

      {connected && address && (
        <>
          <div className="status success" style={{ marginTop: '1rem' }}>
            <strong>Connected:</strong> {address.slice(0, 6)}...{address.slice(-4)}
          </div>
          {walletInfo && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.9em', color: '#4ade80' }}>
              {walletInfo}
            </div>
          )}
        </>
      )}

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
