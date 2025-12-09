import { useAccount, useDisconnect, useWalletClient, useSwitchChain, useChainId } from 'wagmi'
import { useEffect, useState } from 'react'
import WalletConnect from './components/WalletConnect'
import FusionTransfer from './components/FusionTransfer'
import { config } from './config'

function App() {
  const { address, isConnected, chain, connector } = useAccount()
  const { data: walletClient } = useWalletClient()
  const { disconnect } = useDisconnect()
  const { switchChain } = useSwitchChain()
  const chainId = useChainId()
  const [walletName, setWalletName] = useState<string>('')

  const isCorrectNetwork = chainId === config.chain.id
  const ready = Boolean(isConnected && walletClient && address && isCorrectNetwork)

  // Detect which wallet is connected
  useEffect(() => {
    if (connector) {
      setWalletName(connector.name || 'Unknown Wallet')
      console.log('🔗 Connected wallet:', connector.name, connector.id)
    }
  }, [connector])

  return (
    <div className="App">
      <h1>🚀 Biconomy Fusion Mode</h1>
      <p style={{ marginBottom: '2rem', color: '#888' }}>
        Transfer tokens with gas fees paid by Biconomy Smart Account
      </p>

      {!isConnected ? (
        <WalletConnect />
      ) : !isCorrectNetwork ? (
        <div className="card">
          <h2>⚠️ Wrong Network</h2>
          <p style={{ marginBottom: '1.5rem', color: '#888' }}>
            Please switch to {config.chain.name} to continue
          </p>
          <div style={{ 
            marginBottom: '1.5rem', 
            padding: '1rem', 
            backgroundColor: '#1a1a1a', 
            borderRadius: '8px',
            border: '1px solid #333'
          }}>
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>Current Network:</strong> {chain?.name || 'Unknown'}
            </div>
            <div>
              <strong>Required Network:</strong> {config.chain.name} (Chain ID: {config.chain.id})
            </div>
          </div>
          <button 
            onClick={() => switchChain?.({ chainId: config.chain.id })}
            style={{ width: '100%', padding: '1em', marginBottom: '1rem' }}
          >
            🔄 Switch to {config.chain.name}
          </button>
          <button 
            onClick={() => disconnect()}
            style={{ width: '100%', padding: '0.8em', backgroundColor: '#333' }}
          >
            Disconnect
          </button>
        </div>
      ) : (
        <>
          <div className="wallet-info">
            <strong>Connected:</strong> {address?.slice(0, 6)}...{address?.slice(-4)}
            <span style={{ marginLeft: '1rem', color: '#888' }}>
              via {walletName}
            </span>
            <span style={{ marginLeft: '1rem', color: '#4ade80' }}>
              ✓ {chain?.name}
            </span>
            <button 
              onClick={() => disconnect()}
              style={{ marginLeft: '1rem', padding: '0.4em 0.8em' }}
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
