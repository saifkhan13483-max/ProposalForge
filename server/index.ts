import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { initDB, query } from './db.js'
import { validateFirebaseAdmin } from './firebaseAdmin.js'
import authRoutes from './routes/auth.js'
import oauthRoutes from './routes/oauth.js'
import clientRoutes from './routes/clients.js'
import proposalRoutes from './routes/proposals.js'
import invoiceRoutes from './routes/invoices.js'
import dashboardRoutes from './routes/dashboard.js'
import publicRoutes from './routes/public.js'
import subscriptionRoutes from './routes/subscription.js'
import pdfRoutes, { handlePublicPdf, handleInvoicePdf } from './routes/pdf.js'
import sitemapRoutes from './routes/sitemap.js'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = parseInt(process.env.SERVER_PORT || process.env.PORT || '3000')
const isProd = process.env.NODE_ENV === 'production'

// Trust proxy — required when running behind a reverse proxy (Vercel, Railway, etc.)
app.set('trust proxy', 1)

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // Allow inline scripts in React app
  crossOriginEmbedderPolicy: false,
}))

// Rate limiting — general API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
})

// Stricter limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again later.' },
})

// Stricter limit for AI generation
const genLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many generation requests, please slow down.' },
})

// Stripe webhook MUST be before express.json() to receive raw body
app.post(
  '/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const signature = req.headers['stripe-signature']
    if (!signature) return res.status(400).json({ error: 'Missing stripe-signature' })

    if (!Buffer.isBuffer(req.body)) {
      return res.status(400).json({ error: 'Body must be raw buffer' })
    }

    const sig = Array.isArray(signature) ? signature[0] : signature
    const useSyncConnector = !!(process.env.REPLIT_CONNECTORS_HOSTNAME || process.env.REPL_ID)

    let event: { type: string; data: { object: Record<string, unknown> } }

    try {
      if (useSyncConnector) {
        // Use stripe sync connector to verify + mirror to stripe.* tables
        const { getStripeSync } = await import('./stripeClient.js')
        const sync = await getStripeSync()
        await sync.processWebhook(req.body, sig)
        try {
          event = JSON.parse(req.body.toString())
        } catch {
          return res.status(400).json({ error: 'Invalid webhook JSON' })
        }
      } else {
        // On Railway / Vercel: verify directly with the Stripe SDK.
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
        if (!webhookSecret) {
          // No secret configured — accept but warn (useful during initial setup)
          console.warn('STRIPE_WEBHOOK_SECRET not set; skipping signature verification')
          try {
            event = JSON.parse(req.body.toString())
          } catch {
            return res.status(400).json({ error: 'Invalid webhook JSON' })
          }
        } else {
          const { getUncachableStripeClient } = await import('./stripeClient.js')
          const stripe = await getUncachableStripeClient()
          try {
            event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret) as unknown as typeof event
          } catch (err) {
            console.error('Stripe webhook signature verification failed:', err)
            return res.status(400).json({ error: 'Webhook signature verification failed' })
          }
        }
      }

      try {
        if (event.type === 'checkout.session.completed') {
          const session = event.data.object
          if (
            session.mode === 'subscription' &&
            session.metadata &&
            (session.metadata as Record<string, string>).userId
          ) {
            const userId = (session.metadata as Record<string, string>).userId
            const subId = session.subscription as string | null
            await query(
              'UPDATE users SET plan = $1, stripe_subscription_id = $2 WHERE id = $3',
              ['pro', subId, userId]
            )
            console.log(`User ${userId} upgraded to Pro via checkout`)
          }
        } else if (event.type === 'customer.subscription.updated') {
          const sub = event.data.object
          const status = sub.status as string
          const customerId = sub.customer as string
          if (status === 'active' || status === 'trialing') {
            await query(
              'UPDATE users SET plan = $1, stripe_subscription_id = $2 WHERE stripe_customer_id = $3',
              ['pro', sub.id, customerId]
            )
          } else if (status === 'canceled' || status === 'unpaid' || status === 'past_due') {
            await query(
              'UPDATE users SET plan = $1, stripe_subscription_id = NULL WHERE stripe_customer_id = $2',
              ['free', customerId]
            )
          }
        } else if (event.type === 'customer.subscription.deleted') {
          const sub = event.data.object
          const customerId = sub.customer as string
          await query(
            'UPDATE users SET plan = $1, stripe_subscription_id = NULL WHERE stripe_customer_id = $2',
            ['free', customerId]
          )
          console.log(`Subscription deleted for customer ${customerId} — plan set to free`)
        }
      } catch (planErr) {
        console.error('Failed to update user plan from webhook:', planErr)
      }

      res.json({ received: true })
    } catch (err) {
      console.error('Webhook error:', err)
      res.status(400).json({ error: 'Webhook failed' })
    }
  }
)

// CORS — allow the Vercel frontend (or any FRONTEND_URL) in production
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(o => o.trim())
  : []

const TRUSTED_SUFFIXES = [
  '.vercel.app',
  '.railway.app',
  '.up.railway.app',
]

const corsOptions: cors.CorsOptions = {
  origin: isProd
    ? (origin, callback) => {
        if (
          !origin ||
          allowedOrigins.some(o => origin === o) ||
          TRUSTED_SUFFIXES.some(suffix => origin.endsWith(suffix))
        ) {
          callback(null, true)
        } else {
          console.warn(`CORS blocked origin: ${origin}`)
          callback(new Error(`CORS: origin ${origin} not allowed`))
        }
      }
    : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}

// Explicitly handle ALL OPTIONS preflight requests before any route or middleware.
// This is the critical fix for HTTP 405 on cross-origin POST requests.
app.options('*', cors(corsOptions))

app.use(cors(corsOptions))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Apply general rate limit to all API routes
app.use('/api', apiLimiter)

// Routes
app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/auth', authLimiter, oauthRoutes)
app.use('/api/clients', clientRoutes)
app.use('/api/proposals', proposalRoutes)
app.use('/api/proposals', genLimiter, pdfRoutes)
app.use('/api/invoices', invoiceRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/public', publicRoutes)
app.get('/api/public/proposal/:token/pdf', handlePublicPdf)
app.get('/api/invoices/:id/pdf', handleInvoicePdf)
app.use('/api', subscriptionRoutes)

// Sitemap + robots.txt (dynamic, with correct base URL)
app.use('/', sitemapRoutes)

// Health check — Railway uses this path to decide if the service is healthy
app.get('/api/health', async (_req, res) => {
  try {
    await query('SELECT 1')
    res.json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() })
  } catch {
    res.status(503).json({ status: 'error', db: 'unreachable', timestamp: new Date().toISOString() })
  }
})

// Serve React client in production ONLY when frontend is not separately hosted
// (i.e. not deployed to Vercel/Netlify — set FRONTEND_URL to skip this)
if (isProd && !process.env.FRONTEND_URL) {
  const clientDist = path.join(__dirname, '../../client/dist')
  app.use(express.static(clientDist, { maxAge: '1y', etag: true }))
  // SPA fallback — serve index.html for all non-API routes
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'Not found' })
    }
    res.sendFile(path.join(clientDist, 'index.html'))
  })
}

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

async function initStripe() {
  // Sync connector (uses connector hostname env vars) — only available in specific environments.
  // On Railway/Vercel it will fall back to STRIPE_SECRET_KEY env var.
  const useSyncConnector = !!(process.env.REPLIT_CONNECTORS_HOSTNAME || process.env.REPL_ID)

  if (useSyncConnector) {
    const { runMigrations } = await import('stripe-replit-sync')
    await runMigrations({ databaseUrl: process.env.DATABASE_URL! })
    console.log('Stripe schema ready')

    const { getStripeSync } = await import('./stripeClient.js')
    const stripeSync = await getStripeSync()

    const baseUrl = process.env.PUBLIC_URL || `http://localhost:${PORT}`

    await stripeSync.findOrCreateManagedWebhook(`${baseUrl}/api/stripe/webhook`)
    stripeSync.syncBackfill().catch(err => console.error('Stripe backfill error:', err))
    console.log('Stripe initialized (sync connector)')
  } else if (process.env.STRIPE_SECRET_KEY) {
    // On Railway: just validate the key is usable, no webhook registration needed here
    console.log('Stripe configured via STRIPE_SECRET_KEY')
  } else {
    console.log('Stripe not configured — skipping (set STRIPE_SECRET_KEY to enable)')
  }
}

async function main() {
  try {
    await initDB()

    // Start listening IMMEDIATELY — never block server startup on optional services.
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`)
    })

    // Validate Firebase Admin early so config errors are visible in logs right away
    // instead of silently failing on the first login attempt.
    validateFirebaseAdmin().catch(() => {})

    // Non-blocking Stripe setup — failures are logged but never crash the server
    initStripe().catch(err => {
      console.warn('Stripe init failed (optional):', (err as Error).message)
    })
  } catch (err) {
    console.error('Failed to start server:', err)
    process.exit(1)
  }
}

main()
