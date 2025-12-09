# Permit Signature vs Approval Transaction Guide

## ✅ Expected Behavior: Permit Signature (Gasless)

When you transfer tokens, you should see:
- **Signature request** in your wallet (no gas fee)
- **No "Spending Limit"** screen
- **No "Insufficient balance for gas"** error
- Just a simple signature to approve the permit

## ❌ Problem: Approval Transaction Appearing

If you see:
- **"Spending Limit"** screen
- **Network fee** (gas cost)
- **"Insufficient Polygon (POL)"** error
- Transaction with gas fee

This means the SDK is using **on-chain approval** instead of **permit signature**.

## 🔍 Why This Happens

### 1. **Token Not Recognized by Biconomy**
The Biconomy backend doesn't have your token in its allowlist and can't detect permit support.

**Solution:**
- Go to [Biconomy Dashboard](https://dashboard.biconomy.io/)
- Add your token address to the project allowlist
- Ensure permit support is enabled for the token

### 2. **Token Doesn't Support ERC-2612 Permit**
Your token contract might not have the `permit()` function implemented.

**Check:**
```solidity
// Your token should have these functions:
function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external
function nonces(address owner) external view returns (uint256)
function DOMAIN_SEPARATOR() external view returns (bytes32)
```

**Solution:**
- Verify your token contract has ERC-2612 implemented
- Check on Polygonscan: `https://polygonscan.com/address/YOUR_TOKEN_ADDRESS#code`
- Look for `permit` function in the contract

### 3. **RPC Errors During Detection**
The SDK tries to detect permit support but RPC calls fail.

**Solution:**
- Check console logs for RPC errors
- Try a different RPC endpoint
- Ensure network is stable

### 4. **Token Not Deployed or Paused**
The token contract might be paused or not properly deployed.

**Check:**
```javascript
// In console, check:
- Token is deployed at the address
- Token is not paused
- DOMAIN_SEPARATOR returns a valid value
```

## 🛠️ How to Debug

### Step 1: Check Console Logs

Look for these logs when you try to transfer:

```javascript
✅ Good (Permit will work):
🔍 Token permit support result: ✅ Supported
✅ Token supports ERC-2612 permit
✅ No approval calls detected

❌ Bad (Approval tx will appear):
❌ APPROVAL DETECTED in quote!
❌ SDK returned approval transaction instead of permit signature
```

### Step 2: Check Fusion Quote Response

The console will show the full quote response. Look for:

```javascript
// If you see "approve" in callData:
"callData": "0x095ea7b3..." // ❌ This is approve function

// You should see permit-related data instead
```

### Step 3: Verify Token Contract

1. Go to Polygonscan
2. Search your token address
3. Go to "Contract" → "Read Contract"
4. Check if these functions exist:
   - `DOMAIN_SEPARATOR()`
   - `nonces(address)`
   - `permit(...)`

## ✅ Solutions

### Solution 1: Add Token to Biconomy Dashboard (Recommended)

1. Go to [Biconomy Dashboard](https://dashboard.biconomy.io/)
2. Select your project
3. Go to "Gas Tank" or "Tokens" section
4. Add your token address: `0x82d824fC6982fE68d6c27195A1A705FFAbc3D2b6`
5. Enable permit support
6. Save and wait a few minutes
7. Try transaction again

### Solution 2: Use a Different Token

For testing, use a known token with permit support:
- USDC on Polygon: `0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174`
- USDT on Polygon: `0xc2132D05D31c914a87C6611C10748AEb04B58e8F`

### Solution 3: Update Token Contract

If you control the token contract, ensure it implements ERC-2612:

```solidity
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract MyToken is ERC20Permit {
    constructor() ERC20("MyToken", "MTK") ERC20Permit("MyToken") {
        // ...
    }
}
```

### Solution 4: Accept Approval Transaction (Not Recommended)

If permit truly isn't supported, you can:
1. Get some MATIC for gas (~0.001 MATIC)
2. Approve the transaction
3. Then do the transfer

But this defeats the purpose of gasless transactions!

## 🎯 Expected Flow (Correct)

```
1. Fill transfer form
2. Click "Transfer with Fusion Mode"
3. See: "Using Permit Signature"
4. Wallet shows: Signature request (no gas)
5. Sign the permit
6. Transaction executes (sponsored by Biconomy)
7. Success!
```

## ❌ Wrong Flow (Approval Transaction)

```
1. Fill transfer form
2. Click "Transfer with Fusion Mode"
3. Wallet shows: "Spending Limit" with gas fee ❌
4. Error: "Insufficient Polygon (POL)" ❌
5. Need to add MATIC for gas ❌
```

## 📞 Still Having Issues?

1. **Check token address:** `0x82d824fC6982fE68d6c27195A1A705FFAbc3D2b6`
2. **Verify on Polygonscan:** Does it have `permit()` function?
3. **Check Biconomy Dashboard:** Is token allowlisted?
4. **Console logs:** What do they show?
5. **Contact Biconomy Support:** Provide token address and error logs

## 🔗 Useful Links

- [Biconomy Dashboard](https://dashboard.biconomy.io/)
- [ERC-2612 Specification](https://eips.ethereum.org/EIPS/eip-2612)
- [OpenZeppelin ERC20Permit](https://docs.openzeppelin.com/contracts/4.x/api/token/erc20#ERC20Permit)
- [Polygonscan](https://polygonscan.com/)

