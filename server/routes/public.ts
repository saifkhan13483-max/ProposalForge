import { Router } from 'express'
import { query } from '../db.js'
import { GoogleGenerativeAI } from '@google/generative-ai'

const router = Router()

// In-memory demo rate limit (IP → last used date string)
const demoUsage = new Map<string, string>()

async function sendFreelancerEmail(to: string, subject: string, html: string) {
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) return
  try {
    const { Resend } = await import('resend')
    const resend = new Resend(resendKey)
    await resend.emails.send({
      from: 'ProposalForge <noreply@proposalforge.app>',
      to,
      subject,
      html,
    })
  } catch (err) {
    console.error('Notification email failed:', err)
  }
}

function getBaseUrl(): string {
  return process.env.REPLIT_DOMAINS
    ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
    : 'http://localhost:5000'
}

// Get proposal by accept token (public)
router.get('/proposal/:token', async (req, res) => {
  try {
    const result = await query(
      `SELECT p.*, u.business_name, u.logo_url, u.accent_color, u.plan, u.font_family,
        u.email as owner_email,
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

      // Notify the freelancer that client viewed the proposal
      if (proposal.owner_email) {
        sendFreelancerEmail(
          proposal.owner_email,
          `👀 Proposal viewed: ${proposal.title}`,
          `<h2>Your proposal was viewed!</h2>
           <p>Your client just opened your proposal: <strong>${proposal.title}</strong>.</p>
           <p>This is a great sign — consider following up if you don't hear back within 24 hours.</p>
           <a href="${getBaseUrl()}/proposals" style="background:#6366f1;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:16px;">View Proposals</a>`
        )
      }
    }

    res.json({ proposal })
  } catch (err) {
    console.error('Public proposal error:', err)
    res.status(500).json({ error: 'Failed to get proposal' })
  }
})

// Get comments for a proposal (public)
router.get('/proposal/:token/comments', async (req, res) => {
  try {
    const proposalResult = await query(
      'SELECT id FROM proposals WHERE accept_token = $1',
      [req.params.token]
    )
    if (proposalResult.rows.length === 0) return res.status(404).json({ error: 'Proposal not found' })

    const comments = await query(
      `SELECT id, comment, commenter_name, created_at
       FROM acceptance_events
       WHERE proposal_id = $1 AND event_type = 'comment' AND comment IS NOT NULL
       ORDER BY created_at ASC`,
      [proposalResult.rows[0].id]
    )
    res.json({ comments: comments.rows })
  } catch (err) {
    console.error('Get comments error:', err)
    res.status(500).json({ error: 'Failed to get comments' })
  }
})

// Accept proposal
router.post('/proposal/:token/accept', async (req, res) => {
  try {
    const { signerName } = req.body
    if (!signerName) return res.status(400).json({ error: 'Signer name is required' })

    const result = await query(
      `SELECT p.id, p.status, p.user_id, p.title, p.client_name,
        u.email as owner_email, u.business_name
       FROM proposals p JOIN users u ON u.id = p.user_id
       WHERE p.accept_token = $1`,
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
    const p = proposalFull.rows[0]
    const lineItemsResult = await query('SELECT * FROM quote_line_items WHERE proposal_id = $1 ORDER BY sort_order', [proposal.id])

    const [invCountResult, invUserResult] = await Promise.all([
      query('SELECT COUNT(*) as count FROM invoices WHERE user_id = $1', [proposal.user_id]),
      query('SELECT invoice_prefix FROM users WHERE id = $1', [proposal.user_id]),
    ])
    const invCount = parseInt(invCountResult.rows[0].count) + 1
    const invPrefix = invUserResult.rows[0]?.invoice_prefix || 'INV'
    const invoiceNumber = `${invPrefix}-${String(invCount).padStart(4, '0')}`
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

    // Notify the freelancer
    sendFreelancerEmail(
      proposal.owner_email,
      `🎉 Proposal accepted: ${proposal.title}`,
      `<h2>Great news! Your proposal was accepted.</h2>
       <p><strong>${signerName}</strong> (${proposal.client_name || 'your client'}) has accepted your proposal: <strong>${proposal.title}</strong>.</p>
       <p>An invoice has been automatically generated. Log in to your dashboard to view it.</p>
       <a href="${getBaseUrl()}/dashboard" style="background:#6366f1;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:16px;">View Dashboard</a>`
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
    const { comment, commenterName } = req.body
    if (!comment) return res.status(400).json({ error: 'Comment is required' })

    const result = await query(
      `SELECT p.id, p.title, p.client_name, u.email as owner_email, u.business_name
       FROM proposals p JOIN users u ON u.id = p.user_id
       WHERE p.accept_token = $1`,
      [req.params.token]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Proposal not found' })
    const proposal = result.rows[0]

    await query(
      'INSERT INTO acceptance_events (proposal_id, event_type, comment, commenter_name, ip_address) VALUES ($1, $2, $3, $4, $5)',
      [proposal.id, 'comment', comment, commenterName || null, req.ip]
    )

    // Notify the freelancer
    sendFreelancerEmail(
      proposal.owner_email,
      `💬 Change request on: ${proposal.title}`,
      `<h2>Your client has requested changes.</h2>
       <p><strong>${commenterName || proposal.client_name || 'Your client'}</strong> has left feedback on your proposal: <strong>${proposal.title}</strong>.</p>
       <blockquote style="border-left:3px solid #6366f1;padding:12px 16px;background:#f5f3ff;margin:16px 0;border-radius:0 8px 8px 0;">${comment}</blockquote>
       <a href="${getBaseUrl()}/proposals" style="background:#6366f1;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:8px;">View Proposals</a>`
    )

    res.json({ success: true })
  } catch (err) {
    console.error('Comment error:', err)
    res.status(500).json({ error: 'Failed to add comment' })
  }
})

// Decline proposal
router.post('/proposal/:token/decline', async (req, res) => {
  try {
    const { reason } = req.body

    const result = await query(
      `SELECT p.id, p.status, p.user_id, p.title, p.client_name,
        u.email as owner_email, u.business_name
       FROM proposals p JOIN users u ON u.id = p.user_id
       WHERE p.accept_token = $1`,
      [req.params.token]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Proposal not found' })
    const proposal = result.rows[0]
    if (proposal.status === 'accepted') return res.status(409).json({ error: 'Proposal already accepted' })
    if (proposal.status === 'declined') return res.status(409).json({ error: 'Proposal already declined' })

    await query(
      'UPDATE proposals SET status = $1, updated_at = NOW() WHERE id = $2',
      ['declined', proposal.id]
    )

    await query(
      'INSERT INTO acceptance_events (proposal_id, event_type, comment, ip_address) VALUES ($1, $2, $3, $4)',
      [proposal.id, 'declined', reason || null, req.ip]
    )

    sendFreelancerEmail(
      proposal.owner_email,
      `Proposal declined: ${proposal.title}`,
      `<h2>Your proposal was declined.</h2>
       <p><strong>${proposal.client_name || 'Your client'}</strong> has declined your proposal: <strong>${proposal.title}</strong>.</p>
       ${reason ? `<p>Reason: <em>${reason}</em></p>` : ''}
       <a href="${getBaseUrl()}/proposals" style="background:#6366f1;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:16px;">View Proposals</a>`
    )

    res.json({ success: true })
  } catch (err) {
    console.error('Decline proposal error:', err)
    res.status(500).json({ error: 'Failed to decline proposal' })
  }
})

// Anonymous demo generation
router.post('/demo/generate', async (req, res) => {
  const ip = (req.ip || '').replace(/^::ffff:/, '')
  const today = new Date().toISOString().slice(0, 10)

  if (demoUsage.get(ip) === today) {
    return res.status(429).json({ error: 'Demo limit reached. Sign up for a free account to generate more proposals.' })
  }

  const { projectDescription, clientName, projectType, budget, timeline } = req.body
  if (!projectDescription?.trim()) {
    return res.status(400).json({ error: 'Project description is required' })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return res.status(503).json({ error: 'AI generation not configured' })
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const prompt = `You are a senior proposal writer for freelancers and agencies. Generate a professional client proposal.

Client: ${clientName || 'Client'}
Project Type: ${projectType || 'other'}
Project Description: ${projectDescription}
Budget Range: ${budget || 'To be discussed'}
Timeline: ${timeline || 'To be discussed'}
Currency: USD

Return ONLY valid JSON with this exact structure:
{
  "executiveSummary": "2-3 paragraph executive summary as plain text",
  "scopeOfWork": "Detailed scope of work",
  "deliverables": ["deliverable 1", "deliverable 2", "deliverable 3"],
  "timeline": "Project timeline description",
  "terms": "Standard terms and conditions",
  "lineItems": [
    {"description": "Service name", "quantity": 1, "unitPrice": 1000}
  ],
  "totalEstimate": 1500
}`

    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in response')
    const proposal = JSON.parse(jsonMatch[0])

    demoUsage.set(ip, today)

    res.json({ proposal })
  } catch (err) {
    console.error('Demo generate error:', err)
    res.status(500).json({ error: 'Generation failed. Please try again.' })
  }
})

export default router
