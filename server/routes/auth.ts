import { Router } from 'express'
import bcrypt from 'bcrypt'
import { query } from '../db.js'
import { generateToken, requireAuth, type AuthRequest } from '../middleware/auth.js'

const router = Router()

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, businessName } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const existing = await query('SELECT id FROM users WHERE email = $1', [email])
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const result = await query(
      `INSERT INTO users (email, password_hash, business_name, billing_period_start) 
       VALUES ($1, $2, $3, CURRENT_DATE) 
       RETURNING id, email, business_name, plan, logo_url, accent_color, default_currency`,
      [email.toLowerCase(), passwordHash, businessName || null]
    )
    const user = result.rows[0]
    const token = generateToken(user.id, user.plan)

    res.status(201).json({ user, token })
  } catch (err) {
    console.error('Register error:', err)
    res.status(500).json({ error: 'Registration failed' })
  }
})

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const result = await query(
      'SELECT id, email, password_hash, business_name, plan, logo_url, accent_color, default_currency FROM users WHERE email = $1',
      [email.toLowerCase()]
    )
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const user = result.rows[0]
    if (!user.password_hash) {
      return res.status(401).json({ error: 'Please use Google login for this account' })
    }

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const token = generateToken(user.id, user.plan)
    const { password_hash: _ph, ...safeUser } = user

    res.json({ user: safeUser, token })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Login failed' })
  }
})

// Get current user
router.get('/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      'SELECT id, email, business_name, plan, logo_url, accent_color, default_currency, proposals_this_month, stripe_customer_id, stripe_subscription_id FROM users WHERE id = $1',
      [req.userId]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }
    res.json({ user: result.rows[0] })
  } catch (err) {
    console.error('Get me error:', err)
    res.status(500).json({ error: 'Failed to get user' })
  }
})

// Update onboarding / profile
router.put('/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { businessName, accentColor, defaultCurrency } = req.body
    const result = await query(
      `UPDATE users SET 
        business_name = COALESCE($1, business_name),
        accent_color = COALESCE($2, accent_color),
        default_currency = COALESCE($3, default_currency),
        updated_at = NOW()
       WHERE id = $4
       RETURNING id, email, business_name, plan, logo_url, accent_color, default_currency`,
      [businessName || null, accentColor || null, defaultCurrency || null, req.userId]
    )
    res.json({ user: result.rows[0] })
  } catch (err) {
    console.error('Update me error:', err)
    res.status(500).json({ error: 'Failed to update profile' })
  }
})

export default router
