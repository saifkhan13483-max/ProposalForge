import { Router } from 'express'
import bcrypt from 'bcrypt'
import multer from 'multer'
import { v4 as uuidv4 } from 'uuid'
import { query } from '../db.js'
import { generateToken, requireAuth, type AuthRequest } from '../middleware/auth.js'

const router = Router()

// Multer config: store logo in memory, convert to base64
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter(_req, file, cb) {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Only image files are allowed'))
  },
})

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
      'SELECT id, email, business_name, plan, logo_url, accent_color, default_currency, proposals_this_month, stripe_customer_id, stripe_subscription_id, onboarding_completed, invoice_prefix, font_family FROM users WHERE id = $1',
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

// Update profile
router.put('/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { businessName, accentColor, defaultCurrency, invoicePrefix, fontFamily } = req.body
    const result = await query(
      `UPDATE users SET 
        business_name = COALESCE($1, business_name),
        accent_color = COALESCE($2, accent_color),
        default_currency = COALESCE($3, default_currency),
        invoice_prefix = COALESCE($4, invoice_prefix),
        font_family = COALESCE($5, font_family),
        updated_at = NOW()
       WHERE id = $6
       RETURNING id, email, business_name, plan, logo_url, accent_color, default_currency, invoice_prefix, font_family`,
      [businessName || null, accentColor || null, defaultCurrency || null,
       invoicePrefix || null, fontFamily || null, req.userId]
    )
    res.json({ user: result.rows[0] })
  } catch (err) {
    console.error('Update me error:', err)
    res.status(500).json({ error: 'Failed to update profile' })
  }
})

// Upload logo (stores as base64 data URL in logo_url column)
router.post('/upload-logo', requireAuth, upload.single('logo'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

    const dataUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`

    const result = await query(
      'UPDATE users SET logo_url = $1, updated_at = NOW() WHERE id = $2 RETURNING logo_url',
      [dataUrl, req.userId]
    )

    res.json({ logoUrl: result.rows[0].logo_url })
  } catch (err) {
    console.error('Logo upload error:', err)
    res.status(500).json({ error: 'Failed to upload logo' })
  }
})

// Remove logo
router.delete('/logo', requireAuth, async (req: AuthRequest, res) => {
  try {
    await query('UPDATE users SET logo_url = NULL, updated_at = NOW() WHERE id = $1', [req.userId])
    res.json({ success: true })
  } catch (err) {
    console.error('Remove logo error:', err)
    res.status(500).json({ error: 'Failed to remove logo' })
  }
})

// Forgot password — send reset email
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ error: 'Email is required' })

    const result = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()])

    // Always return success to prevent email enumeration
    if (result.rows.length === 0) {
      return res.json({ success: true })
    }

    const userId = result.rows[0].id
    const token = uuidv4()
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await query(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
      [token, expires.toISOString(), userId]
    )

    const baseUrl = process.env.REPLIT_DOMAINS
      ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
      : 'http://localhost:5000'
    const resetUrl = `${baseUrl}/reset-password?token=${token}`

    const resendKey = process.env.RESEND_API_KEY
    if (resendKey) {
      try {
        const { Resend } = await import('resend')
        const resend = new Resend(resendKey)
        await resend.emails.send({
          from: 'ProposalForge <noreply@proposalforge.app>',
          to: email.toLowerCase(),
          subject: 'Reset your ProposalForge password',
          html: `
            <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;">
              <h2 style="margin-bottom:8px;">Reset your password</h2>
              <p style="color:#6b7280;margin-bottom:24px;">Click the button below to set a new password. This link expires in 1 hour.</p>
              <a href="${resetUrl}" style="background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:600;">Reset Password</a>
              <p style="color:#9ca3af;font-size:12px;margin-top:24px;">If you didn't request this, you can safely ignore this email.</p>
            </div>
          `,
        })
      } catch (emailErr) {
        console.error('Reset email send failed:', emailErr)
        // Non-fatal — token is still in the DB
      }
    } else {
      console.log(`[DEV] Password reset link: ${resetUrl}`)
    }

    res.json({ success: true })
  } catch (err) {
    console.error('Forgot password error:', err)
    res.status(500).json({ error: 'Failed to process request' })
  }
})

// Validate reset token
router.get('/reset-password/validate', async (req, res) => {
  try {
    const { token } = req.query
    if (!token) return res.json({ valid: false })

    const result = await query(
      'SELECT id FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()',
      [token]
    )

    res.json({ valid: result.rows.length > 0 })
  } catch (err) {
    console.error('Validate token error:', err)
    res.json({ valid: false })
  }
})

// Complete onboarding
router.post('/complete-onboarding', requireAuth, async (req: AuthRequest, res) => {
  try {
    await query('UPDATE users SET onboarding_completed = TRUE, updated_at = NOW() WHERE id = $1', [req.userId])
    res.json({ success: true })
  } catch (err) {
    console.error('Complete onboarding error:', err)
    res.status(500).json({ error: 'Failed to complete onboarding' })
  }
})

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body
    if (!token || !password) return res.status(400).json({ error: 'Token and password are required' })
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' })

    const result = await query(
      'SELECT id FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()',
      [token]
    )

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Reset link is invalid or has expired' })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    await query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL, updated_at = NOW() WHERE id = $2',
      [passwordHash, result.rows[0].id]
    )

    res.json({ success: true })
  } catch (err) {
    console.error('Reset password error:', err)
    res.status(500).json({ error: 'Failed to reset password' })
  }
})

export default router
