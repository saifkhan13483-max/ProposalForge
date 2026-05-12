# ProposalForge

> AI-powered client proposal and invoice generator for freelancers — turn project descriptions into polished, branded proposals in under 60 seconds.

**Author:** Saif Khan

---

## Overview

ProposalForge is a full-stack SaaS application built for freelancers who want to win more clients without spending hours writing proposals. Describe your project, let AI write a complete proposal, send it to your client with one click, collect an e-signature, and automatically issue an invoice — all in one place.

---

## Features

- **AI Proposal Generation** — Google Gemini writes complete, professional proposals (executive summary, scope of work, deliverables, pricing) in under 60 seconds
- **Rich Text Editor** — Inline Tiptap editor for every section; regenerate individual sections with a single click
- **E-Signature Acceptance** — Clients accept proposals with a typed signature on a branded public page — no DocuSign needed
- **Auto Invoicing** — Invoice is created automatically when a client accepts; collect payment via Stripe Checkout
- **PDF Export** — Download print-ready PDFs of proposals and invoices (pdfmake, no Puppeteer required)
- **Email Delivery** — Send proposals and invoices directly to clients via Resend
- **Real-time Tracking** — Get notified when a client views, accepts, requests changes, or declines
- **Client Management** — Full contact book with proposal and invoice history per client
- **Analytics Dashboard** — Revenue trends, acceptance rates, outstanding invoices, pipeline overview
- **Branding Controls** — Upload your logo, set your accent color, make every proposal look agency-level
- **Free Tier** — 3 AI proposals per month at no cost; upgrade to Pro for unlimited access
- **Live Demo** — Anonymous try-without-signup experience at `/demo` (1 per IP per day)

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite 6, TypeScript, TailwindCSS v4, shadcn/ui (Radix), Wouter, TanStack Query, Tiptap |
| **Backend** | Node.js, Express, TypeScript, `tsx` watch mode |
| **Database** | PostgreSQL via raw `pg` pool (no ORM) |
| **Auth** | Firebase Authentication (email/password + Google OAuth); Firebase Admin SDK for token verification |
| **AI** | Google Gemini 1.5 Flash (`@google/generative-ai`) |
| **Payments** | Stripe (via `stripe-replit-sync` on Replit or `STRIPE_SECRET_KEY` on Railway) |
| **Email** | Resend API |
| **PDF** | pdfmake (pure Node.js, no Chromium) |

---

## Project Structure

```
proposalforge/
├── client/                   # React frontend (Vite)
│   ├── src/
│   │   ├── pages/            # All route pages
│   │   ├── components/ui/    # shadcn/ui components
│   │   ├── contexts/         # AuthContext (Firebase)
│   │   └── lib/
│   │       ├── api.ts        # Typed fetch wrapper (respects VITE_API_URL)
│   │       └── firebase.ts   # Firebase client SDK helpers
│   └── package.json
├── server/                   # Express backend
│   ├── routes/
│   │   ├── auth.ts           # Firebase login sync + profile
│   │   ├── proposals.ts      # Proposal CRUD + AI generation
│   │   ├── invoices.ts       # Invoice CRUD + Stripe links
│   │   ├── clients.ts        # Client management
│   │   ├── pdf.ts            # pdfmake PDF generation
│   │   ├── dashboard.ts      # Analytics aggregation
│   │   └── public.ts         # Unauthenticated proposal view
│   ├── middleware/auth.ts     # Firebase token middleware
│   ├── db.ts                 # PostgreSQL schema + initDB()
│   ├── firebaseAdmin.ts      # Firebase Admin SDK singleton
│   ├── stripeClient.ts       # Stripe client (Replit connector → env var fallback)
│   └── index.ts              # Express app entry point
├── railway.toml              # Railway deployment config
├── vercel.json               # Vercel deployment config
└── nixpacks.toml             # Nixpacks build config
```

---

## Getting Started (Local Development)

### Prerequisites

- Node.js 20+
- PostgreSQL database (or use Replit's built-in DB)
- Firebase project with Authentication enabled
- Google Gemini API key (optional — AI features degrade gracefully)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/proposalforge.git
cd proposalforge
```

### 2. Install dependencies

```bash
npm install
cd client && npm install && cd ..
```

### 3. Set environment variables

Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/proposalforge
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}   # Single-line JSON
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_APP_ID=your_app_id
SERVER_PORT=3000
GEMINI_API_KEY=your_gemini_key        # Optional
RESEND_API_KEY=your_resend_key        # Optional
STRIPE_SECRET_KEY=your_stripe_key    # Optional
```

### 4. Start the development server

```bash
npm run dev
```

- Frontend runs on **:5000**
- Backend runs on **:3000**
- Vite proxies `/api` → `localhost:3000` automatically

---

## Deployment

ProposalForge is designed for a split deployment: **Vercel** (frontend) + **Railway** (backend) + **Neon** (database).

### Neon (Database)

1. Create a free project at [neon.tech](https://neon.tech)
2. Copy the connection string (ends with `?sslmode=require`)
3. Use it as `DATABASE_URL` on Railway

### Railway (Backend API)

1. Create a new project → **Deploy from GitHub repo**
2. Railway auto-detects `railway.toml` and builds with nixpacks
3. Set the following environment variables in the Railway dashboard:

| Variable | Description |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Neon connection string |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Firebase service account JSON (one line) |
| `FRONTEND_URL` | Your Vercel URL (e.g. `https://your-app.vercel.app`) |
| `PUBLIC_URL` | Your Railway URL (e.g. `https://your-app.up.railway.app`) |
| `GEMINI_API_KEY` | Gemini API key (optional) |
| `RESEND_API_KEY` | Resend key (optional) |
| `STRIPE_SECRET_KEY` | Stripe secret key (optional) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (optional) |
| `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD` | `true` |

### Vercel (Frontend)

1. Import the GitHub repo → leave root directory blank (`vercel.json` handles it)
2. Set the following environment variables in Vercel:

| Variable | Description |
|---|---|
| `VITE_API_URL` | Your Railway URL (e.g. `https://your-app.up.railway.app`) |
| `VITE_FIREBASE_API_KEY` | Firebase web app API key |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_APP_ID` | Firebase web app ID |

### Firebase Authorized Domains

Google sign-in requires your production domain to be whitelisted:

- Firebase Console → Authentication → Settings → **Authorized domains**
- Add: `your-app.vercel.app`

### Stripe Webhook (if using Stripe)

Register the endpoint in your Stripe dashboard:

- **URL:** `https://your-railway-url.up.railway.app/api/stripe/webhook`
- **Events:** `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
- Copy the **Signing secret** → set as `STRIPE_WEBHOOK_SECRET` on Railway

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start frontend (:5000) + backend (:3000) concurrently |
| `npm run dev:client` | Start Vite frontend only |
| `npm run dev:server` | Start Express backend only (tsx watch) |
| `npm run build:server` | Compile TypeScript server → `server/dist/` |

---

## Architecture Notes

- **No ORM** — Raw `pg` pool for simplicity; schema managed via `initDB()` with `CREATE TABLE IF NOT EXISTS` and `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` for incremental migrations
- **Flat dependency structure** — Not a monorepo; `client/` and root share a single `package.json` for server deps; client has its own `client/package.json`
- **Auth flow** — Client signs in via Firebase SDK; `onAuthStateChanged` triggers `/api/auth/firebase-login`; server verifies every request token with Firebase Admin SDK
- **Free tier** — 3 AI-generated proposals/month tracked via `proposals_this_month` counter per user row; resets monthly
- **Public proposal page** — `/proposal/:token` is unauthenticated; uses a `accept_token` UUID for security
- **PDF generation** — pdfmake generates PDFs in-process (no Puppeteer/Chrome required); set `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true` on Railway
- **Logo storage** — Stored as base64 data URL in `logo_url` column to avoid file system complexity
- **Demo rate limiting** — In-memory Map (`IP → date string`) limits the anonymous demo to 1 per IP per day; resets on server restart

---

## API Reference (Key Endpoints)

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/firebase-login` | Firebase token | Sync Firebase user to DB |
| `GET` | `/api/proposals` | Required | List user's proposals |
| `POST` | `/api/proposals` | Required | Create proposal |
| `POST` | `/api/proposals/:id/generate` | Required | AI-generate proposal content |
| `GET` | `/api/proposals/:id/pdf` | Required | Download proposal PDF |
| `GET` | `/api/public/proposal/:token` | None | Public proposal view |
| `POST` | `/api/public/proposal/:token/accept` | None | Client e-sign acceptance |
| `GET` | `/api/invoices` | Required | List user's invoices |
| `GET` | `/api/invoices/:id/pdf` | Required | Download invoice PDF |
| `GET` | `/api/dashboard/summary` | Required | Analytics summary |
| `GET` | `/api/health` | None | Health check |

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## Author

**Saif Khan**

Built with care for freelancers who deserve better tools.
