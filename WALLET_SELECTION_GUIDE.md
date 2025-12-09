# Wallet Selection Guide

## ✅ How Wallet Selection Works

The app now **automatically uses the wallet you connect with**! 

- Connect with **MetaMask** → Transactions use MetaMask
- Connect with **Trust Wallet** → Transactions use Trust Wallet  
- Connect with **any other wallet** → Transactions use that wallet

### How It Works

1. **You select a wallet** from the connection modal
2. **App detects which wallet** you connected with
3. **Transactions automatically use** that same wallet
4. **No manual configuration needed!**

### Supported Wallets

- ✅ MetaMask
- ✅ Trust Wallet
- ✅ Coinbase Wallet
- ✅ WalletConnect (300+ wallets)
- ✅ Any injected wallet

## 🔍 Verifying Your Wallet

The app shows which wallet is connected:
- **In the header:** "Connected via: [Wallet Name]"
- **In console logs:** `🔗 Connected wallet: [Name]`
- **Before transaction:** `🔐 Using wallet: [Name]`

## ⚠️ Multiple Wallets Installed?

If you have **both MetaMask and Trust Wallet** installed:

### No Problem!
The app will use whichever wallet you connect with. Just make sure to:
1. Connect with the wallet you want to use
2. Check the "Connected via: [Wallet Name]" indicator
3. That wallet will be used for all transactions

### If Wrong Wallet Opens:
1. **Disconnect** from the app
2. **Disable the wallet you don't want** in browser extensions
3. **Reconnect** with your preferred wallet
4. Try again

### How to Check Which Wallet is Active

The app now shows:
- **"Connected via: [Wallet Name]"** in the wallet connection screen
- **"via [Wallet Name]"** in the main app header
- Console logs showing which wallet is being used for signing

### Technical Details

When multiple wallets are installed:
- They all inject into `window.ethereum`
- Trust Wallet often overrides MetaMask
- The last wallet to load becomes the default

Our app now:
1. Detects which wallet connector is active
2. Shows the wallet name in the UI
3. Logs wallet information to the console
4. Uses the correct provider for signing transactions

### Still Having Issues?

If the wrong wallet still opens:
1. Check browser console (F12) for wallet detection logs
2. Look for: `🔗 Connected wallet:` and `🔐 Using wallet:`
3. If they don't match, disable the unwanted wallet extension
4. Clear browser cache and cookies
5. Restart browser and try again

