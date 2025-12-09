import { useState, useEffect } from 'react'
import { 
  createMeeClient,
  toMultichainNexusAccount,
  getMEEVersion,
  MEEVersion,
  type Trigger
} from '@biconomy/abstractjs'
import { 
  http, 
  parseUnits,
  formatUnits,
  createPublicClient,
  type WalletClient
} from 'viem'
import { config } from '../config'

// Token ABI with ERC20Permit support (complete ABI from contract)
const tokenAbi = [
  {
    inputs: [
      { internalType: 'address', name: 'spender', type: 'address' },
      { internalType: 'uint256', name: 'value', type: 'uint256' }
    ],
    name: 'approve',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: 'owner', type: 'address' },
      { internalType: 'address', name: 'spender', type: 'address' },
      { internalType: 'uint256', name: 'value', type: 'uint256' },
      { internalType: 'uint256', name: 'deadline', type: 'uint256' },
      { internalType: 'uint8', name: 'v', type: 'uint8' },
      { internalType: 'bytes32', name: 'r', type: 'bytes32' },
      { internalType: 'bytes32', name: 's', type: 'bytes32' }
    ],
    name: 'permit',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'value', type: 'uint256' }
    ],
    name: 'transfer',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: 'from', type: 'address' },
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'value', type: 'uint256' }
    ],
    name: 'transferFrom',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: 'owner', type: 'address' },
      { internalType: 'address', name: 'spender', type: 'address' }
    ],
    name: 'allowance',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'DOMAIN_SEPARATOR',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: 'owner', type: 'address' }],
    name: 'nonces',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'name',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'paused',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const

interface FusionTransferProps {
  walletClient: WalletClient
  userAddress: string
}

// Helper to get the currently connected wallet provider
const getConnectedWalletProvider = (walletClient: WalletClient) => {
  if (typeof window === 'undefined' || !window.ethereum) {
    return null
  }

  // Get the transport from wallet client to identify which wallet is connected
  const transport = (walletClient as any).transport
  const connectorName = (walletClient as any).connector?.name || ''
  
  console.log('🔍 Detecting wallet from client:', connectorName)

  // If multiple providers exist
  if ((window.ethereum as any).providers) {
    const providers = (window.ethereum as any).providers
    
    // Try to match by connector name
    if (connectorName.toLowerCase().includes('trust')) {
      const trustWallet = providers.find((p: any) => p.isTrust || p.isTrustWallet)
      if (trustWallet) {
        console.log('✅ Using Trust Wallet provider')
        return trustWallet
      }
    }
    
    if (connectorName.toLowerCase().includes('metamask')) {
      const metamask = providers.find((p: any) => p.isMetaMask)
      if (metamask) {
        console.log('✅ Using MetaMask provider')
        return metamask
      }
    }
    
    if (connectorName.toLowerCase().includes('coinbase')) {
      const coinbase = providers.find((p: any) => p.isCoinbaseWallet)
      if (coinbase) {
        console.log('✅ Using Coinbase Wallet provider')
        return coinbase
      }
    }
  }
  
  // Single provider or default
  console.log('✅ Using default ethereum provider')
  return window.ethereum
}

// Add this helper function to verify permit support
const verifyPermitSupport = async (
  tokenAddress: string,
  userAddress: string
): Promise<boolean> => {
  // Create public client for reading contracts
  const publicClient = createPublicClient({
    chain: config.chain,
    transport: http()
  })
  try {
    // Check DOMAIN_SEPARATOR (most reliable for ERC20Permit)
    try {
      const domainSeparator = await publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: tokenAbi,
        functionName: 'DOMAIN_SEPARATOR'
      })
      
      if (domainSeparator && domainSeparator !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
        return true
      }
    } catch {
      // Continue to next check
    }
    
    // Check nonces function (ERC20Permit has nonces mapping)
    try {
      await publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: tokenAbi,
        functionName: 'nonces',
        args: [userAddress as `0x${string}`]
      })
      return true
    } catch {
      // Continue
    }
    
    // If checks fail, allow SDK to handle detection
    return true
  } catch {
    // Allow SDK to handle permit detection
    return true
  }
}

export default function FusionTransfer({ walletClient, userAddress }: FusionTransferProps) {
  const [recipientAddress, setRecipientAddress] = useState('')
  const [tokenAddress, setTokenAddress] = useState(config.defaultToken.address)
  const [amount, setAmount] = useState('')
  const [decimals, setDecimals] = useState(config.defaultToken.decimals)
  const [isProcessing, setIsProcessing] = useState(false)
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | 'loading' | ''
    message: string
  }>({ type: '', message: '' })
  const [txHash, setTxHash] = useState('')
  const [detectedWallet, setDetectedWallet] = useState<string>('')
  
  // Token info state
  const [tokenInfo, setTokenInfo] = useState<{
    name: string
    symbol: string
    balance: string
    isLoading: boolean
  }>({
    name: '',
    symbol: '',
    balance: '',
    isLoading: false
  })

  // Detect wallet on mount
  useEffect(() => {
    const provider = getConnectedWalletProvider(walletClient)
    if (provider) {
      const name = (provider as any).isMetaMask ? 'MetaMask' : 
                   (provider as any).isTrust || (provider as any).isTrustWallet ? 'Trust Wallet' : 
                   (provider as any).isCoinbaseWallet ? 'Coinbase Wallet' : 
                   'Your Wallet'
      setDetectedWallet(name)
      console.log('💼 Wallet detected for transactions:', name)
    }
  }, [walletClient])

  // Filter out expected RPC errors from console (these are normal during permit checks)
  useEffect(() => {
    const originalError = console.error
    const originalWarn = console.warn
    
    console.error = (...args: any[]) => {
      const message = args[0]?.toString() || ''
      // Filter out expected MetaMask RPC errors during permit checks
      if (message.includes('MetaMask - RPC Error') && 
          message.includes('Internal JSON-RPC error') &&
          message.includes('-32603')) {
        // These are expected errors when checking permit support - silently ignore
        return
      }
      originalError.apply(console, args)
    }
    
    console.warn = (...args: any[]) => {
      const message = args[0]?.toString() || ''
      // Filter out expected RPC warnings
      if (message.includes('RPC Error') && message.includes('-32603')) {
        return
      }
      originalWarn.apply(console, args)
    }
    
    return () => {
      console.error = originalError
      console.warn = originalWarn
    }
  }, [])

  // Function to fetch token info and balance
  const fetchTokenInfo = async () => {
    if (!tokenAddress || !userAddress) return
    
    setTokenInfo(prev => ({ ...prev, isLoading: true }))
    
    try {
      const publicClient = createPublicClient({
        chain: config.chain,
        transport: http()
      })
      
      // Fetch token info and balance in parallel
      const [name, symbol, balance, tokenDecimals] = await Promise.all([
        publicClient.readContract({
          address: tokenAddress as `0x${string}`,
          abi: tokenAbi,
          functionName: 'name'
        }).catch(() => 'Unknown'),
        publicClient.readContract({
          address: tokenAddress as `0x${string}`,
          abi: tokenAbi,
          functionName: 'symbol'
        }).catch(() => 'Unknown'),
        publicClient.readContract({
          address: tokenAddress as `0x${string}`,
          abi: tokenAbi,
          functionName: 'balanceOf',
          args: [userAddress as `0x${string}`]
        }).catch(() => 0n),
        publicClient.readContract({
          address: tokenAddress as `0x${string}`,
          abi: tokenAbi,
          functionName: 'decimals'
        }).catch(() => 18)
      ])
      
      const tokenDecimalsNum = Number(tokenDecimals)
      
      // Update decimals if different
      if (tokenDecimalsNum !== decimals) {
        setDecimals(tokenDecimalsNum)
      }
      
      setTokenInfo({
        name: name as string,
        symbol: symbol as string,
        balance: formatUnits(balance as bigint, tokenDecimalsNum),
        isLoading: false
      })
    } catch (error) {
      console.error('Error fetching token info:', error)
      setTokenInfo(prev => ({ ...prev, isLoading: false }))
    }
  }

  // Fetch token info when token address or user address changes
  useEffect(() => {
    fetchTokenInfo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenAddress, userAddress])

  const handleTransfer = async () => {
    if (!recipientAddress || !tokenAddress || !amount) {
      setStatus({ type: 'error', message: 'Please fill in all fields' })
      return
    }

    setIsProcessing(true)
    setStatus({ type: 'loading', message: 'Initializing Fusion Mode...' })
    setTxHash('')

    try {
      // Step 0: Verify wallet client is properly connected
      if (!walletClient) {
        setStatus({ 
          type: 'error', 
          message: 'Wallet client not available. Please reconnect your wallet.' 
        })
        setIsProcessing(false)
        return
      }

      // Verify the wallet client account matches the connected address
      if (walletClient.account?.address?.toLowerCase() !== userAddress.toLowerCase()) {
        setStatus({ 
          type: 'error', 
          message: `Wallet mismatch detected. Please disconnect and reconnect your wallet.
          
          Expected: ${userAddress}
          Got: ${walletClient.account?.address || 'none'}` 
        })
        setIsProcessing(false)
        return
      }

      // Get wallet provider (no logging for speed)
      const provider = getConnectedWalletProvider(walletClient)
      if (!provider) {
        throw new Error('No wallet provider found.')
      }
      
      const isTrustWallet = (provider as any).isTrust || (provider as any).isTrustWallet
      const isMetaMask = (provider as any).isMetaMask
      const walletName = isMetaMask ? 'MetaMask' : isTrustWallet ? 'Trust Wallet' : 'Wallet'
      
      setStatus({ type: 'loading', message: `Using ${walletName} for signing...` })
      
      // Step 2: Create Companion Account (Orchestrator) with the correct wallet
      setStatus({ type: 'loading', message: 'Creating Companion Account...' })
      
      const orchestrator = await toMultichainNexusAccount({
        chainConfigurations: [{
          chain: config.chain,
          transport: http(),
          version: getMEEVersion(MEEVersion.V2_1_0)
        }],
        signer: walletClient as any
      })

      // Step 2: Create MEE Client with API key
      setStatus({ type: 'loading', message: 'Initializing MEE Client...' })
      
      if (!config.biconomy.apiKey) {
        throw new Error('Biconomy API key is not configured. Please check your configuration.')
      }
      
      const meeClient = await createMeeClient({
        account: orchestrator,
        apiKey: config.biconomy.apiKey
      })

      // Step 3: Parse transfer amount
      const transferAmount = parseUnits(amount, decimals)

      // Step 4: Build transfer instruction
      setStatus({ type: 'loading', message: 'Building transfer instruction...' })
      
      const transferInstruction = await orchestrator.buildComposable({
        type: 'default',
        data: {
          abi: tokenAbi, // Using exact token ABI with permit support
          chainId: config.chain.id,
          to: tokenAddress,
          functionName: 'transfer',
          args: [recipientAddress as `0x${string}`, transferAmount]
        }
      })

      // Step 5: Create Fusion trigger - ensure it's configured for permit
      const trigger: Trigger = {
        chainId: config.chain.id,
        tokenAddress: tokenAddress as `0x${string}`,
        amount: transferAmount
        // SDK should automatically detect permit and use it
      }

      // Step 6: Get Fusion Quote with Sponsorship
      setStatus({ type: 'loading', message: 'Getting Fusion quote...' })
      
      // Get fusion quote (minimal logging for speed)
      console.log('⚡ Getting fusion quote...')
      
      const fusionQuote = await meeClient.getFusionQuote({
        sponsorship: true,
        trigger,
        instructions: [transferInstruction]
      })
      
      // Quick check for approval calls (no detailed logging)
      const quoteData = fusionQuote as any
      const userOps = quoteData?.quote?.userOps || []
      
      let hasApprovalCall = false
      for (const userOp of userOps) {
        const callData = userOp?.userOp?.callData || ''
        if (callData && typeof callData === 'string' && callData.toLowerCase().includes('095ea7b3')) {
          hasApprovalCall = true
          break
        }
      }
      
      if (hasApprovalCall) {
        setStatus({ 
          type: 'error', 
          message: `⚠️ This token requires approval transaction (needs gas). Please ensure you have ~0.001 MATIC for approval.`
        })
        setIsProcessing(false)
        return
      }

      // Execute transaction immediately (no delays)
      setStatus({ type: 'loading', message: `⚡ Opening ${walletName} for signature...` })
      console.log(`⚡ Executing fusion quote...`)
      
      try {
        const result = await meeClient.executeFusionQuote({ fusionQuote })
      
        // Extract hash - ensure it's a string
        const transactionHash = result?.hash || (result as any)?.transactionHash || ''
        
        if (!transactionHash) {
          throw new Error('Transaction hash not received from SDK')
        }
        
        setTxHash(String(transactionHash))
        setStatus({ type: 'loading', message: 'Transaction submitted! Waiting for confirmation...' })

        // Step 8: Wait for completion
        await meeClient.waitForSupertransactionReceipt({ hash: transactionHash })

        // Refresh token balance after successful transfer
        await fetchTokenInfo()

        setStatus({ 
          type: 'success', 
          message: `✅ Transfer successful! ${formatUnits(transferAmount, decimals)} ${tokenInfo.symbol || 'tokens'} sent to ${recipientAddress.slice(0, 6)}...${recipientAddress.slice(-4)}` 
        })

        // Reset form
        setRecipientAddress('')
        setAmount('')

      } catch (err: any) {
        
        // Simplified error messages
        let errorMessage = err.message || 'Transfer failed. Please try again.'
        
        if (err.code === 4001 || err.message?.includes('User rejected')) {
          errorMessage = 'Transaction rejected by user.'
        } else if (err.message?.includes('not been authorized')) {
          errorMessage = 'Wallet not authorized. Please disconnect and reconnect.'
        } else if (err.message?.includes('Failed to fetch')) {
          errorMessage = 'Network error. Check your internet connection.'
        }
        
        setStatus({ 
          type: 'error', 
          message: errorMessage
        })
      }
    } catch (outerErr: any) {
      setStatus({
        type: 'error',
        message: outerErr.message || 'An unexpected error occurred'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="card">
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ marginBottom: '0.5rem' }}>💸 Fusion Mode Transfer</h2>
        <p style={{ color: '#888', fontSize: '0.9em' }}>
          Transfer tokens with gas fees sponsored by Biconomy
        </p>
        {detectedWallet && (
          <>
            <div style={{ 
              marginTop: '0.75rem', 
              padding: '0.5rem 0.75rem', 
              backgroundColor: detectedWallet === 'Trust Wallet' ? '#4d1a1a' : '#1a4d1a',
              border: `1px solid ${detectedWallet === 'Trust Wallet' ? '#5a2d2d' : '#2d5a3d'}`,
              borderRadius: '6px',
              fontSize: '0.85em',
              color: detectedWallet === 'Trust Wallet' ? '#f87171' : '#4ade80'
            }}>
              {detectedWallet === 'Trust Wallet' ? '⚠️' : '✓'} Transactions will be signed with <strong>{detectedWallet}</strong>
            </div>
            
            {detectedWallet === 'Trust Wallet' && (
              <div style={{ 
                marginTop: '0.5rem', 
                padding: '0.75rem', 
                backgroundColor: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '6px',
                fontSize: '0.85em',
                color: '#aaa'
              }}>
                <div style={{ color: '#f87171', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  ⚠️ Trust Wallet Limitation
                </div>
                <div style={{ fontSize: '0.9em', lineHeight: '1.5' }}>
                  Trust Wallet has limited support for <strong>EIP-712 permit signatures</strong>.
                  <br/><br/>
                  <strong>What this means:</strong>
                  <ul style={{ marginTop: '0.5rem', marginBottom: '0.5rem', paddingLeft: '1.5rem' }}>
                    <li>You may see an <strong>approval transaction</strong> (not just signature)</li>
                    <li>This approval requires a <strong>small gas fee</strong> (~0.001 MATIC)</li>
                    <li>You need MATIC in your wallet for the approval</li>
                  </ul>
                  <strong>Recommendation:</strong> Use <strong>MetaMask</strong> for fully gasless transactions with permit signatures.
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Token Info Display */}
      {tokenAddress && (
        <div style={{ 
          marginBottom: '1.5rem', 
          padding: '1rem', 
          backgroundColor: '#1a1a1a', 
          borderRadius: '8px',
          border: '1px solid #333'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1em', color: '#fff' }}>
                {tokenInfo.symbol || 'Loading...'} {tokenInfo.name && `(${tokenInfo.name})`}
              </h3>
              <small style={{ color: '#888', fontSize: '0.85em' }}>
                {tokenAddress.slice(0, 6)}...{tokenAddress.slice(-4)}
              </small>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.9em', color: '#888', marginBottom: '0.25rem' }}>Your Balance</div>
              <div style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#4ade80' }}>
                {tokenInfo.isLoading ? 'Loading...' : tokenInfo.balance ? `${tokenInfo.balance} ${tokenInfo.symbol || ''}` : '0'}
              </div>
            </div>
          </div>
          <div style={{ fontSize: '0.85em', color: '#666' }}>
            Decimals: {decimals} | Network: {config.chain.name}
          </div>
        </div>
      )}

      <div className="form-group">
        <label htmlFor="tokenAddress">Token Address</label>
        <input
          id="tokenAddress"
          type="text"
          placeholder="0x..."
          value={tokenAddress}
          onChange={(e) => setTokenAddress(e.target.value as `0x${string}`)}
          disabled={isProcessing}
        />
      </div>

      <div className="form-group">
        <label htmlFor="decimals">Token Decimals</label>
        <input
          id="decimals"
          type="number"
          placeholder="18"
          value={decimals}
          onChange={(e) => setDecimals(Number(e.target.value))}
          disabled={isProcessing}
        />
      </div>

      <div className="form-group">
        <label htmlFor="recipient">Recipient Address</label>
        <input
          id="recipient"
          type="text"
          placeholder="0x..."
          value={recipientAddress}
          onChange={(e) => setRecipientAddress(e.target.value)}
          disabled={isProcessing}
        />
      </div>

      <div className="form-group">
        <label htmlFor="amount">Amount</label>
        <input
          id="amount"
          type="text"
          placeholder="0.0001"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={isProcessing}
        />
      </div>

      {/* Sponsorship Status Indicator */}
      <div style={{ 
        marginTop: '1rem', 
        padding: '0.75rem', 
        backgroundColor: config.biconomy.apiKey ? '#1a4d1a' : '#4d1a1a',
        borderRadius: '8px',
        fontSize: '0.9em',
        border: `1px solid ${config.biconomy.apiKey ? '#2d5a3d' : '#5a2d2d'}`
      }}>
        {config.biconomy.apiKey ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#4ade80', fontSize: '1.2em' }}>✅</span>
            <div style={{ flex: 1 }}>
              <strong style={{ color: '#4ade80' }}>Sponsorship Enabled</strong>
              <div style={{ marginTop: '0.25rem', fontSize: '0.85em', color: '#aaa' }}>
                Gas fees will be sponsored by Biconomy
              </div>
            </div>
          </div>
        ) : (
          <strong style={{ color: '#f87171' }}>❌ Sponsorship Disabled - API Key Missing</strong>
        )}
      </div>

      <button 
        onClick={handleTransfer}
        disabled={isProcessing || !recipientAddress || !tokenAddress || !amount}
        style={{ width: '100%', padding: '1em', marginTop: '1rem' }}
      >
        {isProcessing ? '⏳ Processing...' : '🚀 Transfer with Fusion Mode'}
      </button>

      {status.message && (
        <div className={`status ${status.type}`}>
          {status.message}
        </div>
      )}

      {txHash && (
        <div style={{ 
          marginTop: '1rem', 
          padding: '0.75rem', 
          backgroundColor: '#1a1a1a', 
          borderRadius: '8px',
          border: '1px solid #333'
        }}>
          <div style={{ fontSize: '0.9em', color: '#888', marginBottom: '0.5rem' }}>Transaction Hash:</div>
          <div style={{ 
            wordBreak: 'break-all', 
            fontFamily: 'monospace',
            fontSize: '0.85em',
            padding: '0.5rem',
            backgroundColor: '#0a0a0a',
            borderRadius: '4px'
          }}>
            <a 
              href={config.explorer.tx(txHash)}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#646cff', textDecoration: 'none' }}
            >
              {txHash}
            </a>
          </div>
          <div style={{ marginTop: '0.5rem' }}>
            <a 
              href={config.explorer.tx(txHash)}
              target="_blank"
              rel="noopener noreferrer"
              style={{ 
                color: '#4ade80', 
                fontSize: '0.85em',
                textDecoration: 'none'
              }}
            >
              View on MEE Scan →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

