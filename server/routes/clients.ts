import { Router } from 'express'
import { query } from '../db.js'
import { requireAuth, type AuthRequest } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

// List clients
router.get('/', async (req: AuthRequest, res) => {
  try {
    const result = await query(
      `SELECT c.*, 
        COUNT(DISTINCT p.id) as proposal_count,
        COUNT(DISTINCT i.id) as invoice_count
       FROM clients c
       LEFT JOIN proposals p ON p.client_id = c.id
       LEFT JOIN invoices i ON i.client_id = c.id
       WHERE c.user_id = $1
       GROUP BY c.id
       ORDER BY c.created_at DESC`,
      [req.userId]
    )
    res.json({ clients: result.rows })
  } catch (err) {
    console.error('List clients error:', err)
    res.status(500).json({ error: 'Failed to list clients' })
  }
})

// Create client
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { name, email, company, phone, notes } = req.body
    if (!name) return res.status(400).json({ error: 'Name is required' })

    const result = await query(
      `INSERT INTO clients (user_id, name, email, company, phone, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [req.userId, name, email || null, company || null, phone || null, notes || null]
    )
    res.status(201).json({ client: result.rows[0] })
  } catch (err) {
    console.error('Create client error:', err)
    res.status(500).json({ error: 'Failed to create client' })
  }
})

// Get client
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const result = await query(
      'SELECT * FROM clients WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Client not found' })
    res.json({ client: result.rows[0] })
  } catch (err) {
    console.error('Get client error:', err)
    res.status(500).json({ error: 'Failed to get client' })
  }
})

// Update client
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { name, email, company, phone, notes } = req.body
    const result = await query(
      `UPDATE clients SET
        name = COALESCE($1, name),
        email = COALESCE($2, email),
        company = COALESCE($3, company),
        phone = COALESCE($4, phone),
        notes = COALESCE($5, notes),
        updated_at = NOW()
       WHERE id = $6 AND user_id = $7
       RETURNING *`,
      [name || null, email || null, company || null, phone || null, notes || null, req.params.id, req.userId]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Client not found' })
    res.json({ client: result.rows[0] })
  } catch (err) {
    console.error('Update client error:', err)
    res.status(500).json({ error: 'Failed to update client' })
  }
})

// Delete client
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const result = await query(
      'DELETE FROM clients WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Client not found' })
    res.json({ success: true })
  } catch (err) {
    console.error('Delete client error:', err)
    res.status(500).json({ error: 'Failed to delete client' })
  }
})

export default router
