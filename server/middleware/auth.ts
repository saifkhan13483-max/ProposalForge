import type { Request, Response, NextFunction } from 'express'
import { verifyFirebaseToken } from '../firebaseAdmin.js'
import { query } from '../db.js'

export interface AuthRequest extends Request {
  userId?: string
  userPlan?: string
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  try {
    const decoded = await verifyFirebaseToken(token)
    const firebaseUid = decoded.uid

    const result = await query('SELECT id, plan FROM users WHERE firebase_uid = $1', [firebaseUid])
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found. Please log in again.' })
    }

    req.userId = result.rows[0].id
    req.userPlan = result.rows[0].plan
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

export async function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (token) {
    try {
      const decoded = await verifyFirebaseToken(token)
      const result = await query('SELECT id, plan FROM users WHERE firebase_uid = $1', [decoded.uid])
      if (result.rows.length > 0) {
        req.userId = result.rows[0].id
        req.userPlan = result.rows[0].plan
      }
    } catch {
      // ignore
    }
  }
  next()
}
