import { useEffect, useState } from 'react'
import { useAccount, useDisconnect, useWalletClient } from 'wagmi'
import { useAppKit } from '@reown/appkit/react'
import { config } from '../config'

// Helper to detect available wallets
const detectAvailableWallets = () => {
  if (typeof window === 'undefined' || !window.ethereum) {
    return []
  }

  const wallets: Array<{ name: string; id: string; isInstalled: boolean }> = []
  const providers = (window.ethereum as any).providers || [window.ethereum]

  for (const provider of providers) {
    if (provider.isRabby) {
      wallets.push({ name: 'Rabby', id: 'rabby', isInstalled: true })
    } else if (provider.isGateWallet) {
      wallets.push({ name: 'Gate Wallet', id: 'gate', isInstalled: true })
    } else if (provider.isTrust || provider.isTrustWallet) {
      wallets.push({ name: 'Trust Wallet', id: 'trust', isInstalled: true })
    } else if (provider.isMetaMask) {
      wallets.push({ name: 'MetaMask', id: 'metamask', isInstalled: true })
    }
  }

  // Remove duplicates
  return wallets.filter((wallet, index, self) => 
    index === self.findIndex(w => w.id === wallet.id)
  )
}

export default function WalletConnect() {
  const { open } = useAppKit()
  const { address, isConnecting, status, connector } = useAccount()
  const { disconnect } = useDisconnect()
  const { data: walletClient } = useWalletClient()
  const [error, setError] = useState<string>('')
  const [walletInfo, setWalletInfo] = useState<string>('')
  const [availableWallets, setAvailableWallets] = useState<Array<{ name: string; id: string; isInstalled: boolean }>>([])

  useEffect(() => {
    setError('')
    setAvailableWallets(detectAvailableWallets())
    
    // Detect which wallet is connected
    if (connector) {
      const name = connector.name || 'Unknown'
      setWalletInfo(`Connected via: ${name}`)
      console.log('🔗 Wallet connector:', name, connector.id)
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

  // Get wallet display name with priority
  const getWalletDisplayName = () => {
    if (!connector) return ''
    const name = connector.name || ''
    if (name.toLowerCase().includes('rabby')) return 'Rabby'
    if (name.toLowerCase().includes('gate')) return 'Gate Wallet'
    if (name.toLowerCase().includes('trust')) return 'Trust Wallet'
    return name
  }

  const connectedWalletName = getWalletDisplayName()

  return (
    <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 style={{ 
          margin: '0 0 0.5rem 0', 
          fontSize: '1.75rem',
          fontWeight: '600',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Connect Your Wallet
        </h2>
        <p style={{ margin: 0, color: '#888', fontSize: '0.95em' }}>
          Choose your preferred wallet to get started
        </p>
      </div>

      {/* Recommendation Message */}
      {!connected && (
        <div style={{ 
          marginBottom: '1.5rem',
          padding: '1rem',
          backgroundColor: '#1a4d1a',
          borderRadius: '12px',
          border: '1px solid #2d5a3d',
          textAlign: 'center'
        }}>
          <div style={{ 
            fontSize: '0.95em', 
            color: '#4ade80',
            fontWeight: '500',
            lineHeight: '1.5'
          }}>
            💡 Use Rabby wallet or Gate wallet for good experience.
          </div>
        </div>
      )}

      <button 
        onClick={connected ? handleDisconnect : handleConnect} 
        disabled={isConnecting}
        style={{ 
          width: '100%', 
          padding: '1em',
          fontSize: '1rem',
          fontWeight: '600',
          borderRadius: '12px',
          border: 'none',
          background: connected 
            ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#fff',
          cursor: isConnecting ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          opacity: isConnecting ? 0.7 : 1
        }}
        onMouseEnter={(e) => {
          if (!isConnecting && !connected) {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.4)'
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        {isConnecting ? '⏳ Connecting...' : connected ? 'Disconnect Wallet' : '🔌 Connect Wallet'}
      </button>

      {connected && address && (
        <div style={{ marginTop: '1.5rem' }}>
          <div style={{ 
            padding: '1rem', 
            backgroundColor: '#1a4d1a', 
            borderRadius: '12px',
            border: '1px solid #2d5a3d',
            marginBottom: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ 
                width: '12px', 
                height: '12px', 
                borderRadius: '50%', 
                backgroundColor: '#4ade80',
                boxShadow: '0 0 8px rgba(74, 222, 128, 0.6)'
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.85em', color: '#aaa', marginBottom: '0.25rem' }}>
                  Connected Wallet
                </div>
                <div style={{ 
                  fontSize: '1.1em', 
                  fontWeight: '600', 
                  color: '#4ade80',
                  fontFamily: 'monospace'
                }}>
                  {address.slice(0, 6)}...{address.slice(-4)}
                </div>
              </div>
            </div>
          </div>
          {walletInfo && connectedWalletName && (
            <div style={{ 
              padding: '0.75rem', 
              backgroundColor: '#1a1a1a', 
              borderRadius: '8px',
              fontSize: '0.9em', 
              color: '#4ade80',
              textAlign: 'center',
              border: '1px solid #333'
            }}>
              ✓ {connectedWalletName}
            </div>
          )}
        </div>
      )}

      {error && (
        <div style={{ 
          marginTop: '1rem', 
          padding: '1rem', 
          backgroundColor: '#4d1a1a', 
          borderRadius: '12px',
          border: '1px solid #5a2d2d',
          color: '#f87171'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <div style={{ 
        marginTop: '2rem', 
        padding: '1rem', 
        backgroundColor: '#1a1a1a', 
        borderRadius: '12px',
        border: '1px solid #333',
        fontSize: '0.9em', 
        color: '#888',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '0.5rem' }}>
          <strong style={{ color: '#fff' }}>Network:</strong> {config.chain.name}
        </div>
        <div style={{ fontSize: '0.85em' }}>
          Ensure your wallet is connected to {config.chain.name}
        </div>
      </div>
    </div>
  )
}
