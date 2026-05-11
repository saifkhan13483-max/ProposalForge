import Stripe from 'stripe'

async function getStripeCredentials(): Promise<{ secretKey: string; webhookSecret?: string }> {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? 'depl ' + process.env.WEB_REPL_RENEWAL
      : null

  if (!hostname || !xReplitToken) {
    // Fallback to env vars (used on Railway, Render, or any non-Replit host)
    const key = process.env.STRIPE_SECRET_KEY
    if (key) return {
      secretKey: key,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    }
    throw new Error('Stripe not configured. Set STRIPE_SECRET_KEY env var or connect via Replit Integrations.')
  }

  const resp = await fetch(
    `https://${hostname}/api/v2/connection?include_secrets=true&connector_names=stripe`,
    {
      headers: { Accept: 'application/json', X_REPLIT_TOKEN: xReplitToken },
      signal: AbortSignal.timeout(10_000),
    }
  )

  if (!resp.ok) {
    throw new Error(`Failed to fetch Stripe credentials: ${resp.status} ${resp.statusText}`)
  }

  const data = await resp.json()
  const settings = data.items?.[0]?.settings

  if (!settings?.secret_key) {
    throw new Error('Stripe integration not connected. Connect Stripe via the Integrations tab first.')
  }

  return {
    secretKey: settings.secret_key,
    webhookSecret: settings.webhook_secret,
  }
}

export async function getUncachableStripeClient(): Promise<Stripe> {
  const { secretKey } = await getStripeCredentials()
  return new Stripe(secretKey)
}

export async function getStripeSync() {
  // StripeSync is dynamically imported so stripe-replit-sync is never loaded
  // at module initialization time on non-Replit hosts (Railway, Render, etc.)
  // where it would fail trying to connect to Replit's infrastructure.
  const { StripeSync } = await import('stripe-replit-sync')

  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('DATABASE_URL required')

  const { secretKey, webhookSecret } = await getStripeCredentials()
  return new StripeSync({
    poolConfig: { connectionString: databaseUrl },
    stripeSecretKey: secretKey,
    stripeWebhookSecret: webhookSecret ?? '',
  })
}
