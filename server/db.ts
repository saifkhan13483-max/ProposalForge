import pg from 'pg'
import dotenv from 'dotenv'
dotenv.config()

const { Pool } = pg

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
})

export async function query(text: string, params?: unknown[]) {
  const client = await pool.connect()
  try {
    const result = await client.query(text, params)
    return result
  } finally {
    client.release()
  }
}

export async function initDB() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      google_id TEXT,
      business_name TEXT,
      logo_url TEXT,
      accent_color TEXT DEFAULT '#6366f1',
      default_currency TEXT DEFAULT 'USD',
      plan TEXT DEFAULT 'free',
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT,
      proposals_this_month INT DEFAULT 0,
      billing_period_start DATE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS clients (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      email TEXT,
      company TEXT,
      phone TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS proposals (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      status TEXT DEFAULT 'draft',
      project_type TEXT DEFAULT 'other',
      project_description TEXT,
      budget_range TEXT,
      timeline TEXT,
      client_name TEXT,
      client_email TEXT,
      content JSONB DEFAULT '{}',
      total_amount DECIMAL(10,2) DEFAULT 0,
      accept_token UUID DEFAULT gen_random_uuid(),
      accepted_at TIMESTAMPTZ,
      accepted_by TEXT,
      sent_at TIMESTAMPTZ,
      viewed_at TIMESTAMPTZ,
      personal_message TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS quote_line_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
      description TEXT NOT NULL,
      quantity DECIMAL(10,2) DEFAULT 1,
      unit_price DECIMAL(10,2) DEFAULT 0,
      sort_order INT DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      proposal_id UUID REFERENCES proposals(id) ON DELETE SET NULL,
      client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
      invoice_number TEXT NOT NULL,
      status TEXT DEFAULT 'draft',
      client_name TEXT,
      client_email TEXT,
      line_items JSONB DEFAULT '[]',
      subtotal DECIMAL(10,2) DEFAULT 0,
      tax_rate DECIMAL(5,2) DEFAULT 0,
      tax_amount DECIMAL(10,2) DEFAULT 0,
      total DECIMAL(10,2) DEFAULT 0,
      due_date DATE,
      paid_at TIMESTAMPTZ,
      stripe_payment_intent_id TEXT,
      stripe_checkout_session_id TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS acceptance_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
      event_type TEXT NOT NULL,
      signer_name TEXT,
      ip_address TEXT,
      comment TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS sessions (
      sid TEXT PRIMARY KEY,
      sess JSONB NOT NULL,
      expire TIMESTAMPTZ NOT NULL
    );

    CREATE INDEX IF NOT EXISTS clients_user_id_idx ON clients(user_id);
    CREATE INDEX IF NOT EXISTS proposals_user_id_idx ON proposals(user_id);
    CREATE INDEX IF NOT EXISTS proposals_accept_token_idx ON proposals(accept_token);
    CREATE INDEX IF NOT EXISTS invoices_user_id_idx ON invoices(user_id);
    CREATE INDEX IF NOT EXISTS sessions_expire_idx ON sessions(expire);
  `)

  // Incremental migrations
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token TEXT`)
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMPTZ`)
  console.log('Database initialized')
}
