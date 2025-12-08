# 📚 Usage Examples

Comprehensive examples for different Fusion Mode scenarios.

## Basic Token Transfer (Current Implementation)

Transfer tokens with sponsored gas fees:

```typescript
const fusionQuote = await meeClient.getFusionQuote({
  sponsorship: true,
  trigger: {
    chainId: sepolia.id,
    tokenAddress: usdcAddress,
    amount: parseUnits('10', 6)
  },
  instructions: [transferInstruction]
})

const { hash } = await meeClient.executeFusionQuote({ fusionQuote })
```

## Example 1: Transfer Without Sponsorship

User pays gas with the same token being transferred:

```typescript
const fusionQuote = await meeClient.getFusionQuote({
  trigger: {
    chainId: sepolia.id,
    tokenAddress: usdcAddress,
    amount: parseUnits('10', 6)
  },
  instructions: [transferInstruction],
  feeToken: {
    address: usdcAddress, // Must be same as trigger token
    chainId: sepolia.id
  }
})
```

## Example 2: Batch Transfer (Multiple Recipients)

Transfer to multiple addresses in one transaction:

```typescript
// Build multiple transfer instructions
const recipients = [
  { address: '0xRecipient1...', amount: parseUnits('5', 6) },
  { address: '0xRecipient2...', amount: parseUnits('3', 6) },
  { address: '0xRecipient3...', amount: parseUnits('2', 6) }
]

const instructions = await Promise.all(
  recipients.map(recipient => 
    orchestrator.buildComposable({
      type: 'default',
      data: {
        abi: erc20Abi,
        chainId: baseSepolia.id,
        to: usdcAddress,
        functionName: 'transfer',
        args: [recipient.address, recipient.amount]
      }
    })
  )
)

// Total amount needed
const totalAmount = recipients.reduce(
  (sum, r) => sum + r.amount, 
  0n
)

const fusionQuote = await meeClient.getFusionQuote({
  sponsorship: true,
  trigger: {
    chainId: baseSepolia.id,
    tokenAddress: usdcAddress,
    amount: totalAmount
  },
  instructions
})
```

## Example 3: Token Swap + Transfer

Swap tokens and transfer in one transaction:

```typescript
// 1. Build swap instruction (using Uniswap/DEX)
const swapInstruction = await orchestrator.buildComposable({
  type: 'default',
  data: {
    abi: uniswapRouterAbi,
    chainId: baseSepolia.id,
    to: uniswapRouterAddress,
    functionName: 'swapExactTokensForTokens',
    args: [
      parseUnits('10', 6), // 10 USDC
      minAmountOut,
      [usdcAddress, daiAddress],
      orchestrator.address,
      deadline
    ]
  }
})

// 2. Build transfer instruction for swapped tokens
const transferInstruction = await orchestrator.buildComposable({
  type: 'default',
  data: {
    abi: erc20Abi,
    chainId: baseSepolia.id,
    to: daiAddress,
    functionName: 'transfer',
    args: [recipientAddress, expectedDaiAmount]
  }
})

// 3. Execute both in sequence
const fusionQuote = await meeClient.getFusionQuote({
  sponsorship: true,
  trigger: {
    chainId: baseSepolia.id,
    tokenAddress: usdcAddress,
    amount: parseUnits('10', 6)
  },
  instructions: [swapInstruction, transferInstruction]
})
```

## Example 4: Approve + Transfer (Non-ERC2612 Tokens)

For tokens without permit support:

```typescript
// Check if token supports ERC2612
const supportsPermit = await checkERC2612Support(tokenAddress)

if (!supportsPermit) {
  // User needs to approve first (requires gas)
  const approveTx = await walletClient.writeContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'approve',
    args: [orchestrator.address, amount]
  })
  
  await walletClient.waitForTransactionReceipt({ hash: approveTx })
}

// Then proceed with Fusion transfer
const fusionQuote = await meeClient.getFusionQuote({
  sponsorship: true,
  trigger: {
    chainId: baseSepolia.id,
    tokenAddress: tokenAddress,
    amount: amount
  },
  instructions: [transferInstruction]
})
```

## Example 5: Conditional Transfer

Transfer only if balance is sufficient:

```typescript
// Check balance first
const balance = await walletClient.readContract({
  address: tokenAddress,
  abi: erc20Abi,
  functionName: 'balanceOf',
  args: [userAddress]
})

if (balance < amount) {
  throw new Error(`Insufficient balance. Have: ${formatUnits(balance, 6)}, Need: ${formatUnits(amount, 6)}`)
}

// Proceed with transfer
const fusionQuote = await meeClient.getFusionQuote({
  sponsorship: true,
  trigger: {
    chainId: baseSepolia.id,
    tokenAddress: tokenAddress,
    amount: amount
  },
  instructions: [transferInstruction]
})
```

## Example 6: Transfer with Event Listening

Monitor transaction progress:

```typescript
const { hash } = await meeClient.executeFusionQuote({ fusionQuote })

console.log('Transaction submitted:', hash)

// Poll for status
const checkStatus = async () => {
  try {
    const receipt = await meeClient.waitForSupertransactionReceipt({ 
      hash,
      timeout: 60000 // 60 seconds
    })
    
    console.log('Transaction confirmed!')
    console.log('Block:', receipt.blockNumber)
    console.log('Status:', receipt.status)
    
    return receipt
  } catch (error) {
    console.error('Transaction failed:', error)
    throw error
  }
}

await checkStatus()
```

## Example 7: Error Handling

Comprehensive error handling:

```typescript
try {
  const fusionQuote = await meeClient.getFusionQuote({
    sponsorship: true,
    trigger: {
      chainId: baseSepolia.id,
      tokenAddress: tokenAddress,
      amount: amount
    },
    instructions: [transferInstruction]
  })

  const { hash } = await meeClient.executeFusionQuote({ fusionQuote })
  
  const receipt = await meeClient.waitForSupertransactionReceipt({ hash })
  
  if (receipt.status === 'success') {
    console.log('✅ Transfer successful!')
  } else {
    console.error('❌ Transfer failed')
  }
  
} catch (error: any) {
  if (error.code === 'USER_REJECTED') {
    console.log('User rejected transaction')
  } else if (error.code === 'INSUFFICIENT_FUNDS') {
    console.error('Insufficient token balance')
  } else if (error.code === 'NETWORK_ERROR') {
    console.error('Network connection issue')
  } else {
    console.error('Unexpected error:', error.message)
  }
}
```

## Example 8: Get Transaction Details

Fetch detailed transaction information:

```typescript
const { hash } = await meeClient.executeFusionQuote({ fusionQuote })

// Wait for confirmation
const receipt = await meeClient.waitForSupertransactionReceipt({ hash })

// Get transaction details
const transaction = await walletClient.getTransaction({ hash })

console.log('Transaction Details:')
console.log('- From:', transaction.from)
console.log('- To:', transaction.to)
console.log('- Value:', transaction.value)
console.log('- Gas Used:', receipt.gasUsed)
console.log('- Block Number:', receipt.blockNumber)
console.log('- Timestamp:', receipt.timestamp)
```

## Example 9: Estimate Gas Before Transfer

Check gas costs before executing:

```typescript
// Get quote first
const fusionQuote = await meeClient.getFusionQuote({
  sponsorship: false, // Check actual gas cost
  trigger: {
    chainId: baseSepolia.id,
    tokenAddress: usdcAddress,
    amount: parseUnits('10', 6)
  },
  instructions: [transferInstruction],
  feeToken: {
    address: usdcAddress,
    chainId: baseSepolia.id
  }
})

// Quote includes gas estimation
console.log('Estimated gas fee:', fusionQuote.gasFee)
console.log('Total cost:', fusionQuote.totalCost)

// User can decide to proceed or not
if (userApproves) {
  const { hash } = await meeClient.executeFusionQuote({ fusionQuote })
}
```

## Example 10: React Hook for Fusion Transfer

Reusable React hook:

```typescript
import { useState } from 'react'

export function useFusionTransfer(walletClient: WalletClient) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)

  const transfer = async (
    tokenAddress: string,
    recipientAddress: string,
    amount: bigint,
    decimals: number
  ) => {
    setIsLoading(true)
    setError(null)
    setTxHash(null)

    try {
      // Create orchestrator
      const orchestrator = await toMultichainNexusAccount({
        chainConfigurations: [{
          chain: baseSepolia,
          transport: http(),
          version: getMEEVersion(MEEVersion.V2_1_0)
        }],
        signer: walletClient
      })

      const meeClient = await createMeeClient({ account: orchestrator })

      // Build instruction
      const instruction = await orchestrator.buildComposable({
        type: 'default',
        data: {
          abi: erc20Abi,
          chainId: baseSepolia.id,
          to: tokenAddress,
          functionName: 'transfer',
          args: [recipientAddress, amount]
        }
      })

      // Get quote and execute
      const fusionQuote = await meeClient.getFusionQuote({
        sponsorship: true,
        trigger: {
          chainId: baseSepolia.id,
          tokenAddress: tokenAddress,
          amount: amount
        },
        instructions: [instruction]
      })

      const { hash } = await meeClient.executeFusionQuote({ fusionQuote })
      setTxHash(hash)

      await meeClient.waitForSupertransactionReceipt({ hash })

      return hash
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return { transfer, isLoading, error, txHash }
}
```

## Testing Tips

### Test on Testnet First
Always test on Base Sepolia before mainnet:
- Get test tokens from faucets
- Verify all flows work correctly
- Test error scenarios

### Test Different Tokens
- ERC2612 tokens (USDC, DAI)
- Non-permit tokens
- Different decimals (6, 18, etc.)

### Test Edge Cases
- Insufficient balance
- Invalid addresses
- Network disconnection
- User rejection

## Resources

- 📚 [Biconomy Docs](https://docs.biconomy.io)
- 🔧 [Viem Documentation](https://viem.sh)
- 💬 [Get Help on Discord](https://discord.gg/biconomy)

---

Need more examples? Open an issue or contribute your own! 🚀


