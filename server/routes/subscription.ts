import { Router } from 'express'
import { query } from '../db.js'
import { requireAuth, type AuthRequest } from '../middleware/auth.js'

const router = Router()

// Stripe webhook (must be before auth middleware, uses raw body)
router.post('/stripe/webhook', async (req, res) => {
  try {
    const signature = req.headers['stripe-signature']
    if (!signature) return res.status(400).json({ error: 'Missing stripe-signature' })

    const { getStripeSync } = await import('../stripeClient.js')
    const sync = await getStripeSync()
    const sig = Array.isArray(signature) ? signature[0] : signature

    if (!Buffer.isBuffer(req.body)) {
      return res.status(400).json({ error: 'Webhook body must be raw buffer' })
    }

    await sync.processWebhook(req.body, sig)
    res.json({ received: true })
  } catch (err) {
    console.error('Webhook error:', err)
    res.status(400).json({ error: 'Webhook processing failed' })
  }
})

// Get subscription status
router.get('/subscription', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userResult = await query(
      'SELECT plan, stripe_customer_id, stripe_subscription_id, proposals_this_month FROM users WHERE id = $1',
      [req.userId]
    )
    if (userResult.rows.length === 0) return res.status(404).json({ error: 'User not found' })
    const user = userResult.rows[0]

    let subscription = null
    if (user.stripe_subscription_id) {
      try {
        const subResult = await query(
          `SELECT * FROM stripe.subscriptions WHERE id = $1`,
          [user.stripe_subscription_id]
        )
        subscription = subResult.rows[0] || null
      } catch {
        // stripe schema may not exist yet
      }
    }

    res.json({
      plan: user.plan,
      proposalsThisMonth: user.proposals_this_month,
      proposalLimit: user.plan === 'pro' ? null : 3,
      subscription,
    })
  } catch (err) {
    console.error('Get subscription error:', err)
    res.status(500).json({ error: 'Failed to get subscription' })
  }
})

// Create checkout for pro subscription
router.post('/subscription/checkout', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { interval = 'month' } = req.body
    const userResult = await query('SELECT email, stripe_customer_id FROM users WHERE id = $1', [req.userId])
    if (userResult.rows.length === 0) return res.status(404).json({ error: 'User not found' })
    const user = userResult.rows[0]

    let { getUncachableStripeClient } = await import('../stripeClient.js')
    const stripe = await getUncachableStripeClient()

    // Get or create customer
    let customerId = user.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: req.userId! },
      })
      customerId = customer.id
      await query('UPDATE users SET stripe_customer_id = $1 WHERE id = $2', [customerId, req.userId])
    }

    // Find Pro price
    const prices = await stripe.prices.list({ active: true, type: 'recurring', limit: 20 })
    const price = prices.data.find(p =>
      (interval === 'month' ? p.unit_amount === 1900 : p.unit_amount === 19000) &&
      p.recurring?.interval === interval
    )

    const baseUrl = process.env.REPLIT_DOMAINS
      ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
      : 'http://localhost:5000'

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: price
        ? [{ price: price.id, quantity: 1 }]
        : [{
            price_data: {
              currency: 'usd',
              product_data: { name: 'ProposalForge Pro' },
              unit_amount: interval === 'month' ? 1900 : 19000,
              recurring: { interval: interval as 'month' | 'year' },
            },
            quantity: 1,
          }],
      mode: 'subscription',
      success_url: `${baseUrl}/settings?upgraded=true`,
      cancel_url: `${baseUrl}/settings`,
      metadata: { userId: req.userId! },
    })

    res.json({ url: session.url })
  } catch (err) {
    console.error('Subscription checkout error:', err)
    res.status(500).json({ error: 'Failed to create checkout session' })
  }
})

// Create customer portal session
router.post('/subscription/portal', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userResult = await query('SELECT stripe_customer_id FROM users WHERE id = $1', [req.userId])
    const user = userResult.rows[0]
    if (!user?.stripe_customer_id) {
      return res.status(400).json({ error: 'No Stripe customer found' })
    }

    const { getUncachableStripeClient } = await import('../stripeClient.js')
    const stripe = await getUncachableStripeClient()

    const baseUrl = process.env.REPLIT_DOMAINS
      ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
      : 'http://localhost:5000'

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${baseUrl}/settings`,
    })

    res.json({ url: session.url })
  } catch (err) {
    console.error('Portal error:', err)
    res.status(500).json({ error: 'Failed to create portal session' })
  }
})

export default router
