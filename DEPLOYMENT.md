# ProposalForge — Deployment Guide

This guide walks you through deploying ProposalForge using:
- **Neon** — free PostgreSQL database (no expiry)
- **Railway** — backend API server
- **Vercel** — frontend (static files)

---

## Overview

```
Browser → Vercel (React frontend)
              ↓ API calls (VITE_API_URL)
         Railway (Express backend)
              ↓ DATABASE_URL
           Neon (PostgreSQL)
```

Total estimated time: **~30 minutes**

---

## Step 1 — Set Up Neon (Database)

1. Go to [neon.tech](https://neon.tech) and create a free account.
2. Click **"New Project"**, give it a name (e.g. `proposalforge`), and choose the region closest to your users.
3. Once created, go to the **Connection Details** panel.
4. Copy the **Connection string** — it looks like:
   ```
   postgresql://user:pass@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
   ```
5. Save this connection string — you will need it in Step 2.

> The database schema is created automatically when the server first starts, so you don't need to run any SQL manually.

---

## Step 2 — Set Up Firebase (Auth)

> Skip this step if you already have a Firebase project configured.

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and create a new project.
2. In the left sidebar go to **Build → Authentication** and click **"Get started"**.
3. Enable the **Email/Password** sign-in method (and optionally Google).
4. Go to **Project Settings** (gear icon) → **General** tab → scroll to **Your apps**.
5. Click **"Add app"** → choose **Web** → register the app.
6. Copy the Firebase config values — you will need:
   - `apiKey` → `VITE_FIREBASE_API_KEY`
   - `projectId` → `VITE_FIREBASE_PROJECT_ID`
   - `appId` → `VITE_FIREBASE_APP_ID`
7. Go to **Project Settings** → **Service Accounts** tab.
8. Click **"Generate new private key"** — a JSON file will download.
9. Open the JSON file in a text editor, and **collapse it to a single line** (remove all newlines). This becomes your `FIREBASE_SERVICE_ACCOUNT_JSON` variable.

---

## Step 3 — Deploy the Backend on Railway

1. Go to [railway.app](https://railway.app) and sign in with GitHub.
2. Click **"New Project"** → **"Deploy from GitHub repo"**.
3. Select your `proposalforge` repository and click **"Deploy Now"**.
4. Railway will detect the `railway.json` file and start building automatically.
5. Once the build finishes, click on your service → go to the **"Settings"** tab.
6. Under **"Networking"**, click **"Generate Domain"** — copy the URL (e.g. `https://your-project.up.railway.app`).
7. Go to the **"Variables"** tab and add all of the following:

   | Variable | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | Your Neon connection string from Step 1 |
   | `FRONTEND_URL` | Leave blank for now — fill in after Step 4 |
   | `PUBLIC_URL` | Your Railway URL (e.g. `https://your-project.up.railway.app`) |
   | `FIREBASE_SERVICE_ACCOUNT_JSON` | The single-line JSON from Step 2 |
   | `GEMINI_API_KEY` | Your Gemini API key from [aistudio.google.com](https://aistudio.google.com/app/apikey) |
   | `RESEND_API_KEY` | *(Optional)* Your Resend key — for sending emails to clients |
   | `STRIPE_SECRET_KEY` | *(Optional)* Your Stripe secret key — for Pro plan payments |

8. After adding variables, click **"Redeploy"** to restart with the new config.
9. Verify the backend is running by visiting:
   ```
   https://your-project.up.railway.app/api/health
   ```
   You should see: `{"status":"ok","timestamp":"..."}` ✓

---

## Step 4 — Deploy the Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **"Add New Project"** → import your `proposalforge` repository.
3. Vercel will auto-detect the `vercel.json` config. **Do not change** the build settings — they are already configured.
4. Before clicking deploy, go to **"Environment Variables"** and add:

   | Variable | Value |
   |---|---|
   | `VITE_API_URL` | Your Railway URL with **no trailing slash** (e.g. `https://your-project.up.railway.app`) |
   | `VITE_FIREBASE_API_KEY` | From Step 2 |
   | `VITE_FIREBASE_PROJECT_ID` | From Step 2 |
   | `VITE_FIREBASE_APP_ID` | From Step 2 |

5. Click **"Deploy"**. Vercel will build the React app and publish it.
6. Once deployed, copy your Vercel URL (e.g. `https://your-project.vercel.app`).

---

## Step 5 — Connect Frontend URL to Backend (CORS)

1. Go back to your Railway service → **"Variables"** tab.
2. Set `FRONTEND_URL` to your Vercel URL:
   ```
   https://your-project.vercel.app
   ```
3. Click **"Redeploy"** — this tells the backend to accept requests from your frontend and enables CORS.

---

## Step 6 — (Optional) Configure Google OAuth

If you enabled Google sign-in in Firebase:

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → **APIs & Services → Credentials**.
2. Find your OAuth 2.0 client and click **Edit**.
3. Under **Authorized redirect URIs**, add:
   ```
   https://your-project.up.railway.app/api/auth/google/callback
   ```
4. Save, then add to Railway variables:

   | Variable | Value |
   |---|---|
   | `GOOGLE_CLIENT_ID` | Your Google OAuth client ID |
   | `GOOGLE_CLIENT_SECRET` | Your Google OAuth client secret |

5. Redeploy Railway after adding these.

---

## Step 7 — (Optional) Configure Stripe

If you want to accept payments for the Pro plan:

1. Go to [dashboard.stripe.com](https://dashboard.stripe.com) → **Developers → Webhooks**.
2. Add an endpoint:
   ```
   https://your-project.up.railway.app/api/stripe/webhook
   ```
3. Select the events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `checkout.session.completed`.
4. Copy the **Webhook Signing Secret** and add it to Railway as `STRIPE_WEBHOOK_SECRET`.

---

## Step 8 — Final Verification

Visit your Vercel URL and confirm the following work end-to-end:

- [ ] Landing page loads
- [ ] Sign up with email creates an account
- [ ] Onboarding wizard completes
- [ ] Dashboard loads with no errors
- [ ] Create a proposal and generate with AI
- [ ] Download a proposal PDF

If anything is broken, check Railway logs:
- Railway dashboard → your service → **"Deployments"** → click the latest deploy → **"View Logs"**

---

## Environment Variables Reference

### Railway (backend)

| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | Yes | Set to `production` |
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string |
| `FRONTEND_URL` | Yes | Your Vercel URL (for CORS) |
| `PUBLIC_URL` | Yes | Your Railway URL (for emails + Stripe webhooks) |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Yes | Firebase Admin SDK JSON (single line) |
| `GEMINI_API_KEY` | Yes | Google Gemini AI key |
| `RESEND_API_KEY` | No | Resend email service key |
| `STRIPE_SECRET_KEY` | No | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | No | Stripe webhook signing secret |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret |

### Vercel (frontend)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | Yes | Railway URL — no trailing slash |
| `VITE_FIREBASE_API_KEY` | Yes | Firebase web API key |
| `VITE_FIREBASE_PROJECT_ID` | Yes | Firebase project ID |
| `VITE_FIREBASE_APP_ID` | Yes | Firebase web app ID |

---

## Troubleshooting

**"CORS error" in browser console**
→ Make sure `FRONTEND_URL` in Railway is set to your exact Vercel URL (no trailing slash) and you have redeployed.

**"Cannot connect to database"**
→ Confirm `DATABASE_URL` includes `?sslmode=require` at the end. Neon requires SSL.

**"FIREBASE_SERVICE_ACCOUNT_JSON is not set"**
→ The JSON must be pasted as a single line with no line breaks. Use a JSON minifier like [jsonformatter.org](https://jsonformatter.org/json-minify) if needed.

**Frontend shows blank page**
→ Check that all `VITE_*` environment variables are set in Vercel. After adding them, trigger a fresh redeploy in Vercel.

**AI generation not working**
→ Confirm `GEMINI_API_KEY` is set in Railway and that your key has quota available at [aistudio.google.com](https://aistudio.google.com).
