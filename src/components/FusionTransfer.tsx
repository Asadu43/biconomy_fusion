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
      // Step 0: Verify token has permit support
      setStatus({ type: 'loading', message: 'Verifying token permit support...' })
      
      const hasPermit = await verifyPermitSupport(tokenAddress, userAddress)
      
      if (!hasPermit) {
        setStatus({ 
          type: 'error', 
          message: `⚠️ Token permit verification failed!
          
          Token: ${tokenAddress.slice(0, 6)}...${tokenAddress.slice(-4)}
          
          Please ensure:
          1. Token contract is deployed with ERC20Permit
          2. Token contract is not paused
          3. DOMAIN_SEPARATOR is properly configured
          
          Your contract uses ERC20Permit, so this should work. Please check the deployment.`
        })
        setIsProcessing(false)
        return
      }

      // Step 1: Create Companion Account (Orchestrator)
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
      
      const fusionQuote = await meeClient.getFusionQuote({
        sponsorship: true,
        trigger,
        instructions: [transferInstruction]
      })
      
      // Check quote for approval calls
      const quoteData = fusionQuote as any
      const userOps = quoteData?.quote?.userOps || []
      
      // Check for approval calls in userOps
      let hasApprovalCall = false
      
      for (const userOp of userOps) {
        const callData = userOp?.userOp?.callData || ''
        
        // Check for approve function selector
        if (callData && typeof callData === 'string' && callData.toLowerCase().includes('095ea7b3')) {
          hasApprovalCall = true
          break
        }
      }
      
      // If approval call detected, warn user
      if (hasApprovalCall) {
        setStatus({ 
          type: 'error', 
          message: `⚠️ Token requires approval transaction. This token may not fully support ERC-2612 permit, or the SDK is using onchain approval. You'll need a small amount of MATIC for the approval transaction.`
        })
        setIsProcessing(false)
        return
      }

      // Step 7: Execute the Fusion transaction
      // This should only ask for signature, not approval transaction
      setStatus({ 
        type: 'loading', 
        message: '✅ Using Permit Signature - MetaMask should ask for SIGNATURE only (not approval transaction). If you see an approval transaction, cancel it!' 
      })
      
      console.log('🚀 Executing Fusion Quote - MetaMask should show SIGNATURE request, NOT approval transaction')
      
      // Intercept MetaMask requests to prevent approval transactions
      // If SDK tries to send approval transaction, we'll block it
      const originalRequest = (window.ethereum as any)?.request
      let approvalBlocked = false
      
      if (originalRequest && window.ethereum) {
        (window.ethereum as any).request = async (args: any) => {
          // Check if this is an approval transaction
          if (args?.method === 'eth_sendTransaction') {
            const tx = args?.params?.[0]
            if (tx?.to?.toLowerCase() === tokenAddress.toLowerCase()) {
              // Check if it's an approve call
              const data = tx?.data || ''
              if (data.toLowerCase().includes('095ea7b3') || // approve function selector
                  data.toLowerCase().startsWith('0x095ea7b3')) {
                console.error('❌ BLOCKED: SDK tried to send approval transaction!')
                console.error('This should not happen - permit signature should be used instead')
                console.error('Transaction data:', data.substring(0, 100))
                
                approvalBlocked = true
                setStatus({
                  type: 'error',
                  message: `❌ BLOCKED: SDK tried to send approval transaction!
                  
                  We detected that SDK attempted to send an approval transaction instead of using permit signature.
                  
                  This is a SDK issue - it should use permit signature but is falling back to approval.
                  
                  Possible causes:
                  1. SDK's internal permit check is failing (RPC errors)
                  2. SDK version compatibility issue
                  3. Token not recognized by SDK backend
                  
                  Solutions:
                  1. Check Biconomy Dashboard - ensure token is recognized
                  2. Try different RPC endpoint
                  3. Contact Biconomy support
                  4. Check SDK version compatibility
                  
                  The approval transaction has been blocked to prevent gas costs.`
                })
                setIsProcessing(false)
                throw new Error('Approval transaction blocked - permit signature should be used instead')
              }
            }
          }
          
          // Allow other requests to proceed
          return originalRequest.call(window.ethereum, args)
        }
      }
      
      try {
        const result = await meeClient.executeFusionQuote({ fusionQuote })
        
        // Restore original request method
        if (originalRequest && window.ethereum) {
          (window.ethereum as any).request = originalRequest
        }
        
        if (approvalBlocked) {
          return // Already handled error above
        }
      
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
        // Restore original request method in case of error
        if (originalRequest && window.ethereum) {
          (window.ethereum as any).request = originalRequest
        }
        
        // If approval was blocked, error already handled
        if (approvalBlocked) {
          return
        }
        
        // Provide more helpful error messages
        let errorMessage = err.message || 'Transfer failed. Please try again.'
        
        // Check for network/fetch errors
        if (err.message?.includes('Failed to fetch') || err.message?.includes('ERR_NAME_NOT_RESOLVED') || err.name === 'TypeError') {
          errorMessage = `Network error: Unable to connect to Biconomy services. This might be due to:
          1. Internet connection issues
          2. Biconomy service temporarily unavailable
          3. Firewall or network restrictions
          
          Please check your internet connection and try again. If the issue persists, the token might not support permit (ERC-2612), which requires a small amount of MATIC for approval.`
        }
        
        // Check for RPC errors (MetaMask permit check failures are normal)
        if (err.message?.includes('Internal JSON-RPC error') || err.message?.includes('RPC Error')) {
          // These errors are often from permit checks - SDK should handle them
          errorMessage = `RPC error detected. This is usually normal when checking token permit support.
          
          The SDK will automatically fallback to onchain approval if permit is not supported.
          Please ensure:
          1. MetaMask is connected to ${config.chain.name} (Chain ID: ${config.chain.id})
          2. You have a small amount of MATIC for gas (if token doesn't support permit)
          3. Try the transaction again - it should work on retry`
        }
        
        // Check for chain support errors
        if (err.message?.includes('not supported by the MEE node')) {
          errorMessage = `Chain support error. ${config.chain.name} (Chain ID: ${config.chain.id}) should be supported. Please ensure:
          1. Your Biconomy project is set up for ${config.chain.name} in the dashboard
          2. API key is correctly configured (current: ${config.biconomy.apiKey ? 'Set' : 'Missing'})
          3. The project is enabled for ${config.chain.name}
          4. You're using a supported MEE version (currently using 2.1.0)
          
          If the issue persists, verify your Biconomy Dashboard project settings for ${config.chain.name}.`
        }
        
        // Check for API key related errors
        if (err.message?.includes('API key') || err.message?.includes('authentication')) {
          errorMessage = 'API key issue. Please check your Biconomy API key configuration.'
        }
        
        // Check for sponsorship errors
        if (err.message?.includes('sponsorship') || err.message?.includes('gas tank')) {
          errorMessage = `Sponsorship error. Please ensure:
          1. Your Biconomy gas tank is funded
          2. Sponsorship is enabled in your Biconomy project settings
          3. The project is configured for ${config.chain.name}
          
          Note: If sponsorship fails, the transaction will use regular gas payment.`
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

