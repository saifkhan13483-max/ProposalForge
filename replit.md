# ProposalForge

AI-powered client proposal and invoice generator SaaS for freelancers — turns project descriptions into polished proposals in under 60 seconds.

## Run & Operate

- **Start app**: `npm run dev` (runs client on :5000 + server on :3000)
- **Build**: `npm run build`
- **DB init**: Auto-runs on server start via `initDB()` in `server/db.ts`

**Required env vars:**
- `DATABASE_URL` — PostgreSQL (auto-provided by Replit)
- `JWT_SECRET` — Set via env vars
- `SERVER_PORT` — 3000
- `GEMINI_API_KEY` — For AI proposal generation (optional; shows error if missing)
- `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` — For Google OAuth (optional; falls back to email/password)
- Stripe — Connected via Replit Integrations tab (optional)
- `RESEND_API_KEY` — For email sending + password reset (optional)

## Stack

- **Frontend**: React 18 + Vite 6 + TypeScript + TailwindCSS v3 + shadcn/ui (Radix) + Wouter routing + TanStack Query + Tiptap editor
- **Backend**: Node.js + Express + TypeScript + `tsx` watch mode
- **Database**: PostgreSQL via raw `pg` pool (no ORM)
- **Auth**: JWT in localStorage (`pf_token`), Bearer token headers; Google OAuth via manual redirect flow
- **AI**: Google Gemini 1.5 Flash (`@google/generative-ai`)
- **Payments**: Stripe via `stripe-replit-sync` connector
- **Email**: Resend API
- **PDF**: Puppeteer (server-side HTML → PDF)

## Where things live

- `client/src/pages/` — All frontend pages
- `client/src/components/` — Shared UI components (shadcn/ui)
- `client/src/contexts/AuthContext.tsx` — Auth state
- `client/src/lib/api.ts` — Typed fetch wrapper
- `server/routes/` — All API route handlers
- `server/routes/oauth.ts` — Google OAuth redirect + callback
- `server/routes/pdf.ts` — Puppeteer PDF generation (auth + public)
- `server/db.ts` — PostgreSQL schema + init
- `server/middleware/auth.ts` — JWT middleware
- `server/stripeClient.ts` — Stripe integration (Replit connector pattern)
- `server/index.ts` — Express app entry point

## Architecture decisions

- **No ORM**: Raw pg pool for simplicity; schema created via `initDB()` with `CREATE TABLE IF NOT EXISTS` + `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` for incremental migrations
- **Flat structure**: Not a pnpm monorepo; client/ and server/ share root package.json dependencies (server deps) plus client has its own `client/package.json`
- **Proxy**: Vite proxies `/api` to `localhost:3000` so frontend can use relative URLs
- **Public proposal page**: `/proposal/:token` is unauthenticated; uses `accept_token` UUID for security
- **Stripe**: Uses `stripe-replit-sync` for webhook management and backfill; falls back gracefully if not configured
- **Free tier**: 3 AI-generated proposals/month tracked via `proposals_this_month` counter on user row
- **Logo storage**: Logo stored as base64 data URL in `logo_url` column (avoids file system complexity)
- **PDF**: Puppeteer launched with `--no-sandbox` for Replit Linux compatibility; returns binary PDF buffer
- **Google OAuth**: Manual redirect flow (`/api/auth/google` → Google → `/api/auth/google/callback` → `/auth/callback`); no Passport.js
- **Demo rate limiting**: In-memory Map (IP → date string) limits anonymous demo to 1 per IP per day
- **Archive**: Soft-delete via `archived` boolean on proposals; excluded from default list queries

## Product

- **Landing page**: Marketing page at `/` with "Try the live demo" CTA linking to `/demo`
- **Auth**: Email/password + Google OAuth; registration triggers 3-step onboarding wizard
- **Onboarding**: 3-step wizard (business name → logo + accent color → default currency) at `/onboarding`
- **Dashboard**: Revenue, acceptance rate, outstanding invoices, activity feed; time-aware greeting
- **Proposals**: Create → AI-generate → edit with Tiptap → regenerate sections → download PDF → send via email → client accepts with e-signature; archive/unarchive support; PDF download in list dropdown; client feedback panel shows change requests from clients
- **Invoices**: Manual creation or auto-generated on proposal acceptance; Stripe checkout links; PDF download; "Send" button emails invoice to client; overdue auto-detection in list
- **Clients**: Contact book with proposal/invoice counts
- **Settings**: Logo upload, business profile (name, color, currency) + Pro upgrade (Stripe)
- **Public page**: Branded proposal view with accept/e-signature + PDF download; comment thread (Pro only); free-tier branding banner for non-Pro users
- **Demo**: `/demo` — anonymous try-without-signup experience (1 proposal per IP/day)
- **Email notifications**: Freelancer receives email (via Resend) when client accepts proposal or submits change request

## User preferences

_Populate as you build_

## Gotchas

- `stripe-replit-sync` must be version `^1.0.0` (not 0.1.x which doesn't exist)
- Stripe webhook handler must be registered BEFORE `express.json()` middleware to receive raw body
- Client Vite binary is at `client/node_modules/.bin/vite`, server tsx is at root `node_modules/.bin/tsx`
- `@import "tailwindcss"` is Tailwind v4 syntax — use `@tailwind base/components/utilities` for v3
- Puppeteer needs `--no-sandbox`, `--disable-setuid-sandbox`, `--disable-dev-shm-usage` on Replit
- Line items: frontend sends `unit_price` (snake_case); routes handle both `unit_price` and `unitPrice` for compatibility
- Password reset: token stored in `reset_token` + `reset_token_expires` columns (added via `ALTER TABLE IF NOT EXISTS`)
- Google OAuth callback URL must be registered in Google Cloud Console: `https://<domain>/api/auth/google/callback`
- Demo rate limiting uses in-memory Map; resets on server restart (acceptable for demo purposes)

## Pointers

- Stripe integration skill: `.local/skills/stripe/SKILL.md`
- Database skill: `.local/skills/database/SKILL.md`
- Gemini API: `server/routes/proposals.ts` → `generate` endpoint
- PDF generation: `server/routes/pdf.ts`
- Google OAuth: `server/routes/oauth.ts`
