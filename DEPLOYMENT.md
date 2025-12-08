# 🚀 Netlify Deployment Guide

Complete step-by-step guide to deploy the Biconomy Fusion Mode Demo to Netlify.

## Prerequisites

- GitHub account with the repository pushed
- Netlify account (free tier works)
- Biconomy API key and Project ID

## Step 1: Push Code to GitHub

If you haven't already, push your code to GitHub:

```bash
git add .
git commit -m "Initial commit: Biconomy Fusion Mode Demo"
git branch -M master
git remote add origin https://github.com/AliWisam/Biconomy_Fusion.git
git push -u origin master
```

## Step 2: Connect Repository to Netlify

1. **Go to Netlify**: Visit [https://app.netlify.com](https://app.netlify.com)
2. **Sign in** or create a free account
3. **Click "Add new site"** → **"Import an existing project"**
4. **Connect to Git provider**: Choose **GitHub**
5. **Authorize Netlify**: Grant Netlify access to your GitHub repositories
6. **Select repository**: Choose `AliWisam/Biconomy_Fusion`
7. **Configure build settings** (Netlify should auto-detect from `netlify.toml`):
   - **Build command**: `npm run build` (auto-filled)
   - **Publish directory**: `dist` (auto-filled)
   - **Branch to deploy**: `master` (or `main`)

## Step 3: Set Environment Variables

Before deploying, you **must** set environment variables in Netlify:

1. In the **"Site settings"** page, go to **"Environment variables"**
2. Click **"Add variable"** and add the following:

### Required Variables

| Variable Name | Description | Example |
|--------------|-------------|---------|
| `VITE_BICONOMY_API_KEY` | Your Biconomy API key | `mee_Qh35Xsqw9acrZPk5GcvNLP` |
| `VITE_BICONOMY_PROJECT_ID` | Your Biconomy Project ID | `3fa275ac-0c70-463e-ac91-6ba925aebc5c` |

### Optional Variables

| Variable Name | Description | Default |
|--------------|-------------|---------|
| `VITE_DEFAULT_TOKEN_ADDRESS` | Default token address | Empty |
| `VITE_DEFAULT_TOKEN_DECIMALS` | Token decimals | Empty |
| `VITE_DEFAULT_TOKEN_SYMBOL` | Token symbol | Empty |
| `VITE_DEFAULT_TOKEN_NAME` | Token name | Empty |

**Important**: 
- Environment variables starting with `VITE_` are exposed to the browser
- Never commit your actual API keys to GitHub
- Use Netlify's environment variables for production

## Step 4: Deploy

1. After setting environment variables, go back to **"Deploys"** tab
2. Click **"Trigger deploy"** → **"Deploy site"**
3. Netlify will:
   - Install dependencies (`npm install`)
   - Build the project (`npm run build`)
   - Deploy to a unique URL (e.g., `https://random-name-123.netlify.app`)

## Step 5: Verify Deployment

1. **Wait for build to complete** (usually 1-2 minutes)
2. **Click on the deploy URL** to open your site
3. **Test the application**:
   - Connect your wallet
   - Verify network switching works
   - Test a token transfer

## Step 6: Custom Domain (Optional)

1. Go to **"Domain settings"** in your site dashboard
2. Click **"Add custom domain"**
3. Enter your domain name
4. Follow Netlify's DNS configuration instructions

## Build Configuration

The project uses `netlify.toml` for configuration:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

This ensures:
- ✅ Correct build command
- ✅ Correct publish directory
- ✅ SPA routing works (all routes serve `index.html`)

## Troubleshooting

### Build Fails

**Error**: `Module not found` or `Cannot find module`
- **Solution**: Ensure all dependencies are in `package.json`
- Check that `node_modules` is not in `.gitignore` incorrectly

**Error**: `VITE_BICONOMY_API_KEY is not set`
- **Solution**: Add environment variables in Netlify dashboard
- Ensure variable names start with `VITE_`

### Site Loads but Wallet Doesn't Connect

**Issue**: MetaMask connection fails
- **Solution**: 
  - Check browser console for errors
  - Ensure site is served over HTTPS (Netlify does this automatically)
  - Verify network switching logic works

### Environment Variables Not Working

**Issue**: Variables set but not accessible
- **Solution**:
  - Ensure variables start with `VITE_`
  - Redeploy after adding variables
  - Check variable names match exactly (case-sensitive)

### SPA Routing Issues

**Issue**: Direct URL access shows 404
- **Solution**: The `netlify.toml` redirect rule should handle this
- Verify the redirect rule is present in your `netlify.toml`

## Continuous Deployment

Netlify automatically deploys when you push to the connected branch:

1. **Push to GitHub**: `git push origin master`
2. **Netlify detects changes**: Automatically starts new build
3. **Deploys new version**: Usually completes in 1-2 minutes

You can disable auto-deploy in **"Site settings"** → **"Build & deploy"** → **"Continuous Deployment"**

## Environment-Specific Variables

You can set different variables for different branches:

1. Go to **"Environment variables"**
2. Click **"Add variable"**
3. Select **"Deploy context"**:
   - **Production**: `master` branch
   - **Branch deploys**: Other branches
   - **Deploy previews**: Pull requests

## Monitoring

- **Deploy logs**: View in **"Deploys"** tab
- **Function logs**: If using Netlify Functions
- **Analytics**: Available in Netlify dashboard (paid feature)

## Security Best Practices

1. ✅ **Never commit** `.env` files to GitHub
2. ✅ **Use Netlify environment variables** for secrets
3. ✅ **Enable HTTPS** (automatic on Netlify)
4. ✅ **Review deploy logs** for exposed secrets
5. ✅ **Use branch protection** for production branch

## Support

- **Netlify Docs**: [https://docs.netlify.com](https://docs.netlify.com)
- **Netlify Support**: [https://www.netlify.com/support](https://www.netlify.com/support)
- **Biconomy Docs**: [https://docs.biconomy.io](https://docs.biconomy.io)

---

**Next Steps**: After deployment, test your live site and verify all functionality works correctly!

