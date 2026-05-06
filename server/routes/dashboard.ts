import { Router } from 'express'
import { query } from '../db.js'
import { requireAuth, type AuthRequest } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

// Dashboard stats
router.get('/stats', async (req: AuthRequest, res) => {
  try {
    const [proposals, invoices, revenue, outstanding, clients, acceptance] = await Promise.all([
      // Total proposals by status
      query(
        `SELECT status, COUNT(*) as count FROM proposals WHERE user_id = $1 GROUP BY status`,
        [req.userId]
      ),
      // Invoice stats
      query(
        `SELECT status, COUNT(*) as count, SUM(total) as total FROM invoices WHERE user_id = $1 GROUP BY status`,
        [req.userId]
      ),
      // Monthly revenue (paid invoices this month)
      query(
        `SELECT COALESCE(SUM(total), 0) as amount FROM invoices 
         WHERE user_id = $1 AND status = 'paid' 
         AND EXTRACT(MONTH FROM paid_at) = EXTRACT(MONTH FROM NOW())
         AND EXTRACT(YEAR FROM paid_at) = EXTRACT(YEAR FROM NOW())`,
        [req.userId]
      ),
      // Outstanding invoices
      query(
        `SELECT COALESCE(SUM(total), 0) as amount FROM invoices WHERE user_id = $1 AND status IN ('sent', 'overdue')`,
        [req.userId]
      ),
      // Total clients
      query(`SELECT COUNT(*) as count FROM clients WHERE user_id = $1`, [req.userId]),
      // Acceptance rate
      query(
        `SELECT 
          COUNT(*) FILTER (WHERE status = 'accepted') as accepted,
          COUNT(*) FILTER (WHERE status IN ('sent', 'viewed', 'accepted', 'declined')) as sent
         FROM proposals WHERE user_id = $1`,
        [req.userId]
      ),
    ])

    const proposalsByStatus: Record<string, number> = {}
    for (const row of proposals.rows) {
      proposalsByStatus[row.status] = parseInt(row.count)
    }

    const invoicesByStatus: Record<string, { count: number; total: number }> = {}
    for (const row of invoices.rows) {
      invoicesByStatus[row.status] = { count: parseInt(row.count), total: parseFloat(row.total || 0) }
    }

    const acceptedCount = parseInt(acceptance.rows[0]?.accepted || 0)
    const sentCount = parseInt(acceptance.rows[0]?.sent || 0)
    const acceptanceRate = sentCount > 0 ? Math.round((acceptedCount / sentCount) * 100) : 0

    res.json({
      stats: {
        monthlyRevenue: parseFloat(revenue.rows[0]?.amount || 0),
        outstandingInvoices: parseFloat(outstanding.rows[0]?.amount || 0),
        totalClients: parseInt(clients.rows[0]?.count || 0),
        acceptanceRate,
        proposals: proposalsByStatus,
        invoices: invoicesByStatus,
        totalProposals: Object.values(proposalsByStatus).reduce((a, b) => a + b, 0),
        totalInvoices: Object.values(invoicesByStatus).reduce((a, b) => a + b.count, 0),
      },
    })
  } catch (err) {
    console.error('Dashboard stats error:', err)
    res.status(500).json({ error: 'Failed to get stats' })
  }
})

// Recent activity
router.get('/activity', async (req: AuthRequest, res) => {
  try {
    const [recentProposals, recentInvoices] = await Promise.all([
      query(
        `SELECT id, title, status, client_name, total_amount, created_at, sent_at, accepted_at
         FROM proposals WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 5`,
        [req.userId]
      ),
      query(
        `SELECT id, invoice_number, status, client_name, total, created_at, paid_at
         FROM invoices WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 5`,
        [req.userId]
      ),
    ])

    const activity = [
      ...recentProposals.rows.map(p => ({
        type: 'proposal',
        id: p.id,
        title: p.title || `Proposal for ${p.client_name}`,
        status: p.status,
        amount: p.total_amount,
        date: p.sent_at || p.created_at,
      })),
      ...recentInvoices.rows.map(i => ({
        type: 'invoice',
        id: i.id,
        title: `Invoice ${i.invoice_number}`,
        status: i.status,
        amount: i.total,
        date: i.paid_at || i.created_at,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8)

    res.json({ activity })
  } catch (err) {
    console.error('Dashboard activity error:', err)
    res.status(500).json({ error: 'Failed to get activity' })
  }
})

export default router
