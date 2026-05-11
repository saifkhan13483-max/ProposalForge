# ProposalForge

AI-powered client proposal and invoice generator SaaS for freelancers — turns project descriptions into polished proposals in under 60 seconds.

## Run & Operate

- **Start app**: `npm run dev` (runs client on :5000 + server on :3000)
- **Build server**: `npm run build:server` (compiles TypeScript → `server/dist/`)
- **DB init**: Auto-runs on server start via `initDB()` in `server/db.ts`

**Required env vars (Replit dev):**
- `DATABASE_URL` — PostgreSQL (auto-provided by Replit)
- `FIREBASE_SERVICE_ACCOUNT_JSON` — Firebase Admin SDK service account JSON (single line)
- `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID` — Firebase client config
- `SERVER_PORT` — 3000
- `GEMINI_API_KEY` — For AI proposal generation (optional; shows error if missing)
- Stripe — Connected via Replit Integrations tab (optional; or set `STRIPE_SECRET_KEY`)
- `RESEND_API_KEY` — For email sending (optional)

## Stack

- **Frontend**: React 18 + Vite 6 + TypeScript + TailwindCSS v4 + shadcn/ui (Radix) + Wouter routing + TanStack Query + Tiptap editor
- **Backend**: Node.js + Express + TypeScript + `tsx` watch mode
- **Database**: PostgreSQL via raw `pg` pool (no ORM)
- **Auth**: Firebase Authentication (email/password + Google popup); Firebase Admin SDK verifies ID tokens on the server
- **AI**: Google Gemini 1.5 Flash (`@google/generative-ai`)
- **Payments**: Stripe via `STRIPE_SECRET_KEY` env var (Railway) or Replit Integrations connector
- **Email**: Resend API
- **PDF**: pdfmake (pure Node.js, no Chromium needed)

## Where things live

- `client/src/pages/` — All frontend pages
- `client/src/components/` — Shared UI components (shadcn/ui)
- `client/src/contexts/AuthContext.tsx` — Auth state + Firebase sync
- `client/src/lib/firebase.ts` — Firebase client SDK helpers
- `client/src/lib/api.ts` — Typed fetch wrapper (respects `VITE_API_URL`)
- `server/routes/` — All API route handlers
- `server/routes/auth.ts` — Firebase login sync + profile endpoints
- `server/routes/pdf.ts` — pdfmake PDF generation (auth + public)
- `server/firebaseAdmin.ts` — Firebase Admin SDK (token verification, promise-based singleton)
- `server/db.ts` — PostgreSQL schema + init
- `server/middleware/auth.ts` — Firebase token middleware
- `server/stripeClient.ts` — Stripe client (Replit connector → STRIPE_SECRET_KEY fallback)
- `server/lib/baseUrl.ts` — Resolves public URL for email links / Stripe webhooks
- `server/index.ts` — Express app entry point

## Architecture decisions

- **No ORM**: Raw pg pool for simplicity; schema created via `initDB()` with `CREATE TABLE IF NOT EXISTS` + `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` for incremental migrations
- **Flat structure**: Not a pnpm monorepo; client/ and server/ share root `package.json` dependencies (server deps) plus client has its own `client/package.json`
- **Proxy**: Vite proxies `/api` → `localhost:3000` in dev; production frontend uses `VITE_API_URL`
- **Public proposal page**: `/proposal/:token` is unauthenticated; uses `accept_token` UUID for security
- **Stripe**: Uses `stripe-replit-sync` on Replit; falls back to `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` env vars on Railway/other hosts
- **Free tier**: 3 AI-generated proposals/month tracked via `proposals_this_month` counter on user row
- **Logo storage**: Logo stored as base64 data URL in `logo_url` column (avoids file system complexity)
- **PDF**: pdfmake generates PDF in-process (no Puppeteer/Chrome required)
- **Firebase Auth**: Client signs in via Firebase SDK; `onAuthStateChanged` triggers backend sync via `/api/auth/firebase-login`; backend verifies tokens with Firebase Admin SDK
- **Demo rate limiting**: In-memory Map (IP → date string) limits anonymous demo to 1 per IP per day
- **Archive**: Soft-delete via `archived` boolean on proposals; excluded from default list queries

## Deployment: Railway + Neon + Vercel

### 1 — Neon (database)
1. Create a free project at [neon.tech](https://neon.tech)
2. Copy the **Connection string** (it ends with `?sslmode=require`)
3. Use it as `DATABASE_URL` on Railway

### 2 — Railway (backend API)
1. Create a new project → **Deploy from GitHub repo**
2. Railway auto-detects `railway.toml` and builds with nixpacks
3. Set these environment variables in Railway dashboard:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Neon connection string |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Firebase service account JSON (one line) |
| `FRONTEND_URL` | Your Vercel URL, e.g. `https://your-app.vercel.app` |
| `PUBLIC_URL` | Your Railway URL, e.g. `https://your-app.up.railway.app` |
| `GEMINI_API_KEY` | Gemini API key (optional) |
| `RESEND_API_KEY` | Resend key (optional) |
| `STRIPE_SECRET_KEY` | Stripe secret key (optional) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret (optional) |
| `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD` | `true` |

4. After deploy, copy the Railway public URL → set it as `PUBLIC_URL`

### 3 — Vercel (frontend)
1. Import the same GitHub repo → set **Root Directory** to leave blank (vercel.json handles it)
2. Set these environment variables in Vercel dashboard:

| Variable | Value |
|---|---|
| `VITE_API_URL` | Your Railway URL, e.g. `https://your-app.up.railway.app` |
| `VITE_FIREBASE_API_KEY` | Firebase web app API key |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_APP_ID` | Firebase web app ID |

3. Vercel picks up `vercel.json` automatically (SPA rewrites, asset caching, security headers)

### 4 — Firebase authorized domains
Google sign-in (popup) requires your production domain to be whitelisted:
- Firebase Console → Authentication → Settings → **Authorized domains**
- Add: `your-app.vercel.app`

### 5 — Stripe webhook (if using Stripe)
Register the endpoint in your Stripe dashboard:
- URL: `https://your-railway-url.up.railway.app/api/stripe/webhook`
- Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
- Copy the **Signing secret** → set as `STRIPE_WEBHOOK_SECRET` on Railway

## Product

- **Landing page**: Marketing page at `/` with "Try the live demo" CTA linking to `/demo`
- **Auth**: Email/password + Google OAuth via Firebase; registration triggers 3-step onboarding wizard
- **Onboarding**: 3-step wizard (business name → logo + accent color → default currency) at `/onboarding`
- **Dashboard**: Revenue, acceptance rate, outstanding invoices, activity feed; time-aware greeting
- **Proposals**: Create → AI-generate → edit with Tiptap + timeline textarea → regenerate sections → download PDF → send via email → client accepts with e-signature; archive/unarchive support; PDF download in list dropdown; client feedback panel shows change requests; "Resend" button for already-sent proposals; `?action=send` URL param auto-opens send dialog
- **Invoices**: Manual creation or auto-generated on proposal acceptance; Stripe checkout links; PDF download; "Send" button emails invoice to client; overdue auto-detection in list
- **Clients**: Contact book with proposal/invoice counts; client cards link to detail page at `/clients/:id`
- **Client Detail**: `/clients/:id` — contact info + all associated proposals + all invoices for that client; edit client inline
- **Settings**: Logo upload, business profile (name, color, currency) + Pro upgrade (Stripe)
- **Public page**: Branded proposal view with accept/e-signature + PDF download; comment thread (Pro only); free-tier branding banner for non-Pro users
- **Demo**: `/demo` — anonymous try-without-signup experience (1 proposal per IP/day)
- **Email notifications**: Freelancer receives email (via Resend) when client views, accepts, requests changes, or declines a proposal

## User preferences

_Populate as you build_

## Gotchas

- `stripe-replit-sync` must be version `^1.0.0` (not 0.1.x which doesn't exist)
- Stripe webhook handler must be registered BEFORE `express.json()` middleware to receive raw body
- Client Vite binary is at `client/node_modules/.bin/vite`, server tsx is at root `node_modules/.bin/tsx`
- `FIREBASE_SERVICE_ACCOUNT_JSON` must be a single-line JSON string (no literal newlines)
- `firebase_uid` column on users table added via `ALTER TABLE IF NOT EXISTS` migration (incremental)
- Line items: frontend sends `unit_price` (snake_case); routes handle both `unit_price` and `unitPrice` for compatibility
- Demo rate limiting uses in-memory Map; resets on server restart (acceptable for demo purposes)
- PDF uses pdfmake (no Puppeteer/Chrome needed); set `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true` on Railway

## Pointers

- Stripe integration: `server/stripeClient.ts`
- Database skill: `.local/skills/database/SKILL.md`
- Gemini API: `server/routes/proposals.ts` → `generate` endpoint
- PDF generation: `server/routes/pdf.ts` (pdfmake)
- Firebase Admin: `server/firebaseAdmin.ts`
- Deployment config: `railway.toml`, `vercel.json`, `nixpacks.toml`, `.env.example`
