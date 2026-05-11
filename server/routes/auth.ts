import { Router } from 'express'
import multer from 'multer'
import { query } from '../db.js'
import { requireAuth, type AuthRequest } from '../middleware/auth.js'
import { verifyFirebaseToken } from '../firebaseAdmin.js'

const router = Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Only image files are allowed'))
  },
})

// Firebase login/register — called after Firebase client-side auth succeeds
// Upserts user in our DB using the Firebase UID, returns our app user record
router.post('/firebase-login', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    const idToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!idToken) return res.status(401).json({ error: 'No token provided' })

    let decoded: Awaited<ReturnType<typeof verifyFirebaseToken>>
    try {
      decoded = await verifyFirebaseToken(idToken)
    } catch (firebaseErr) {
      const msg = (firebaseErr as Error).message || ''
      // Surface config problems clearly so they're easy to debug
      if (msg.includes('FIREBASE_SERVICE_ACCOUNT_JSON')) {
        console.error('Firebase Admin config error:', msg)
        return res.status(503).json({
          error: 'Server auth is misconfigured. Contact the site administrator.',
          detail: msg,
        })
      }
      // Expired / invalid token — normal auth failure
      return res.status(401).json({ error: 'Invalid or expired Firebase token' })
    }

    const { uid: firebaseUid, email, name } = decoded

    if (!email) return res.status(400).json({ error: 'Firebase account has no email' })

    // Try find by firebase_uid first, then by email (for migration of existing users)
    let result = await query('SELECT * FROM users WHERE firebase_uid = $1', [firebaseUid])

    if (result.rows.length === 0) {
      result = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()])
    }

    let user: Record<string, unknown>
    let isNew = false

    if (result.rows.length > 0) {
      const existing = result.rows[0]
      // Update firebase_uid if not set yet (migration case)
      if (!existing.firebase_uid) {
        await query('UPDATE users SET firebase_uid = $1, updated_at = NOW() WHERE id = $2', [firebaseUid, existing.id])
      }
      user = { ...existing, firebase_uid: firebaseUid }
    } else {
      const newUser = await query(
        `INSERT INTO users (email, firebase_uid, business_name, billing_period_start)
         VALUES ($1, $2, $3, CURRENT_DATE)
         RETURNING *`,
        [email.toLowerCase(), firebaseUid, name || null]
      )
      user = newUser.rows[0]
      isNew = true
    }

    const { password_hash: _ph, reset_token: _rt, reset_token_expires: _rte, ...safeUser } = user as Record<string, unknown>

    res.json({ user: safeUser, isNew })
  } catch (err) {
    console.error('Firebase login error:', err)
    res.status(401).json({ error: 'Authentication failed' })
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

// Upload logo
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

export default router
