import { useState } from 'react'
import WalletConnect from './components/WalletConnect'
import FusionTransfer from './components/FusionTransfer'
import type { WalletClient } from 'viem'

function App() {
  const [walletClient, setWalletClient] = useState<WalletClient | null>(null)
  const [userAddress, setUserAddress] = useState<string>('')

  const handleWalletConnected = (client: WalletClient, address: string) => {
    setWalletClient(client)
    setUserAddress(address)
  }

  const handleDisconnect = () => {
    setWalletClient(null)
    setUserAddress('')
  }

  return (
    <div className="App">
      <h1>🚀 Biconomy Fusion Mode</h1>
      <p style={{ marginBottom: '2rem', color: '#888' }}>
        Transfer tokens with gas fees paid by Biconomy Smart Account
      </p>

      {!walletClient ? (
        <WalletConnect onConnect={handleWalletConnected} />
      ) : (
        <>
          <div className="wallet-info">
            <strong>Connected:</strong> {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
            <button 
              onClick={handleDisconnect}
              style={{ marginLeft: '1rem', padding: '0.4em 0.8em' }}
            >
              Disconnect
            </button>
          </div>
          <FusionTransfer 
            walletClient={walletClient} 
            userAddress={userAddress}
          />
        </>
      )}
    </div>
  )
}

export default App


