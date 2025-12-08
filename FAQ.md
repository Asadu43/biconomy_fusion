# ❓ Frequently Asked Questions

## General Questions

### What is Biconomy Fusion Mode?

Fusion Mode is a mechanism that allows external wallet users (MetaMask, Rabby, Trust Wallet) to execute transactions where a Companion Account (smart account) handles the gas payment. It enables gasless transactions without requiring users to deploy their own smart accounts.

### How is this different from regular transactions?

**Regular Transaction:**
- User pays gas in native token (ETH)
- User needs ETH in wallet
- One signature per transaction

**Fusion Mode:**
- Gas paid by Biconomy (with sponsorship) or from the token being transferred
- No ETH needed (with sponsorship)
- Single signature for complex operations
- Companion Account handles execution

### Is my wallet safe?

Yes! Fusion Mode is:
- ✅ **Non-custodial**: You maintain full control
- ✅ **Stateless**: No funds stored in Companion Account
- ✅ **Transparent**: All transactions visible on-chain
- ✅ **Audited**: Biconomy contracts are audited

### What wallets are supported?

Any EIP-1193 compatible wallet:
- MetaMask
- Rabby
- Trust Wallet
- Coinbase Wallet
- Rainbow
- And more...

## Technical Questions

### What is a Companion Account?

A Companion Account is a temporary smart account created for your EOA (Externally Owned Account). It:
- Is fully owned by you
- Executes transactions on your behalf
- Pays gas fees (when sponsored)
- Returns all assets to your EOA after execution
- Doesn't store any funds

### What is a Trigger Transaction?

A trigger transaction is a signed message that:
- Authorizes the orchestration
- Includes the hash of all instructions
- Pulls tokens from your EOA to Companion Account
- Can be gasless (with ERC2612 tokens)

### What tokens support gasless triggers?

Tokens that implement ERC-2612 (permit) standard:
- USDC
- DAI
- USDT (on some chains)
- Most modern ERC-20 tokens

For non-permit tokens, you need a small amount of native gas for the `approve()` transaction.

### Can I use any token?

**With Sponsorship**: Yes, any ERC-20 token works!

**Without Sponsorship**: You can only use tokens that:
- Are the same as the trigger token
- Can be converted by solvers
- Have sufficient liquidity

### What is the difference between sponsorship and non-sponsorship?

**With Sponsorship** (`sponsorship: true`):
- ✅ Biconomy pays all gas fees
- ✅ Works with any token
- ✅ No native gas needed
- ✅ Best user experience

**Without Sponsorship**:
- ❌ Gas paid from trigger token
- ❌ Must use same token for gas
- ❌ Limited token support
- ✅ No external dependency

## Usage Questions

### How do I get test tokens?

**Ethereum Sepolia ETH:**
- [Sepolia Faucet](https://sepoliafaucet.com/)
- [Alchemy Faucet](https://sepoliafaucet.com/)
- [Infura Faucet](https://www.infura.io/faucet/sepolia)

**USDC on Ethereum Sepolia:**
- [Circle Faucet](https://faucet.circle.com/)

### Why is my transaction failing?

Common reasons:
1. **Insufficient Balance**: Check you have enough tokens
2. **Wrong Network**: Ensure wallet is on Base Sepolia
3. **Invalid Address**: Verify recipient address is correct
4. **Token Not Approved**: Non-permit tokens need approval first
5. **Network Issues**: Check internet connection

### How long does a transaction take?

Typical times:
- **Trigger Signature**: Instant (user signs)
- **Transaction Submission**: 2-5 seconds
- **Confirmation**: 10-30 seconds (depends on network)
- **Total**: Usually under 1 minute

### Can I cancel a transaction?

Once submitted, transactions cannot be cancelled. However:
- You can reject the signature request before submitting
- Failed transactions are automatically reverted
- No funds are lost on failure

### What happens if a transaction fails?

If a transaction fails:
1. All operations are reverted
2. Tokens return to your wallet
3. No funds are lost
4. You can try again
5. Error message shows the reason

## Cost Questions

### How much does it cost?

**With Sponsorship**:
- User: $0 (completely free)
- Biconomy: Pays gas fees

**Without Sponsorship**:
- User: Gas fee in tokens (typically $0.10-$1)
- Biconomy: $0

### Is there a limit on transactions?

**Testnet**: Usually no limits

**Mainnet**: Depends on:
- Your Biconomy plan
- Gas tank balance
- Rate limits (if any)

### Do I need a Biconomy API key?

**For Testing**: No, works without API key

**For Production**: Yes, recommended to:
- Get higher limits
- Access analytics
- Better support
- Custom configurations

Get API key from [Biconomy Dashboard](https://dashboard.biconomy.io/)

## Development Questions

### Can I use this in production?

Yes! Biconomy Fusion Mode is production-ready:
- ✅ Audited contracts
- ✅ Battle-tested
- ✅ Used by major dApps
- ✅ Full support available

### How do I customize for my token?

Edit `src/config.ts`:

```typescript
defaultToken: {
  address: '0xYourTokenAddress',
  decimals: 18,
  symbol: 'TOKEN',
  name: 'Your Token'
}
```

### Can I use this on other chains?

Yes! Biconomy supports multiple chains:
- Ethereum
- Polygon
- Base
- Optimism
- Arbitrum
- And more...

Update `chain` in `src/config.ts` to your desired chain.

### How do I add custom logic?

You can add multiple instructions:

```typescript
const instructions = [
  swapInstruction,
  transferInstruction,
  stakeInstruction,
  // ... more operations
]

const fusionQuote = await meeClient.getFusionQuote({
  sponsorship: true,
  trigger,
  instructions
})
```

### Can I batch multiple transfers?

Yes! See [EXAMPLES.md](./EXAMPLES.md#example-2-batch-transfer-multiple-recipients) for batch transfer implementation.

### How do I handle errors?

Implement try-catch with specific error handling:

```typescript
try {
  await transfer()
} catch (error: any) {
  if (error.code === 'USER_REJECTED') {
    // User cancelled
  } else if (error.code === 'INSUFFICIENT_FUNDS') {
    // Not enough tokens
  } else {
    // Other errors
  }
}
```

## Security Questions

### Is my private key safe?

Yes! Your private key:
- ✅ Never leaves your wallet
- ✅ Never sent to any server
- ✅ Only used to sign transactions locally
- ✅ Protected by your wallet

### Can Biconomy access my funds?

No! Biconomy:
- ❌ Cannot access your wallet
- ❌ Cannot move your funds
- ❌ Cannot sign transactions for you
- ✅ Only executes what you authorize

### What data is collected?

Minimal data:
- Transaction hashes (public on-chain)
- Wallet addresses (public)
- Network information
- No personal information

### Are smart contracts audited?

Yes! Biconomy contracts are:
- ✅ Audited by top firms
- ✅ Open source
- ✅ Battle-tested
- ✅ Regularly updated

View audits: [Biconomy Security](https://docs.biconomy.io/security)

## Troubleshooting

### "MetaMask is not installed"

**Solution**: Install MetaMask from [metamask.io](https://metamask.io)

### "Wrong network"

**Solution**: Switch to Ethereum Sepolia in MetaMask (Chain ID: 11155111)

### "Insufficient balance"

**Solution**: 
1. Check token balance in wallet
2. Get test tokens from faucet
3. Try smaller amount

### "Transaction failed"

**Solution**:
1. Check recipient address is valid
2. Ensure sufficient token balance
3. Verify network connection
4. Check console for error details

### "ERC20Permit not supported"

**Solution**: 
1. Get small amount of ETH for approve transaction
2. Or use a different token that supports permit

### "Signature request rejected"

**Solution**: This means you cancelled the transaction. Try again and approve the signature.

## Support

### Where can I get help?

- 📚 [Documentation](https://docs.biconomy.io)
- 💬 [Discord Community](https://discord.gg/biconomy)
- 🐦 [Twitter](https://twitter.com/biconomy)
- 📧 [Email Support](mailto:support@biconomy.io)
- 🔍 [Ethereum Sepolia Explorer](https://sepolia.etherscan.io)
- 🐛 [GitHub Issues](https://github.com/bcnmy/abstractjs)

### How do I report a bug?

1. Check if it's a known issue
2. Gather error details (console logs, screenshots)
3. Open issue on GitHub
4. Or report in Discord

### Can I contribute?

Yes! Contributions welcome:
- 🐛 Report bugs
- 💡 Suggest features
- 📝 Improve documentation
- 🔧 Submit pull requests

---

**Still have questions?** Join our [Discord](https://discord.gg/biconomy) or open an issue!


