import { Router } from 'express'
import { query } from '../db.js'
import { generateToken } from '../middleware/auth.js'

const router = Router()

function getGoogleAuthUrl(): string {
  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) throw new Error('GOOGLE_CLIENT_ID not configured')
  const baseUrl = process.env.REPLIT_DOMAINS
    ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
    : 'http://localhost:5000'
  const redirectUri = `${baseUrl}/api/auth/google/callback`
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

async function exchangeCode(code: string): Promise<{ email: string; name: string; googleId: string }> {
  const clientId = process.env.GOOGLE_CLIENT_ID!
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!
  const baseUrl = process.env.REPLIT_DOMAINS
    ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
    : 'http://localhost:5000'
  const redirectUri = `${baseUrl}/api/auth/google/callback`

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })
  const tokenData = await tokenRes.json() as { access_token?: string; error?: string }
  if (!tokenData.access_token) throw new Error(tokenData.error || 'Token exchange failed')

  const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  })
  const userData = await userRes.json() as { id: string; email: string; name: string }
  return { email: userData.email, name: userData.name, googleId: userData.id }
}

router.get('/google', (_req, res) => {
  try {
    const url = getGoogleAuthUrl()
    res.redirect(url)
  } catch (err) {
    const baseUrl = process.env.REPLIT_DOMAINS
      ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
      : 'http://localhost:5000'
    res.redirect(`${baseUrl}/auth?error=google_not_configured`)
  }
})

router.get('/google/callback', async (req, res) => {
  const baseUrl = process.env.REPLIT_DOMAINS
    ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
    : 'http://localhost:5000'
  try {
    const { code, error } = req.query as { code?: string; error?: string }
    if (error || !code) {
      return res.redirect(`${baseUrl}/auth?error=google_denied`)
    }

    const { email, name, googleId } = await exchangeCode(code)

    let userResult = await query('SELECT * FROM users WHERE google_id = $1', [googleId])

    if (userResult.rows.length === 0) {
      userResult = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()])
    }

    let user: Record<string, unknown>

    if (userResult.rows.length > 0) {
      const existing = userResult.rows[0]
      await query(
        'UPDATE users SET google_id = $1, updated_at = NOW() WHERE id = $2',
        [googleId, existing.id]
      )
      user = existing
    } else {
      const newUser = await query(
        `INSERT INTO users (email, google_id, business_name, billing_period_start)
         VALUES ($1, $2, $3, CURRENT_DATE)
         RETURNING *`,
        [email.toLowerCase(), googleId, name || null]
      )
      user = newUser.rows[0]
    }

    const token = generateToken(user.id as string, user.plan as string)
    const isNew = !user.onboarding_completed

    res.redirect(`${baseUrl}/auth/callback?token=${token}&new=${isNew ? '1' : '0'}`)
  } catch (err) {
    console.error('Google OAuth callback error:', err)
    res.redirect(`${baseUrl}/auth?error=google_failed`)
  }
})

export default router
