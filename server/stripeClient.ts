import Stripe from 'stripe'

async function getStripeCredentials(): Promise<{ secretKey: string; webhookSecret?: string }> {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const connectorToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? 'depl ' + process.env.WEB_REPL_RENEWAL
      : null

  if (!hostname || !connectorToken) {
    // Fallback to env vars (used on Railway, Vercel, or any standard host)
    const key = process.env.STRIPE_SECRET_KEY
    if (key) return {
      secretKey: key,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    }
    throw new Error('Stripe not configured. Set the STRIPE_SECRET_KEY environment variable.')
  }

  const resp = await fetch(
    `https://${hostname}/api/v2/connection?include_secrets=true&connector_names=stripe`,
    {
      headers: { Accept: 'application/json', X_REPLIT_TOKEN: connectorToken },
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
  // StripeSync is dynamically imported so it is never loaded at module
  // initialization time on hosts where the connector is not available.
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
