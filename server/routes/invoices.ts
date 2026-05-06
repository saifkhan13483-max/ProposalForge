import { Router } from 'express'
import { query } from '../db.js'
import { requireAuth, type AuthRequest } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

async function getNextInvoiceNumber(userId: string): Promise<string> {
  const result = await query(
    'SELECT COUNT(*) as count FROM invoices WHERE user_id = $1',
    [userId]
  )
  const count = parseInt(result.rows[0].count) + 1
  return `INV-${String(count).padStart(4, '0')}`
}

// List invoices
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { status } = req.query
    let sql = 'SELECT * FROM invoices WHERE user_id = $1'
    const params: unknown[] = [req.userId]
    if (status) { sql += ` AND status = $${params.length + 1}`; params.push(status) }
    sql += ' ORDER BY created_at DESC'
    const result = await query(sql, params)
    res.json({ invoices: result.rows })
  } catch (err) {
    console.error('List invoices error:', err)
    res.status(500).json({ error: 'Failed to list invoices' })
  }
})

// Create invoice
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { proposalId, clientId, clientName, clientEmail, lineItems, taxRate, dueDate, notes } = req.body
    const invoiceNumber = await getNextInvoiceNumber(req.userId!)

    const items = lineItems || []
    const subtotal = items.reduce((sum: number, item: { quantity: number; unitPrice: number }) =>
      sum + (item.quantity || 1) * (item.unitPrice || 0), 0)
    const tax = parseFloat(taxRate || 0)
    const taxAmount = subtotal * (tax / 100)
    const total = subtotal + taxAmount

    const result = await query(
      `INSERT INTO invoices (user_id, proposal_id, client_id, invoice_number, client_name, client_email,
         line_items, subtotal, tax_rate, tax_amount, total, due_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [req.userId, proposalId || null, clientId || null, invoiceNumber,
       clientName || null, clientEmail || null, JSON.stringify(items),
       subtotal, tax, taxAmount, total, dueDate || null, notes || null]
    )
    res.status(201).json({ invoice: result.rows[0] })
  } catch (err) {
    console.error('Create invoice error:', err)
    res.status(500).json({ error: 'Failed to create invoice' })
  }
})

// Get invoice
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const result = await query(
      'SELECT * FROM invoices WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Invoice not found' })
    res.json({ invoice: result.rows[0] })
  } catch (err) {
    console.error('Get invoice error:', err)
    res.status(500).json({ error: 'Failed to get invoice' })
  }
})

// Update invoice
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { clientName, clientEmail, lineItems, taxRate, dueDate, notes, status } = req.body
    const items = lineItems || []
    const subtotal = items.length > 0
      ? items.reduce((sum: number, item: { quantity: number; unitPrice: number }) =>
          sum + (item.quantity || 1) * (item.unitPrice || 0), 0)
      : null
    const tax = taxRate !== undefined ? parseFloat(taxRate) : null
    const taxAmount = subtotal !== null && tax !== null ? subtotal * (tax / 100) : null
    const total = subtotal !== null && taxAmount !== null ? subtotal + taxAmount : null

    const result = await query(
      `UPDATE invoices SET
        client_name = COALESCE($1, client_name),
        client_email = COALESCE($2, client_email),
        line_items = COALESCE($3, line_items),
        subtotal = COALESCE($4, subtotal),
        tax_rate = COALESCE($5, tax_rate),
        tax_amount = COALESCE($6, tax_amount),
        total = COALESCE($7, total),
        due_date = COALESCE($8, due_date),
        notes = COALESCE($9, notes),
        status = COALESCE($10, status),
        updated_at = NOW()
       WHERE id = $11 AND user_id = $12
       RETURNING *`,
      [clientName || null, clientEmail || null,
       lineItems ? JSON.stringify(items) : null,
       subtotal, tax, taxAmount, total,
       dueDate || null, notes || null, status || null,
       req.params.id, req.userId]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Invoice not found' })
    res.json({ invoice: result.rows[0] })
  } catch (err) {
    console.error('Update invoice error:', err)
    res.status(500).json({ error: 'Failed to update invoice' })
  }
})

// Mark as paid manually
router.post('/:id/mark-paid', async (req: AuthRequest, res) => {
  try {
    const result = await query(
      `UPDATE invoices SET status = 'paid', paid_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND user_id = $2 RETURNING *`,
      [req.params.id, req.userId]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Invoice not found' })
    res.json({ invoice: result.rows[0] })
  } catch (err) {
    console.error('Mark paid error:', err)
    res.status(500).json({ error: 'Failed to mark invoice as paid' })
  }
})

// Create Stripe checkout for invoice
router.post('/:id/checkout', async (req: AuthRequest, res) => {
  try {
    const invoiceResult = await query(
      'SELECT * FROM invoices WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    )
    if (invoiceResult.rows.length === 0) return res.status(404).json({ error: 'Invoice not found' })
    const invoice = invoiceResult.rows[0]

    const { getUncachableStripeClient } = await import('../stripeClient.js')
    const stripe = await getUncachableStripeClient()

    const baseUrl = process.env.REPLIT_DOMAINS
      ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
      : 'http://localhost:5000'

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: `Invoice ${invoice.invoice_number}` },
          unit_amount: Math.round(parseFloat(invoice.total) * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${baseUrl}/invoices/${req.params.id}?paid=true`,
      cancel_url: `${baseUrl}/invoices/${req.params.id}`,
      metadata: { invoiceId: req.params.id },
    })

    await query(
      'UPDATE invoices SET stripe_checkout_session_id = $1 WHERE id = $2',
      [session.id, req.params.id]
    )

    res.json({ url: session.url })
  } catch (err) {
    console.error('Invoice checkout error:', err)
    res.status(500).json({ error: 'Failed to create checkout session' })
  }
})

// Send invoice to client via email
router.post('/:id/send', async (req: AuthRequest, res) => {
  try {
    const invoiceResult = await query(
      'SELECT * FROM invoices WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    )
    if (invoiceResult.rows.length === 0) return res.status(404).json({ error: 'Invoice not found' })
    const invoice = invoiceResult.rows[0]
    if (!invoice.client_email) return res.status(400).json({ error: 'Client email is required to send invoice' })

    const userResult = await query('SELECT business_name, email FROM users WHERE id = $1', [req.userId])
    const user = userResult.rows[0]

    const baseUrl = process.env.REPLIT_DOMAINS
      ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
      : 'http://localhost:5000'

    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) return res.status(503).json({ error: 'Email not configured. Please add RESEND_API_KEY.' })

    const { Resend } = await import('resend')
    const resend = new Resend(resendKey)
    await resend.emails.send({
      from: 'ProposalForge <noreply@proposalforge.app>',
      to: invoice.client_email,
      subject: `Invoice ${invoice.invoice_number} from ${user.business_name || 'Your Freelancer'}`,
      html: `
        <h2>Invoice ${invoice.invoice_number}</h2>
        <p>${user.business_name || 'Your freelancer'} has sent you an invoice for <strong>${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(parseFloat(invoice.total))}</strong>.</p>
        ${invoice.due_date ? `<p>Due date: <strong>${new Date(invoice.due_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong></p>` : ''}
        ${invoice.notes ? `<p>${invoice.notes}</p>` : ''}
        <a href="${baseUrl}/invoices/${invoice.id}" style="background:#6366f1;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:16px;">View & Pay Invoice</a>
      `,
    })

    await query(
      `UPDATE invoices SET status = CASE WHEN status = 'draft' THEN 'sent' ELSE status END, updated_at = NOW() WHERE id = $1`,
      [req.params.id]
    )

    const updated = await query('SELECT * FROM invoices WHERE id = $1', [req.params.id])
    res.json({ success: true, invoice: updated.rows[0] })
  } catch (err) {
    console.error('Send invoice error:', err)
    res.status(500).json({ error: 'Failed to send invoice' })
  }
})

// Delete invoice
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const result = await query(
      'DELETE FROM invoices WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Invoice not found' })
    res.json({ success: true })
  } catch (err) {
    console.error('Delete invoice error:', err)
    res.status(500).json({ error: 'Failed to delete invoice' })
  }
})

export default router
