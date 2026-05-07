import { Router, Request, Response } from 'express'

const router = Router()

function getBaseUrl(req: Request): string {
  if (process.env.REPLIT_DOMAINS) {
    return `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
  }
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https'
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'proposalforge.replit.app'
  return `${proto}://${host}`
}

router.get('/sitemap.xml', (req: Request, res: Response) => {
  const base = getBaseUrl(req)
  const now = new Date().toISOString().split('T')[0]

  const pages = [
    { path: '/',      priority: '1.0', changefreq: 'weekly' },
    { path: '/auth',  priority: '0.5', changefreq: 'monthly' },
    { path: '/demo',  priority: '0.8', changefreq: 'weekly' },
  ]

  const urls = pages
    .map(
      ({ path, priority, changefreq }) => `
  <url>
    <loc>${base}${path}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
    )
    .join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`

  res.setHeader('Content-Type', 'application/xml; charset=utf-8')
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600')
  res.send(xml)
})

router.get('/robots.txt', (req: Request, res: Response) => {
  const base = getBaseUrl(req)

  const content = `User-agent: *
Allow: /
Allow: /auth
Allow: /demo
Allow: /proposal/

# Block authenticated / private application routes
Disallow: /dashboard
Disallow: /proposals/
Disallow: /invoices/
Disallow: /clients/
Disallow: /settings
Disallow: /analytics
Disallow: /onboarding
Disallow: /auth/callback
Disallow: /forgot-password
Disallow: /reset-password

# Block all API endpoints
Disallow: /api/

# Sitemap location
Sitemap: ${base}/sitemap.xml
`

  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.setHeader('Cache-Control', 'public, max-age=86400')
  res.send(content)
})

export default router
