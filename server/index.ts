import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { initDB } from './db.js'
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

// Trust proxy — required on Replit (behind a reverse proxy) for rate limiting and IP detection
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

// Stripe webhook MUST be before express.json()
app.post(
  '/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const signature = req.headers['stripe-signature']
    if (!signature) return res.status(400).json({ error: 'Missing stripe-signature' })
    try {
      const { getStripeSync } = await import('./stripeClient.js')
      const sync = await getStripeSync()
      const sig = Array.isArray(signature) ? signature[0] : signature
      if (!Buffer.isBuffer(req.body)) {
        return res.status(400).json({ error: 'Body must be raw buffer' })
      }
      await sync.processWebhook(req.body, sig)
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
  '.replit.app',
  '.replit.dev',
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

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
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

async function main() {
  try {
    await initDB()

    // Try to initialize Stripe (non-fatal if not connected)
    try {
      const { runMigrations } = await import('stripe-replit-sync')
      await runMigrations({ databaseUrl: process.env.DATABASE_URL! })
      console.log('Stripe schema ready')

      const { getStripeSync } = await import('./stripeClient.js')
      const stripeSync = await getStripeSync()

      const baseUrl = process.env.PUBLIC_URL
        || (process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : `http://localhost:${PORT}`)

      await stripeSync.findOrCreateManagedWebhook(`${baseUrl}/api/stripe/webhook`)
      stripeSync.syncBackfill().catch(err => console.error('Stripe backfill error:', err))
      console.log('Stripe initialized')
    } catch (stripeErr) {
      console.warn('Stripe not configured (optional):', (stripeErr as Error).message)
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`)
    })
  } catch (err) {
    console.error('Failed to start server:', err)
    process.exit(1)
  }
}

main()
