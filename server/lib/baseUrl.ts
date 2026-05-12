/**
 * Returns the public base URL for this deployment.
 * Priority order:
 *  1. PUBLIC_URL  — set manually on Railway / any host
 *  2. FRONTEND_URL — the Vercel frontend URL (used for proposal/invoice links clients see)
 *  3. REPLIT_DOMAINS — auto-set by platform (legacy fallback)
 *  4. localhost fallback for local dev
 */
export function getBaseUrl(fallbackPort = 5000): string {
  if (process.env.PUBLIC_URL) return process.env.PUBLIC_URL.replace(/\/$/, '')
  if (process.env.FRONTEND_URL) {
    const first = process.env.FRONTEND_URL.split(',')[0].trim()
    return first.replace(/\/$/, '')
  }
  if (process.env.REPLIT_DOMAINS) {
    return `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
  }
  return `http://localhost:${fallbackPort}`
}
