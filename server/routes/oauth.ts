import { Router } from 'express'

const router = Router()

// Google OAuth is now handled by Firebase on the client side.
// These routes are kept as stubs to avoid 404s from any old bookmarks/links.

router.get('/google', (_req, res) => {
  res.redirect('/auth')
})

router.get('/google/callback', (_req, res) => {
  res.redirect('/auth')
})

export default router
