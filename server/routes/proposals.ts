import { Router } from 'express'
import { query } from '../db.js'
import { requireAuth, type AuthRequest } from '../middleware/auth.js'
import { generateContent, hasGeminiKey } from '../lib/gemini.js'
import { getBaseUrl } from '../lib/baseUrl.js'

const router = Router()
router.use(requireAuth)

const FREE_TIER_LIMIT = 3

async function checkProposalLimit(userId: string): Promise<{ allowed: boolean; count: number }> {
  const userResult = await query(
    'SELECT plan, proposals_this_month, billing_period_start FROM users WHERE id = $1',
    [userId]
  )
  const user = userResult.rows[0]
  if (!user) return { allowed: false, count: 0 }
  if (user.plan === 'pro') return { allowed: true, count: user.proposals_this_month }

  // Reset counter if new billing period
  const periodStart = new Date(user.billing_period_start)
  const now = new Date()
  if (now.getMonth() !== periodStart.getMonth() || now.getFullYear() !== periodStart.getFullYear()) {
    await query('UPDATE users SET proposals_this_month = 0, billing_period_start = CURRENT_DATE WHERE id = $1', [userId])
    return { allowed: true, count: 0 }
  }

  return { allowed: user.proposals_this_month < FREE_TIER_LIMIT, count: user.proposals_this_month }
}

// List proposals
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { status, search, archived } = req.query
    let sql = `
      SELECT p.*, c.name as client_company,
        (SELECT COUNT(*) FROM quote_line_items WHERE proposal_id = p.id) as line_item_count
      FROM proposals p
      LEFT JOIN clients c ON c.id = p.client_id
      WHERE p.user_id = $1
    `
    const params: unknown[] = [req.userId]
    if (archived === 'true') {
      sql += ` AND p.archived = TRUE`
    } else {
      sql += ` AND (p.archived = FALSE OR p.archived IS NULL)`
    }
    if (status) { sql += ` AND p.status = $${params.length + 1}`; params.push(status) }
    if (search) { sql += ` AND (p.title ILIKE $${params.length + 1} OR p.client_name ILIKE $${params.length + 1})`; params.push(`%${search}%`) }
    sql += ' ORDER BY p.created_at DESC'

    const result = await query(sql, params)
    res.json({ proposals: result.rows })
  } catch (err) {
    console.error('List proposals error:', err)
    res.status(500).json({ error: 'Failed to list proposals' })
  }
})

// Create proposal
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { title, clientId, clientName, clientEmail, projectType, projectDescription, budgetRange, timeline } = req.body
    if (!title) return res.status(400).json({ error: 'Title is required' })

    const result = await query(
      `INSERT INTO proposals (user_id, client_id, title, client_name, client_email, project_type, project_description, budget_range, timeline)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [req.userId, clientId || null, title, clientName || null, clientEmail || null,
       projectType || 'other', projectDescription || null, budgetRange || null, timeline || null]
    )
    res.status(201).json({ proposal: result.rows[0] })
  } catch (err) {
    console.error('Create proposal error:', err)
    res.status(500).json({ error: 'Failed to create proposal' })
  }
})

// Get proposal with line items
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const result = await query(
      'SELECT * FROM proposals WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Proposal not found' })

    const lineItems = await query(
      'SELECT * FROM quote_line_items WHERE proposal_id = $1 ORDER BY sort_order',
      [req.params.id]
    )
    res.json({ proposal: result.rows[0], lineItems: lineItems.rows })
  } catch (err) {
    console.error('Get proposal error:', err)
    res.status(500).json({ error: 'Failed to get proposal' })
  }
})

// Update proposal
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { title, clientId, clientName, clientEmail, projectType, projectDescription, budgetRange, timeline, content, status, totalAmount, personalMessage } = req.body
    const result = await query(
      `UPDATE proposals SET
        title = COALESCE($1, title),
        client_id = COALESCE($2, client_id),
        client_name = COALESCE($3, client_name),
        client_email = COALESCE($4, client_email),
        project_type = COALESCE($5, project_type),
        project_description = COALESCE($6, project_description),
        budget_range = COALESCE($7, budget_range),
        timeline = COALESCE($8, timeline),
        content = COALESCE($9, content),
        status = COALESCE($10, status),
        total_amount = COALESCE($11, total_amount),
        personal_message = COALESCE($12, personal_message),
        updated_at = NOW()
       WHERE id = $13 AND user_id = $14
       RETURNING *`,
      [title || null, clientId || null, clientName || null, clientEmail || null,
       projectType || null, projectDescription || null, budgetRange || null, timeline || null,
       content ? JSON.stringify(content) : null, status || null,
       totalAmount || null, personalMessage || null,
       req.params.id, req.userId]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Proposal not found' })
    res.json({ proposal: result.rows[0] })
  } catch (err) {
    console.error('Update proposal error:', err)
    res.status(500).json({ error: 'Failed to update proposal' })
  }
})

// Delete proposal
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const result = await query(
      'DELETE FROM proposals WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Proposal not found' })
    res.json({ success: true })
  } catch (err) {
    console.error('Delete proposal error:', err)
    res.status(500).json({ error: 'Failed to delete proposal' })
  }
})

// Generate AI content
router.post('/:id/generate', async (req: AuthRequest, res) => {
  try {
    const { allowed, count } = await checkProposalLimit(req.userId!)
    if (!allowed) {
      return res.status(403).json({
        error: 'Free tier limit reached',
        message: `You've used all ${FREE_TIER_LIMIT} proposals for this month. Upgrade to Pro for unlimited proposals.`,
        upgradeRequired: true,
        currentCount: count,
      })
    }

    const proposalResult = await query(
      'SELECT * FROM proposals WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    )
    if (proposalResult.rows.length === 0) return res.status(404).json({ error: 'Proposal not found' })

    const userResult = await query(
      'SELECT business_name, accent_color, default_currency FROM users WHERE id = $1',
      [req.userId]
    )
    const proposal = proposalResult.rows[0]
    const user = userResult.rows[0]

    if (!hasGeminiKey()) {
      return res.status(503).json({ error: 'AI generation not configured. Please add GROQ_API_KEY.' })
    }

    const budgetHint = proposal.budget_range
      ? `The client's stated budget is ${proposal.budget_range}. Price your line items to fit naturally within this range.`
      : 'Provide realistic market-rate pricing.'

    const prompt = `You are an expert freelance proposal writer with 15 years of experience winning high-value client contracts. Your proposals are known for being detailed, persuasive, and tailored — never generic.

Write a complete professional proposal using the details below.

--- PROJECT DETAILS ---
Freelancer / Agency: ${user.business_name || 'Our Team'}
Client Name: ${proposal.client_name || 'the client'}
Project Type: ${proposal.project_type}
Project Description: ${proposal.project_description || 'Not provided'}
Budget Range: ${proposal.budget_range || 'To be discussed'}
Timeline: ${proposal.timeline || 'To be discussed'}
Currency: ${user.default_currency || 'USD'}

--- INSTRUCTIONS ---
- Write in a confident, professional tone — specific to the project described, never generic filler.
- executiveSummary: Write 3 substantial paragraphs. Paragraph 1: restate the client's challenge/goal in your own words. Paragraph 2: describe your proposed solution and approach. Paragraph 3: express confidence in delivery and invite them to move forward.
- scopeOfWork: Return as HTML. Use <p> for intro text and <ul><li> for feature/task lists. Be specific and detailed — list every major task, phase, and technology relevant to this project.
- whyUs: Return as HTML. 3-4 bullet points (<ul><li>) explaining why this freelancer/agency is the right choice for this specific project. Reference the project type and any relevant expertise.
- deliverables: List 5-8 specific, tangible deliverables the client will receive. Be concrete (e.g. "Fully deployed iOS and Android app" not just "Mobile app").
- timeline: Return as plain text (no HTML). Break down the project into weekly phases with clear milestones. Format as: "Week 1-2: Phase name — description. Week 3-4: ..." etc.
- nextSteps: Return as HTML. A short <ol><li> numbered list of 4-5 clear action items for the client to move forward (e.g. "Review and sign this proposal", "Schedule a kickoff call", etc.).
- terms: Return as HTML. Include payment schedule (e.g. 50% upfront, 50% on delivery), revision policy, IP ownership, confidentiality, and cancellation terms. Be professional and fair.
- lineItems: Generate 5-8 specific line items that together sum close to the stated budget. ${budgetHint} Each item should be a real, named deliverable or service phase — not vague entries.
- totalEstimate: The sum of all lineItem (quantity × unitPrice) values.

Return ONLY valid JSON with this exact structure (no markdown, no code fences):
{
  "executiveSummary": "three paragraphs of text...",
  "scopeOfWork": "<p>intro</p><ul><li>task 1</li><li>task 2</li></ul>",
  "whyUs": "<ul><li>reason 1</li><li>reason 2</li></ul>",
  "deliverables": ["Deliverable 1", "Deliverable 2", "Deliverable 3", "Deliverable 4", "Deliverable 5"],
  "timeline": "Week 1-2: Discovery — ... Week 3-5: Development — ...",
  "nextSteps": "<ol><li>Step 1</li><li>Step 2</li></ol>",
  "terms": "<p>Payment: ...</p><p>Revisions: ...</p>",
  "lineItems": [
    {"description": "Phase 1 – Discovery & Planning", "quantity": 1, "unitPrice": 1500},
    {"description": "UI/UX Design", "quantity": 1, "unitPrice": 2000},
    {"description": "Frontend Development", "quantity": 1, "unitPrice": 3000}
  ],
  "totalEstimate": 6500
}`

    const text = await generateContent(prompt)

    let aiContent
    try {
      const stripped = text.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim()
      const jsonMatch = stripped.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No JSON found in response')
      aiContent = JSON.parse(jsonMatch[0])
    } catch {
      return res.status(500).json({ error: 'Failed to parse AI response. Please try again.' })
    }

    // Save content and line items
    await query(
      'UPDATE proposals SET content = $1, total_amount = $2, updated_at = NOW() WHERE id = $3',
      [JSON.stringify(aiContent), aiContent.totalEstimate || 0, req.params.id]
    )

    // Delete existing line items and insert new ones
    await query('DELETE FROM quote_line_items WHERE proposal_id = $1', [req.params.id])
    if (aiContent.lineItems?.length) {
      for (let i = 0; i < aiContent.lineItems.length; i++) {
        const item = aiContent.lineItems[i]
        await query(
          'INSERT INTO quote_line_items (proposal_id, description, quantity, unit_price, sort_order) VALUES ($1, $2, $3, $4, $5)',
          [req.params.id, item.description, item.quantity || 1, item.unitPrice || 0, i]
        )
      }
    }

    // Increment proposal count for free users
    const userPlan = (await query('SELECT plan FROM users WHERE id = $1', [req.userId])).rows[0]?.plan
    if (userPlan !== 'pro') {
      await query('UPDATE users SET proposals_this_month = proposals_this_month + 1 WHERE id = $1', [req.userId])
    }

    const lineItems = await query(
      'SELECT * FROM quote_line_items WHERE proposal_id = $1 ORDER BY sort_order',
      [req.params.id]
    )
    const updatedProposal = await query('SELECT * FROM proposals WHERE id = $1', [req.params.id])

    res.json({ proposal: updatedProposal.rows[0], lineItems: lineItems.rows, content: aiContent })
  } catch (err) {
    console.error('Generate error:', err)
    res.status(500).json({ error: 'AI generation failed. Please try again.' })
  }
})

// Regenerate a section
router.post('/:id/regenerate-section', async (req: AuthRequest, res) => {
  try {
    const { section, instructions } = req.body
    const proposalResult = await query(
      'SELECT * FROM proposals WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    )
    if (proposalResult.rows.length === 0) return res.status(404).json({ error: 'Proposal not found' })
    const proposal = proposalResult.rows[0]

    if (!hasGeminiKey()) return res.status(503).json({ error: 'AI generation not configured' })

    const currentContent = proposal.content || {}
    const prompt = `You are a senior proposal writer. Regenerate the "${section}" section of a client proposal.

Project: ${proposal.project_description || 'Not provided'}
Client: ${proposal.client_name || 'Client'}
Project Type: ${proposal.project_type}
${instructions ? `Additional Instructions: ${instructions}` : ''}

Current content of this section: ${JSON.stringify(currentContent[section] || '')}

Return ONLY valid JSON: { "${section}": "new content here" }`

    const text = await generateContent(prompt)
    const stripped = text.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim()
    const jsonMatch = stripped.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return res.status(500).json({ error: 'Failed to parse AI response' })

    const newSection = JSON.parse(jsonMatch[0])
    const updatedContent = { ...currentContent, ...newSection }

    await query('UPDATE proposals SET content = $1, updated_at = NOW() WHERE id = $2', [JSON.stringify(updatedContent), req.params.id])

    res.json({ content: updatedContent, section: newSection })
  } catch (err) {
    console.error('Regenerate section error:', err)
    res.status(500).json({ error: 'Failed to regenerate section' })
  }
})

// Update line items
router.put('/:id/line-items', async (req: AuthRequest, res) => {
  try {
    const { lineItems } = req.body
    const proposal = await query('SELECT id FROM proposals WHERE id = $1 AND user_id = $2', [req.params.id, req.userId])
    if (proposal.rows.length === 0) return res.status(404).json({ error: 'Proposal not found' })

    await query('DELETE FROM quote_line_items WHERE proposal_id = $1', [req.params.id])
    let total = 0
    for (let i = 0; i < lineItems.length; i++) {
      const item = lineItems[i]
      const unitPrice = item.unit_price ?? item.unitPrice ?? 0
      const lineTotal = (item.quantity || 1) * unitPrice
      total += lineTotal
      await query(
        'INSERT INTO quote_line_items (proposal_id, description, quantity, unit_price, sort_order) VALUES ($1, $2, $3, $4, $5)',
        [req.params.id, item.description, item.quantity || 1, unitPrice, i]
      )
    }

    await query('UPDATE proposals SET total_amount = $1, updated_at = NOW() WHERE id = $2', [total, req.params.id])
    const updatedItems = await query('SELECT * FROM quote_line_items WHERE proposal_id = $1 ORDER BY sort_order', [req.params.id])
    res.json({ lineItems: updatedItems.rows, total })
  } catch (err) {
    console.error('Update line items error:', err)
    res.status(500).json({ error: 'Failed to update line items' })
  }
})

// Send proposal to client
router.post('/:id/send', async (req: AuthRequest, res) => {
  try {
    const { personalMessage } = req.body
    const proposalResult = await query(
      'SELECT p.*, u.business_name, u.email as owner_email FROM proposals p JOIN users u ON u.id = p.user_id WHERE p.id = $1 AND p.user_id = $2',
      [req.params.id, req.userId]
    )
    if (proposalResult.rows.length === 0) return res.status(404).json({ error: 'Proposal not found' })

    const proposal = proposalResult.rows[0]
    if (!proposal.client_email) return res.status(400).json({ error: 'Client email is required to send' })

    await query(
      'UPDATE proposals SET status = $1, sent_at = NOW(), personal_message = $2, updated_at = NOW() WHERE id = $3',
      ['sent', personalMessage || null, req.params.id]
    )

    const baseUrl = getBaseUrl()
    const acceptUrl = `${baseUrl}/proposal/${proposal.accept_token}`

    // Try to send email via Resend
    const resendKey = process.env.RESEND_API_KEY
    if (resendKey) {
      try {
        const { Resend } = await import('resend')
        const resend = new Resend(resendKey)
        await resend.emails.send({
          from: 'ProposalForge <noreply@proposalforge.app>',
          to: proposal.client_email,
          subject: `Proposal from ${proposal.business_name || 'Your Freelancer'}: ${proposal.title}`,
          html: `
            <h2>You've received a proposal!</h2>
            <p>${proposal.business_name || 'A freelancer'} has sent you a proposal for: <strong>${proposal.title}</strong></p>
            ${personalMessage ? `<p>"${personalMessage}"</p>` : ''}
            <a href="${acceptUrl}" style="background:#6366f1;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:16px;">View Proposal</a>
          `,
        })
      } catch (emailErr) {
        console.error('Email send failed:', emailErr)
      }
    }

    res.json({ success: true, acceptUrl })
  } catch (err) {
    console.error('Send proposal error:', err)
    res.status(500).json({ error: 'Failed to send proposal' })
  }
})

// Archive proposal
router.post('/:id/archive', async (req: AuthRequest, res) => {
  try {
    const result = await query(
      'UPDATE proposals SET archived = TRUE, updated_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Proposal not found' })
    res.json({ success: true })
  } catch (err) {
    console.error('Archive proposal error:', err)
    res.status(500).json({ error: 'Failed to archive proposal' })
  }
})

// Unarchive proposal
router.post('/:id/unarchive', async (req: AuthRequest, res) => {
  try {
    const result = await query(
      'UPDATE proposals SET archived = FALSE, updated_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Proposal not found' })
    res.json({ success: true })
  } catch (err) {
    console.error('Unarchive proposal error:', err)
    res.status(500).json({ error: 'Failed to unarchive proposal' })
  }
})

// Get client comments (change requests) for a proposal
router.get('/:id/comments', async (req: AuthRequest, res) => {
  try {
    const proposal = await query('SELECT id FROM proposals WHERE id = $1 AND user_id = $2', [req.params.id, req.userId])
    if (proposal.rows.length === 0) return res.status(404).json({ error: 'Proposal not found' })

    const comments = await query(
      `SELECT id, comment, commenter_name, created_at
       FROM acceptance_events
       WHERE proposal_id = $1 AND event_type = 'comment' AND comment IS NOT NULL
       ORDER BY created_at ASC`,
      [req.params.id]
    )
    res.json({ comments: comments.rows })
  } catch (err) {
    console.error('Get comments error:', err)
    res.status(500).json({ error: 'Failed to get comments' })
  }
})

// Duplicate proposal
router.post('/:id/duplicate', async (req: AuthRequest, res) => {
  try {
    const original = await query('SELECT * FROM proposals WHERE id = $1 AND user_id = $2', [req.params.id, req.userId])
    if (original.rows.length === 0) return res.status(404).json({ error: 'Proposal not found' })
    const p = original.rows[0]

    const newProposal = await query(
      `INSERT INTO proposals (user_id, client_id, title, client_name, client_email, project_type, project_description, budget_range, timeline, content, total_amount)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [p.user_id, p.client_id, `${p.title} (Copy)`, p.client_name, p.client_email,
       p.project_type, p.project_description, p.budget_range, p.timeline, p.content, p.total_amount]
    )

    const lineItems = await query('SELECT * FROM quote_line_items WHERE proposal_id = $1 ORDER BY sort_order', [req.params.id])
    for (const item of lineItems.rows) {
      await query(
        'INSERT INTO quote_line_items (proposal_id, description, quantity, unit_price, sort_order) VALUES ($1, $2, $3, $4, $5)',
        [newProposal.rows[0].id, item.description, item.quantity, item.unit_price, item.sort_order]
      )
    }

    res.status(201).json({ proposal: newProposal.rows[0] })
  } catch (err) {
    console.error('Duplicate proposal error:', err)
    res.status(500).json({ error: 'Failed to duplicate proposal' })
  }
})

export default router
