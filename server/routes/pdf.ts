import { Router } from 'express'
import { query } from '../db.js'
import { requireAuth, type AuthRequest } from '../middleware/auth.js'

const router = Router()

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.substring(0, 2), 16)
  const g = parseInt(clean.substring(2, 4), 16)
  const b = parseInt(clean.substring(4, 6), 16)
  return [r, g, b]
}

type PdfContent = Record<string, unknown>

function buildProposalPdfContent(proposal: Record<string, unknown>, lineItems: Record<string, unknown>[]): PdfContent {
  const accentHex = (proposal.accent_color as string) || '#6366f1'
  const accentRgb = hexToRgb(accentHex)
  const content = (proposal.content as Record<string, unknown>) || {}
  const total = lineItems.reduce((sum, i) => sum + (Number(i.quantity) * Number(i.unit_price)), 0)
  const deliverables = (content.deliverables as string[]) || []

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  const accent = { r: accentRgb[0], g: accentRgb[1], b: accentRgb[2] }

  const sectionHeader = (title: string): PdfContent => ({
    text: title,
    fontSize: 14,
    bold: true,
    color: accentHex,
    margin: [0, 20, 0, 6],
    decoration: 'underline',
    decorationColor: '#e5e7eb',
  })

  const docContent: PdfContent[] = []

  // Header bar
  docContent.push({
    canvas: [{ type: 'rect', x: 0, y: 0, w: 515, h: 4, r: 2, color: accentHex }],
    margin: [0, 0, 0, 16],
  })

  // Title + client row
  docContent.push({
    columns: [
      {
        stack: [
          { text: proposal.title as string, fontSize: 22, bold: true, color: '#111827' },
          { text: `Prepared for ${proposal.client_name || 'Client'}${proposal.client_email ? ' · ' + proposal.client_email : ''}`, fontSize: 11, color: '#6b7280', margin: [0, 4, 0, 0] },
        ],
      },
      {
        stack: [
          { text: (proposal.business_name as string) || 'ProposalForge', fontSize: 13, bold: true, color: '#111827', alignment: 'right' },
          ...(total > 0 ? [{ text: formatCurrency(total), fontSize: 20, bold: true, color: accentHex, alignment: 'right', margin: [0, 4, 0, 0] }] : []),
        ],
      },
    ],
    margin: [0, 0, 0, 16],
  })

  // Divider
  docContent.push({
    canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#e5e7eb' }],
    margin: [0, 0, 0, 16],
  })

  // Personal message
  if (proposal.personal_message) {
    docContent.push({
      text: `"${proposal.personal_message}"`,
      italics: true,
      color: '#374151',
      background: '#f0f9ff',
      margin: [0, 0, 0, 16],
      padding: [12, 8, 12, 8],
    } as PdfContent)
  }

  // Executive Summary
  if (content.executiveSummary) {
    docContent.push(sectionHeader('Executive Summary'))
    docContent.push({
      text: stripHtml(content.executiveSummary as string),
      fontSize: 10,
      color: '#374151',
      lineHeight: 1.5,
      margin: [0, 0, 0, 8],
    })
  }

  // Scope of Work
  if (content.scopeOfWork) {
    docContent.push(sectionHeader('Scope of Work'))
    const scopeText = stripHtml(content.scopeOfWork as string)
    const lines = scopeText.split('\n').filter(l => l.trim())
    const scopeItems = lines.map(line => {
      const trimmed = line.trim()
      const isBullet = trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')
      const isHeader = trimmed.endsWith(':') && trimmed.length < 60
      return {
        text: isBullet ? trimmed.replace(/^[•\-*]\s*/, '') : trimmed,
        bold: isHeader,
        fontSize: 10,
        color: '#374151',
        margin: isBullet ? [10, 1, 0, 1] : [0, 2, 0, 2],
        lineHeight: 1.4,
      }
    })
    docContent.push({ stack: scopeItems, margin: [0, 0, 0, 8] } as PdfContent)
  }

  // Deliverables
  if (deliverables.length > 0) {
    docContent.push(sectionHeader('Deliverables'))
    docContent.push({
      ul: deliverables.map(d => ({ text: d, fontSize: 10, color: '#374151', margin: [0, 2, 0, 2] })),
      margin: [0, 0, 0, 8],
    })
  }

  // Line items table
  if (lineItems.length > 0) {
    docContent.push(sectionHeader('Project Quote'))
    const tableBody: PdfContent[][] = [
      [
        { text: 'Description', bold: true, fontSize: 10, color: '#6b7280', fillColor: '#f9fafb' },
        { text: 'Qty', bold: true, fontSize: 10, color: '#6b7280', fillColor: '#f9fafb', alignment: 'right' },
        { text: 'Unit Price', bold: true, fontSize: 10, color: '#6b7280', fillColor: '#f9fafb', alignment: 'right' },
        { text: 'Total', bold: true, fontSize: 10, color: '#6b7280', fillColor: '#f9fafb', alignment: 'right' },
      ],
      ...lineItems.map(item => [
        { text: String(item.description || ''), fontSize: 10, color: '#374151' },
        { text: String(item.quantity || 1), fontSize: 10, color: '#374151', alignment: 'right' },
        { text: formatCurrency(Number(item.unit_price)), fontSize: 10, color: '#374151', alignment: 'right' },
        { text: formatCurrency(Number(item.quantity) * Number(item.unit_price)), fontSize: 10, color: '#374151', alignment: 'right' },
      ]),
      [
        { text: 'Total', colSpan: 3, bold: true, fontSize: 12, color: '#111827', border: [false, true, false, false] },
        {},
        {},
        { text: formatCurrency(total), bold: true, fontSize: 12, color: accentHex, alignment: 'right', border: [false, true, false, false] },
      ],
    ]
    docContent.push({
      table: { headerRows: 1, widths: ['*', 50, 80, 80], body: tableBody },
      layout: {
        hLineWidth: (i: number, node: { table: { body: unknown[] } }) => (i === 0 || i === 1 || i === node.table.body.length) ? 1 : 0.5,
        vLineWidth: () => 0,
        hLineColor: () => '#e5e7eb',
        paddingLeft: () => 8,
        paddingRight: () => 8,
        paddingTop: () => 8,
        paddingBottom: () => 8,
      },
      margin: [0, 0, 0, 8],
    } as PdfContent)
  }

  // Terms
  if (content.terms) {
    docContent.push(sectionHeader('Terms & Conditions'))
    docContent.push({
      text: stripHtml(content.terms as string),
      fontSize: 9,
      color: '#6b7280',
      lineHeight: 1.5,
      margin: [0, 0, 0, 8],
    })
  }

  // Footer divider
  docContent.push({
    canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#e5e7eb' }],
    margin: [0, 20, 0, 8],
  })
  docContent.push({
    columns: [
      { text: `Generated by ProposalForge · ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, fontSize: 9, color: '#9ca3af' },
      ...(proposal.accepted_at ? [{ text: '✓ Accepted', fontSize: 9, color: '#16a34a', bold: true, alignment: 'right' }] : []),
    ],
  })

  return {
    content: docContent,
    defaultStyle: { font: 'Roboto', fontSize: 11, color: '#111827' },
    pageMargins: [40, 40, 40, 40],
    pageSize: 'A4',
  }
}

let _pdfMakeInstance: any = null

async function getPdfMake() {
  if (_pdfMakeInstance) return _pdfMakeInstance
  const pdfMake = (await import('pdfmake/build/pdfmake.js')).default
  const pdfFonts = (await import('pdfmake/build/vfs_fonts.js')).default
  pdfMake.vfs = pdfFonts.vfs ?? (pdfFonts as any).pdfMake?.vfs ?? {}
  pdfMake.fonts = {
    Roboto: {
      normal: 'Roboto-Regular.ttf',
      bold: 'Roboto-Medium.ttf',
      italics: 'Roboto-Italic.ttf',
      bolditalics: 'Roboto-MediumItalic.ttf',
    },
  }
  _pdfMakeInstance = pdfMake
  return pdfMake
}

async function generatePdfBuffer(docDefinition: PdfContent): Promise<Buffer> {
  const pdfMake = await getPdfMake()
  return new Promise((resolve, reject) => {
    try {
      const doc = pdfMake.createPdf(docDefinition as any)
      doc.getBuffer((buffer: Uint8Array) => {
        resolve(Buffer.from(buffer))
      })
    } catch (err) {
      reject(err)
    }
  })
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

    const docDefinition = buildProposalPdfContent(proposal, lineItemsResult.rows)
    const pdf = await generatePdfBuffer(docDefinition)

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

function buildInvoicePdfContent(invoice: Record<string, unknown>, businessName: string, accentColor: string): PdfContent {
  const color = accentColor || '#6366f1'
  const lineItems = (invoice.line_items as { description: string; quantity: number; unitPrice: number }[]) || []
  const subtotal = parseFloat(String(invoice.subtotal || 0))
  const taxRate = parseFloat(String(invoice.tax_rate || 0))
  const taxAmount = parseFloat(String(invoice.tax_amount || 0))
  const total = parseFloat(String(invoice.total || 0))
  const formatCurrency = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''

  const docContent: PdfContent[] = []

  docContent.push({
    canvas: [{ type: 'rect', x: 0, y: 0, w: 515, h: 4, r: 2, color }],
    margin: [0, 0, 0, 16],
  })

  docContent.push({
    columns: [
      {
        stack: [
          { text: businessName || 'ProposalForge', fontSize: 18, bold: true, color: '#111827' },
        ],
      },
      {
        stack: [
          { text: 'INVOICE', fontSize: 24, bold: true, color, alignment: 'right' },
          { text: String(invoice.invoice_number || ''), fontSize: 11, color: '#6b7280', alignment: 'right', margin: [0, 4, 0, 0] },
          { text: `Issued: ${formatDate(invoice.created_at as string)}`, fontSize: 10, color: '#6b7280', alignment: 'right' },
          ...(invoice.due_date ? [{ text: `Due: ${formatDate(invoice.due_date as string)}`, fontSize: 10, color: '#6b7280', alignment: 'right' }] : []),
          { text: String(invoice.status || '').toUpperCase(), fontSize: 10, bold: true, color: invoice.status === 'paid' ? '#16a34a' : '#a16207', alignment: 'right', margin: [0, 4, 0, 0] },
        ],
      },
    ],
    margin: [0, 0, 0, 20],
  })

  docContent.push({
    canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#e5e7eb' }],
    margin: [0, 0, 0, 16],
  })

  docContent.push({
    stack: [
      { text: 'BILL TO', fontSize: 9, bold: true, color: '#9ca3af', margin: [0, 0, 0, 4] },
      { text: String(invoice.client_name || 'Client'), fontSize: 11, bold: true, color: '#111827' },
      ...(invoice.client_email ? [{ text: String(invoice.client_email), fontSize: 10, color: '#6b7280' }] : []),
    ],
    margin: [0, 0, 0, 20],
  })

  if (lineItems.length > 0) {
    const tableBody: PdfContent[][] = [
      [
        { text: 'Description', bold: true, fontSize: 10, color: '#6b7280', fillColor: '#f9fafb' },
        { text: 'Qty', bold: true, fontSize: 10, color: '#6b7280', fillColor: '#f9fafb', alignment: 'right' },
        { text: 'Unit Price', bold: true, fontSize: 10, color: '#6b7280', fillColor: '#f9fafb', alignment: 'right' },
        { text: 'Total', bold: true, fontSize: 10, color: '#6b7280', fillColor: '#f9fafb', alignment: 'right' },
      ],
      ...lineItems.map(item => [
        { text: item.description, fontSize: 10, color: '#374151' },
        { text: String(item.quantity), fontSize: 10, color: '#374151', alignment: 'right' },
        { text: formatCurrency(item.unitPrice), fontSize: 10, color: '#374151', alignment: 'right' },
        { text: formatCurrency(item.quantity * item.unitPrice), fontSize: 10, color: '#374151', alignment: 'right' },
      ]),
    ]
    docContent.push({
      table: { headerRows: 1, widths: ['*', 50, 80, 80], body: tableBody },
      layout: {
        hLineWidth: (i: number, node: { table: { body: unknown[] } }) => (i === 0 || i === 1 || i === node.table.body.length) ? 1 : 0.5,
        vLineWidth: () => 0,
        hLineColor: () => '#e5e7eb',
        paddingLeft: () => 8,
        paddingRight: () => 8,
        paddingTop: () => 8,
        paddingBottom: () => 8,
      },
      margin: [0, 0, 0, 16],
    } as PdfContent)
  }

  const totalsStack: PdfContent[] = [
    { columns: [{ text: 'Subtotal', fontSize: 10, color: '#374151' }, { text: formatCurrency(subtotal), fontSize: 10, color: '#374151', alignment: 'right' }] },
  ]
  if (taxRate > 0) {
    totalsStack.push({ columns: [{ text: `Tax (${taxRate}%)`, fontSize: 10, color: '#374151' }, { text: formatCurrency(taxAmount), fontSize: 10, color: '#374151', alignment: 'right' }] } as PdfContent)
  }
  totalsStack.push({
    canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#e5e7eb' }],
    margin: [0, 6, 0, 6],
  })
  totalsStack.push({ columns: [{ text: 'Total', fontSize: 14, bold: true, color: '#111827' }, { text: formatCurrency(total), fontSize: 14, bold: true, color, alignment: 'right' }] } as PdfContent)

  if (invoice.paid_at) {
    totalsStack.push({ columns: [{ text: '✓ Paid', fontSize: 10, color: '#16a34a', bold: true }, { text: formatDate(invoice.paid_at as string), fontSize: 10, color: '#16a34a', alignment: 'right' }], margin: [0, 4, 0, 0] } as PdfContent)
  }

  docContent.push({ stack: totalsStack, margin: [0, 0, 0, 16] } as PdfContent)

  if (invoice.notes) {
    docContent.push({
      stack: [
        { text: 'Notes', bold: true, fontSize: 10, color: '#374151', margin: [0, 0, 0, 4] },
        { text: String(invoice.notes), fontSize: 10, color: '#6b7280' },
      ],
      background: '#f9fafb',
      margin: [0, 0, 0, 16],
    } as PdfContent)
  }

  docContent.push({
    canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#e5e7eb' }],
    margin: [0, 16, 0, 8],
  })
  docContent.push({ text: `Generated by ProposalForge · ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, fontSize: 9, color: '#9ca3af', alignment: 'center' })

  return {
    content: docContent,
    defaultStyle: { font: 'Roboto', fontSize: 11, color: '#111827' },
    pageMargins: [40, 40, 40, 40],
    pageSize: 'A4',
  }
}

// Download invoice PDF — exported for direct mounting in index.ts
export async function handleInvoicePdf(req: import('express').Request & { userId?: string }, res: import('express').Response) {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  try {
    const { verifyToken } = await import('../middleware/auth.js')
    const payload = verifyToken(token)
    if (!payload?.userId) return res.status(401).json({ error: 'Unauthorized' })

    const invoiceResult = await query(
      'SELECT i.*, u.business_name, u.logo_url, u.accent_color FROM invoices i JOIN users u ON u.id = i.user_id WHERE i.id = $1 AND i.user_id = $2',
      [req.params.id, payload.userId]
    )
    if (invoiceResult.rows.length === 0) return res.status(404).json({ error: 'Invoice not found' })
    const invoice = invoiceResult.rows[0]

    const docDefinition = buildInvoicePdfContent(invoice, invoice.business_name, invoice.accent_color)
    const pdf = await generatePdfBuffer(docDefinition)

    const filename = `invoice-${String(invoice.invoice_number).replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Length', pdf.length)
    res.send(pdf)
  } catch (err) {
    console.error('Invoice PDF error:', err)
    res.status(500).json({ error: 'Failed to generate invoice PDF' })
  }
}

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

    const docDefinition = buildProposalPdfContent(proposal, lineItems)
    const pdf = await generatePdfBuffer(docDefinition)

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
