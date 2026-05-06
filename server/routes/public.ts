import { Router } from 'express'
import { query } from '../db.js'

const router = Router()

// Get proposal by accept token (public)
router.get('/proposal/:token', async (req, res) => {
  try {
    const result = await query(
      `SELECT p.*, u.business_name, u.logo_url, u.accent_color,
        (SELECT json_agg(json_build_object('description', description, 'quantity', quantity, 'unit_price', unit_price) ORDER BY sort_order) 
         FROM quote_line_items WHERE proposal_id = p.id) as line_items
       FROM proposals p
       JOIN users u ON u.id = p.user_id
       WHERE p.accept_token = $1 AND p.status NOT IN ('draft')`,
      [req.params.token]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Proposal not found or not yet sent' })

    const proposal = result.rows[0]

    // Track view if not already viewed
    if (!proposal.viewed_at) {
      await query('UPDATE proposals SET viewed_at = NOW(), status = CASE WHEN status = \'sent\' THEN \'viewed\' ELSE status END WHERE accept_token = $1', [req.params.token])
      await query(
        'INSERT INTO acceptance_events (proposal_id, event_type, ip_address) VALUES ($1, $2, $3)',
        [proposal.id, 'viewed', req.ip]
      )
    }

    res.json({ proposal })
  } catch (err) {
    console.error('Public proposal error:', err)
    res.status(500).json({ error: 'Failed to get proposal' })
  }
})

// Accept proposal
router.post('/proposal/:token/accept', async (req, res) => {
  try {
    const { signerName } = req.body
    if (!signerName) return res.status(400).json({ error: 'Signer name is required' })

    const result = await query(
      'SELECT id, status, user_id FROM proposals WHERE accept_token = $1',
      [req.params.token]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Proposal not found' })
    const proposal = result.rows[0]
    if (proposal.status === 'accepted') return res.status(409).json({ error: 'Proposal already accepted' })

    await query(
      'UPDATE proposals SET status = $1, accepted_at = NOW(), accepted_by = $2, updated_at = NOW() WHERE id = $3',
      ['accepted', signerName, proposal.id]
    )

    await query(
      'INSERT INTO acceptance_events (proposal_id, event_type, signer_name, ip_address) VALUES ($1, $2, $3, $4)',
      [proposal.id, 'accepted', signerName, req.ip]
    )

    // Auto-create invoice from proposal
    const proposalFull = await query('SELECT * FROM proposals WHERE id = $1', [proposal.id])
    const userResult = await query('SELECT default_currency FROM users WHERE id = $1', [proposal.user_id])
    const p = proposalFull.rows[0]
    const lineItemsResult = await query('SELECT * FROM quote_line_items WHERE proposal_id = $1 ORDER BY sort_order', [proposal.id])

    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`
    const lineItems = lineItemsResult.rows.map(i => ({
      description: i.description,
      quantity: parseFloat(i.quantity),
      unitPrice: parseFloat(i.unit_price),
    }))
    const subtotal = parseFloat(p.total_amount || 0)

    await query(
      `INSERT INTO invoices (user_id, proposal_id, invoice_number, client_name, client_email, line_items, subtotal, total, due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW() + INTERVAL '30 days')`,
      [proposal.user_id, proposal.id, invoiceNumber, p.client_name, p.client_email,
       JSON.stringify(lineItems), subtotal, subtotal]
    )

    res.json({ success: true, message: 'Proposal accepted!' })
  } catch (err) {
    console.error('Accept proposal error:', err)
    res.status(500).json({ error: 'Failed to accept proposal' })
  }
})

// Add comment to proposal
router.post('/proposal/:token/comment', async (req, res) => {
  try {
    const { comment } = req.body
    if (!comment) return res.status(400).json({ error: 'Comment is required' })

    const result = await query('SELECT id FROM proposals WHERE accept_token = $1', [req.params.token])
    if (result.rows.length === 0) return res.status(404).json({ error: 'Proposal not found' })

    await query(
      'INSERT INTO acceptance_events (proposal_id, event_type, comment, ip_address) VALUES ($1, $2, $3, $4)',
      [result.rows[0].id, 'comment', comment, req.ip]
    )

    res.json({ success: true })
  } catch (err) {
    console.error('Comment error:', err)
    res.status(500).json({ error: 'Failed to add comment' })
  }
})

export default router
