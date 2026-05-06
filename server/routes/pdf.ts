import { Router } from 'express'
import { query } from '../db.js'
import { requireAuth, type AuthRequest } from '../middleware/auth.js'

const router = Router()

function buildProposalHtml(proposal: Record<string, unknown>, lineItems: Record<string, unknown>[]): string {
  const accentColor = (proposal.accent_color as string) || '#6366f1'
  const content = (proposal.content as Record<string, unknown>) || {}
  const total = lineItems.reduce((sum, i) => sum + (Number(i.quantity) * Number(i.unit_price)), 0)

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  const deliverables = (content.deliverables as string[]) || []

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${proposal.title}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111827; background: #fff; font-size: 14px; line-height: 1.6; }
  .page { max-width: 800px; margin: 0 auto; padding: 48px 40px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 48px; padding-bottom: 24px; border-bottom: 2px solid ${accentColor}; }
  .brand { display: flex; align-items: center; gap: 12px; }
  .brand-icon { width: 40px; height: 40px; border-radius: 10px; background: ${accentColor}; display: flex; align-items: center; justify-content: center; color: white; font-size: 18px; font-weight: bold; }
  .brand-name { font-size: 18px; font-weight: 700; color: #111827; }
  .proposal-meta { text-align: right; }
  .proposal-meta p { font-size: 12px; color: #6b7280; }
  .hero { margin-bottom: 40px; }
  .hero h1 { font-size: 32px; font-weight: 800; color: #111827; margin-bottom: 8px; }
  .hero .subtitle { color: #6b7280; font-size: 15px; }
  .hero .total-box { display: inline-block; margin-top: 20px; padding: 12px 20px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; }
  .hero .total-label { font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; }
  .hero .total-value { font-size: 28px; font-weight: 800; color: ${accentColor}; }
  .personal-message { margin: 24px 0; padding: 16px 20px; background: #f0f9ff; border-left: 3px solid ${accentColor}; border-radius: 0 8px 8px 0; font-style: italic; color: #374151; }
  .section { margin-bottom: 36px; }
  .section h2 { font-size: 18px; font-weight: 700; color: #111827; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb; }
  .prose p { margin-bottom: 10px; color: #374151; }
  .prose ul, .prose ol { margin-left: 20px; margin-bottom: 10px; }
  .prose li { margin-bottom: 4px; color: #374151; }
  .prose strong { font-weight: 600; }
  .deliverables-list { list-style: none; }
  .deliverables-list li { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 8px; }
  .deliverables-list li::before { content: '✓'; color: ${accentColor}; font-weight: 700; flex-shrink: 0; }
  table { width: 100%; border-collapse: collapse; }
  thead th { text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.04em; padding: 8px 12px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
  thead th:last-child { text-align: right; }
  tbody td { padding: 12px; border-bottom: 1px solid #f3f4f6; color: #374151; vertical-align: top; }
  tbody td:not(:first-child) { text-align: right; white-space: nowrap; }
  tfoot td { padding: 14px 12px; font-weight: 700; font-size: 16px; border-top: 2px solid #e5e7eb; }
  tfoot td:last-child { text-align: right; color: ${accentColor}; font-size: 20px; }
  .footer { margin-top: 56px; padding-top: 20px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; }
  .footer p { font-size: 11px; color: #9ca3af; }
  .accepted-badge { display: inline-flex; align-items: center; gap: 6px; background: #dcfce7; color: #16a34a; font-size: 12px; font-weight: 600; padding: 6px 12px; border-radius: 20px; }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="brand">
      ${proposal.logo_url
        ? `<img src="${proposal.logo_url}" alt="${proposal.business_name}" style="height:40px;max-width:160px;object-fit:contain;">`
        : `<div class="brand-icon">${((proposal.business_name as string) || 'P')[0].toUpperCase()}</div>`
      }
      <span class="brand-name">${proposal.business_name || 'ProposalForge'}</span>
    </div>
    <div class="proposal-meta">
      <p><strong>${proposal.title}</strong></p>
      <p>Prepared for ${proposal.client_name || 'Client'}</p>
      ${proposal.accepted_at ? `<p style="color:#16a34a;font-weight:600;">✓ Accepted</p>` : ''}
    </div>
  </div>

  <div class="hero">
    <h1>${proposal.title}</h1>
    <p class="subtitle">Prepared for ${proposal.client_name || 'Client'} ${proposal.client_email ? `· ${proposal.client_email}` : ''}</p>
    ${total > 0 ? `
    <div class="total-box">
      <div class="total-label">Project Value</div>
      <div class="total-value">${formatCurrency(total)}</div>
    </div>` : ''}
  </div>

  ${proposal.personal_message ? `
  <div class="personal-message">
    "${proposal.personal_message}"
    <br><small style="color:#9ca3af;font-style:normal;margin-top:6px;display:block;">— ${proposal.business_name}</small>
  </div>` : ''}

  ${content.executiveSummary ? `
  <div class="section">
    <h2>Executive Summary</h2>
    <div class="prose">${content.executiveSummary}</div>
  </div>` : ''}

  ${content.scopeOfWork ? `
  <div class="section">
    <h2>Scope of Work</h2>
    <div class="prose">${content.scopeOfWork}</div>
  </div>` : ''}

  ${deliverables.length > 0 ? `
  <div class="section">
    <h2>Deliverables</h2>
    <ul class="deliverables-list">
      ${deliverables.map(d => `<li>${d}</li>`).join('')}
    </ul>
  </div>` : ''}

  ${lineItems.length > 0 ? `
  <div class="section">
    <h2>Project Quote</h2>
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th>Qty</th>
          <th>Unit Price</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${lineItems.map(item => `
        <tr>
          <td>${item.description}</td>
          <td>${item.quantity}</td>
          <td>${formatCurrency(Number(item.unit_price))}</td>
          <td>${formatCurrency(Number(item.quantity) * Number(item.unit_price))}</td>
        </tr>`).join('')}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3">Total</td>
          <td>${formatCurrency(total)}</td>
        </tr>
      </tfoot>
    </table>
  </div>` : ''}

  ${content.terms ? `
  <div class="section">
    <h2>Terms &amp; Conditions</h2>
    <div class="prose" style="font-size:12px;color:#6b7280;">${content.terms}</div>
  </div>` : ''}

  <div class="footer">
    <p>Generated by ProposalForge · ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    ${proposal.accepted_at ? `<span class="accepted-badge">✓ Accepted</span>` : ''}
  </div>
</div>
</body>
</html>`
}

async function generatePdf(html: string): Promise<Buffer> {
  const puppeteer = await import('puppeteer')
  const browser = await puppeteer.default.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    headless: true,
  })
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    })
    return Buffer.from(pdf)
  } finally {
    await browser.close()
  }
}

// Download PDF for authenticated user (their own proposal)
router.get('/:id/pdf', requireAuth, async (req: AuthRequest, res) => {
  try {
    const proposalResult = await query(
      `SELECT p.*, u.business_name, u.logo_url, u.accent_color
       FROM proposals p JOIN users u ON u.id = p.user_id
       WHERE p.id = $1 AND p.user_id = $2`,
      [req.params.id, req.userId]
    )
    if (proposalResult.rows.length === 0) return res.status(404).json({ error: 'Proposal not found' })

    const proposal = proposalResult.rows[0]
    const lineItemsResult = await query(
      'SELECT * FROM quote_line_items WHERE proposal_id = $1 ORDER BY sort_order',
      [req.params.id]
    )

    const html = buildProposalHtml(proposal, lineItemsResult.rows)
    const pdf = await generatePdf(html)

    const filename = `${(proposal.title as string).replace(/[^a-z0-9]/gi, '-').toLowerCase()}-proposal.pdf`
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Length', pdf.length)
    res.send(pdf)
  } catch (err) {
    console.error('PDF generation error:', err)
    res.status(500).json({ error: 'Failed to generate PDF' })
  }
})

// Download PDF for public proposal (client-facing)
export async function handlePublicPdf(req: import('express').Request, res: import('express').Response) {
  try {
    const result = await query(
      `SELECT p.*, u.business_name, u.logo_url, u.accent_color,
        (SELECT json_agg(json_build_object('description', description, 'quantity', quantity, 'unit_price', unit_price) ORDER BY sort_order)
         FROM quote_line_items WHERE proposal_id = p.id) as line_items_json
       FROM proposals p JOIN users u ON u.id = p.user_id
       WHERE p.accept_token = $1 AND p.status NOT IN ('draft')`,
      [req.params.token]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Proposal not found' })

    const proposal = result.rows[0]
    const lineItems = (proposal.line_items_json as Record<string, unknown>[]) || []

    const html = buildProposalHtml(proposal, lineItems)
    const pdf = await generatePdf(html)

    const filename = `${(proposal.title as string).replace(/[^a-z0-9]/gi, '-').toLowerCase()}-proposal.pdf`
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Length', pdf.length)
    res.send(pdf)
  } catch (err) {
    console.error('Public PDF error:', err)
    res.status(500).json({ error: 'Failed to generate PDF' })
  }
}

export default router
