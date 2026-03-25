# Azure Static Web Apps Deployment Guide

## Overview

**Branch:** `azure-migration`  
**Target:** Azure Static Web Apps (SWA)  
**Repository:** https://github.com/Abhinavgundapaneni/Sample-Plugin

---

## Prerequisites

- Azure account (free tier: https://azure.microsoft.com/free)
- Azure CLI installed: `winget install Microsoft.AzureCLI`

---

## Step 1: Create the Azure Static Web App

### Option A: Azure Portal (recommended)

1. Go to https://portal.azure.com
2. Search for **"Static Web Apps"** → click **Create**
3. Fill in:
   - **Subscription:** your subscription
   - **Resource Group:** Create new → `sigma-plugin-rg`
   - **Name:** `sigma-venn-plugin`
   - **Plan type:** Free
   - **Region:** East US 2 (or closest to you)
4. Under **Deployment details:**
   - **Source:** GitHub
   - Click **Sign in with GitHub** and authorize
   - **Organization:** Abhinavgundapaneni
   - **Repository:** Sample-Plugin
   - **Branch:** main
5. Under **Build details:**
   - **Build Presets:** Vite
   - **App location:** `/`
   - **Api location:** (leave blank)
   - **Output location:** `dist`
6. Click **Review + Create** → **Create**

### Option B: Azure CLI

```bash
az login

az group create \
  --name sigma-plugin-rg \
  --location eastus2

az staticwebapp create \
  --name sigma-venn-plugin \
  --resource-group sigma-plugin-rg \
  --source https://github.com/Abhinavgundapaneni/Sample-Plugin \
  --branch main \
  --app-location "/" \
  --output-location "dist" \
  --login-with-github
```

---

## Step 2: GitHub Actions CI/CD (Auto-created)

Azure automatically commits a GitHub Actions workflow to your repo at:
`.github/workflows/azure-static-web-apps-<random>.yml`

This triggers on every push to `main` and:
1. Runs `npm run build`
2. Deploys `dist/` to Azure CDN globally

Verify at: **GitHub → Actions tab**

---

## Step 3: Get Your New URL

After deployment (~2 minutes):
- **Azure Portal → Static Web Apps → sigma-venn-plugin → Overview → URL**

Format: `https://<generated-name>.azurestaticapps.net`

---

## Step 4: Update Sigma Plugin URL

1. **Sigma → Administration → Plugins → Edit** your plugin
2. Replace the old URL:
   - Old: `https://glittery-duckanoo-42016f.netlify.app`
   - New: `https://<your-app>.azurestaticapps.net`
3. Save

---

## Step 5: Set Up a Custom Domain (Optional)

1. **Azure Portal → Static Web Apps → sigma-venn-plugin → Custom domains**
2. Click **Add** → enter your domain
3. Add the CNAME record to your DNS provider
4. Azure provisions SSL automatically

---

## Step 6: Decommission Old Netlify Site

Once verified on Azure:
1. Test `/2-circle` and `/3-circle` routes
2. Confirm plugin loads inside Sigma iframe
3. Delete the Netlify site: **Netlify → Sites → Site settings → Danger zone → Delete site**

---

## Verification Checklist

- [ ] Azure Static Web App created and linked to GitHub repo
- [ ] GitHub Actions workflow completed successfully (green check)
- [ ] `/2-circle` route loads without 404
- [ ] `/3-circle` route loads without 404
- [ ] CSV fallback data renders in browser (when no Sigma source connected)
- [ ] Plugin loads inside Sigma iframe
- [ ] Color panel visible in author mode, hidden in viewer mode
- [ ] Sigma plugin URL updated to new Azure URL
