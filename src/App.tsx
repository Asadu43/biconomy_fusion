import { useAccount, useDisconnect, useWalletClient, useSwitchChain, useChainId } from 'wagmi'
import WalletConnect from './components/WalletConnect'
import FusionTransfer from './components/FusionTransfer'
import { config } from './config'

function App() {
  const { address, isConnected, chain } = useAccount()
  const { data: walletClient } = useWalletClient()
  const { disconnect } = useDisconnect()
  const { switchChain } = useSwitchChain()
  const chainId = useChainId()

  const isCorrectNetwork = chainId === config.chain.id

  return (
    <div className="App">
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ 
          margin: '0 0 0.75rem 0',
          fontSize: '2.5rem',
          fontWeight: '700',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Biconomy Fusion
        </h1>
        <p style={{ margin: 0, color: '#888', fontSize: '1.05em' }}>
          Transfer tokens with gas fees sponsored by Biconomy Smart Account
        </p>
      </div>

      {!isConnected ? (
        <WalletConnect />
      ) : !isCorrectNetwork ? (
        <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2 style={{ 
              margin: '0 0 0.5rem 0',
              fontSize: '1.75rem',
              fontWeight: '600',
              color: '#f87171'
            }}>
              ⚠️ Wrong Network
            </h2>
            <p style={{ margin: 0, color: '#888', fontSize: '0.95em' }}>
              Please switch to {config.chain.name} to continue
            </p>
          </div>
          <div style={{ 
            marginBottom: '1.5rem', 
            padding: '1.25rem', 
            backgroundColor: '#1a1a1a', 
            borderRadius: '12px',
            border: '1px solid #333'
          }}>
            <div style={{ 
              marginBottom: '1rem',
              paddingBottom: '1rem',
              borderBottom: '1px solid #333'
            }}>
              <div style={{ fontSize: '0.85em', color: '#888', marginBottom: '0.5rem' }}>
                Current Network
              </div>
              <div style={{ fontSize: '1.1em', fontWeight: '600', color: '#f87171' }}>
                {chain?.name || 'Unknown'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.85em', color: '#888', marginBottom: '0.5rem' }}>
                Required Network
              </div>
              <div style={{ fontSize: '1.1em', fontWeight: '600', color: '#4ade80' }}>
                {config.chain.name} (Chain ID: {config.chain.id})
              </div>
            </div>
          </div>
          <button 
            onClick={async () => {
              try {
                await switchChain?.({ chainId: config.chain.id })
              } catch (error: any) {
                console.error('Failed to switch network:', error)
                // If switch fails, try to add the network first
                if (error?.code === 4902 || error?.message?.includes('Unrecognized chain')) {
                  try {
                    await (window.ethereum as any)?.request({
                      method: 'wallet_addEthereumChain',
                      params: [{
                        chainId: `0x${config.chain.id.toString(16)}`,
                        chainName: config.chain.name,
                        nativeCurrency: {
                          name: 'MATIC',
                          symbol: 'MATIC',
                          decimals: 18
                        },
                        rpcUrls: config.chain.rpcUrls.default.http,
                        blockExplorerUrls: [config.explorer.baseUrl]
                      }]
                    })
                  } catch (addError) {
                    console.error('Failed to add network:', addError)
                  }
                }
              }
            }}
            style={{ 
              width: '100%', 
              padding: '1.25em', 
              marginBottom: '1rem',
              fontSize: '1rem',
              fontWeight: '600',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            🔄 Switch to {config.chain.name}
          </button>
          <button 
            onClick={() => disconnect()}
            style={{ 
              width: '100%', 
              padding: '1em',
              fontSize: '0.95em',
              fontWeight: '500',
              borderRadius: '12px',
              border: '1px solid #333',
              backgroundColor: '#1a1a1a',
              color: '#888',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#222'
              e.currentTarget.style.color = '#fff'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#1a1a1a'
              e.currentTarget.style.color = '#888'
            }}
          >
            Disconnect
          </button>
        </div>
      ) : (
        <>
          <div style={{ 
            maxWidth: '700px', 
            margin: '0 auto 2rem auto',
            padding: '1.25rem',
            backgroundColor: '#1a1a1a',
            borderRadius: '16px',
            border: '1px solid #333',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
              <div style={{ 
                width: '12px', 
                height: '12px', 
                borderRadius: '50%', 
                backgroundColor: '#4ade80',
                boxShadow: '0 0 8px rgba(74, 222, 128, 0.6)'
              }} />
              <div>
                <div style={{ fontSize: '0.85em', color: '#888', marginBottom: '0.25rem' }}>
                  Connected Wallet
                </div>
                <div style={{ 
                  fontSize: '1.1em', 
                  fontWeight: '600', 
                  color: '#fff',
                  fontFamily: 'monospace'
                }}>
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </div>
              </div>
            </div>
            <button 
              onClick={() => disconnect()}
              style={{ 
                padding: '0.5rem 1rem',
                backgroundColor: '#4d1a1a',
                border: '1px solid #5a2d2d',
                borderRadius: '8px',
                color: '#f87171',
                cursor: 'pointer',
                fontSize: '0.9em',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#5a2d2d'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#4d1a1a'
              }}
            >
              Disconnect
            </button>
          </div>
          
          {walletClient && address && (
            <FusionTransfer 
              walletClient={walletClient} 
              userAddress={address}
            />
          )}
        </>
      )}
    </div>
  )
}

export default App
