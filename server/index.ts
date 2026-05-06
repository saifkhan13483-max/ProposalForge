import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { initDB } from './db.js'
import authRoutes from './routes/auth.js'
import clientRoutes from './routes/clients.js'
import proposalRoutes from './routes/proposals.js'
import invoiceRoutes from './routes/invoices.js'
import dashboardRoutes from './routes/dashboard.js'
import publicRoutes from './routes/public.js'
import subscriptionRoutes from './routes/subscription.js'

dotenv.config()

const app = express()
const PORT = parseInt(process.env.SERVER_PORT || process.env.PORT || '3000')

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

      // Sync subscription status to user
      res.json({ received: true })
    } catch (err) {
      console.error('Webhook error:', err)
      res.status(400).json({ error: 'Webhook failed' })
    }
  }
)

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/clients', clientRoutes)
app.use('/api/proposals', proposalRoutes)
app.use('/api/invoices', invoiceRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/public', publicRoutes)
app.use('/api', subscriptionRoutes)

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

async function main() {
  try {
    await initDB()
    console.log('Database initialized')

    // Try to initialize Stripe (non-fatal if not connected)
    try {
      const { runMigrations } = await import('stripe-replit-sync')
      await runMigrations({ databaseUrl: process.env.DATABASE_URL!, schema: 'stripe' })
      console.log('Stripe schema ready')

      const { getStripeSync } = await import('./stripeClient.js')
      const stripeSync = await getStripeSync()

      const baseUrl = process.env.REPLIT_DOMAINS
        ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
        : `http://localhost:${PORT}`

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
