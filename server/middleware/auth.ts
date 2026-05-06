import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'proposalforge-secret-key-change-in-production'

export interface AuthRequest extends Request {
  userId?: string
  userPlan?: string
}

export function generateToken(userId: string, plan: string = 'free'): string {
  return jwt.sign({ userId, plan }, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): { userId: string; plan: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; plan: string }
  } catch {
    return null
  }
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; plan: string }
    req.userId = decoded.userId
    req.userPlan = decoded.plan
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; plan: string }
      req.userId = decoded.userId
      req.userPlan = decoded.plan
    } catch {
      // ignore
    }
  }
  next()
}
