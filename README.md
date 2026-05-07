# ProposalForge

AI-powered client proposal and invoice generator for freelancers. Describe your project and get a polished, branded proposal ready to send in under 60 seconds.

## Features

- **AI Proposal Generation** — Describe a project and Groq AI writes a full proposal (executive summary, scope of work, timeline, deliverables, terms)
- **Quote & Pricing** — Automatically generates line items and pricing; fully editable
- **PDF Export** — Download any proposal or invoice as a professional PDF
- **Client Management** — Contact book with proposal and invoice history per client
- **Invoicing** — Create invoices manually or auto-generate from an accepted proposal; Stripe checkout links supported
- **E-Signature** — Clients can accept proposals and sign electronically via a public link
- **Email Notifications** — Get notified when a client views, accepts, requests changes, or declines your proposal
- **Dashboard** — Revenue, acceptance rate, outstanding invoices, and recent activity at a glance
- **Free Tier** — 3 AI-generated proposals per month; upgrade to Pro for unlimited

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 6, TypeScript, TailwindCSS v3, shadcn/ui |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL (Replit managed) |
| AI | Groq API (llama-3.3-70b-versatile) |
| Auth | JWT (email/password + Google OAuth) |
| Payments | Stripe via stripe-replit-sync |
| Email | Resend API |
| PDF | Puppeteer (server-side) |

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database (provided automatically on Replit)

### Environment Variables

Set these in your Replit Secrets (or `.env` locally):

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string (auto-set on Replit) |
| `JWT_SECRET` | Yes | Secret key for signing auth tokens |
| `GROQ_API_KEY` | Yes | Groq API key for AI generation ([get one free](https://console.groq.com/keys)) |
| `SERVER_PORT` | No | Backend port (default: 3000) |
| `RESEND_API_KEY` | No | For sending emails to clients |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret |

### Running Locally

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client && npm install && cd ..

# Start both client (port 5000) and server (port 3000)
npm run dev
```

The app will be available at `http://localhost:5000`.

## Project Structure

```
├── client/                  # React frontend (Vite)
│   └── src/
│       ├── pages/           # All page components
│       ├── components/      # Shared UI components (shadcn/ui)
│       ├── contexts/        # AuthContext
│       └── lib/             # API client + utilities
├── server/                  # Express backend
│   ├── routes/              # API route handlers
│   ├── lib/                 # AI generation (Groq)
│   ├── middleware/          # JWT auth middleware
│   ├── db.ts                # PostgreSQL schema + init
│   └── index.ts             # App entry point
└── package.json
```

## Key Routes

| Path | Description |
|---|---|
| `/` | Landing page |
| `/demo` | Try without signing up (1 proposal/day per IP) |
| `/dashboard` | Main dashboard |
| `/proposals` | Proposal list |
| `/proposals/new` | Create a new proposal |
| `/invoices` | Invoice list |
| `/clients` | Client contact book |
| `/settings` | Business profile, logo, branding |
| `/proposal/:token` | Public client-facing proposal page |

## Notes

- Vite proxies `/api` requests to the backend on port 3000
- The public proposal page (`/proposal/:token`) is unauthenticated and uses a UUID accept token for security
- PDF generation uses Puppeteer with `--no-sandbox` for Linux compatibility
- Free tier tracks usage via a `proposals_this_month` counter that resets monthly
- Stripe webhook must be registered before `express.json()` middleware
