import { useEffect, useState } from 'react'
import { Link } from 'wouter'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DollarSign, FileText, TrendingUp, Users, Plus, ArrowRight,
  Loader2, Sparkles, Receipt, Clock, BarChart3
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

interface Stats {
  monthlyRevenue: number
  outstandingInvoices: number
  totalClients: number
  acceptanceRate: number
  proposals: Record<string, number>
  invoices: Record<string, { count: number; total: number }>
  totalProposals: number
  totalInvoices: number
}

interface ActivityItem {
  type: string
  id: string
  title: string
  status: string
  amount: number
  date: string
}

interface ChartPoint {
  month: string
  revenue: number
}

const RevenueTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border rounded-lg shadow-md px-3 py-2 text-xs">
        <p className="font-semibold text-slate-500 mb-1">{label}</p>
        <p className="font-bold text-indigo-600">{formatCurrency(payload[0].value)}</p>
      </div>
    )
  }
  return null
}

export function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [chartData, setChartData] = useState<ChartPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get<{ stats: Stats }>('/dashboard/stats'),
      api.get<{ activity: ActivityItem[] }>('/dashboard/activity'),
      api.get<{ chartData: ChartPoint[] }>('/dashboard/analytics'),
    ]).then(([s, a, an]) => {
      setStats(s.stats)
      setActivity(a.activity)
      setChartData(an.chartData)
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const statCards = [
    {
      label: 'Monthly Revenue',
      value: formatCurrency(stats?.monthlyRevenue || 0),
      icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      sub: 'Paid this month',
    },
    {
      label: 'Outstanding',
      value: formatCurrency(stats?.outstandingInvoices || 0),
      icon: Clock,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      sub: 'Awaiting payment',
    },
    {
      label: 'Acceptance Rate',
      value: `${stats?.acceptanceRate || 0}%`,
      icon: TrendingUp,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      sub: `${stats?.proposals?.accepted || 0} proposals accepted`,
    },
    {
      label: 'Total Clients',
      value: stats?.totalClients || 0,
      icon: Users,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      sub: `${stats?.totalProposals || 0} total proposals`,
    },
  ]

  const hasRevenueData = chartData.some(d => d.revenue > 0)

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
            {(() => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening' })()}{user?.business_name ? `, ${user.business_name}` : ''}
          </h1>
          <p className="text-muted-foreground mt-1">Here's what's happening with your business.</p>
        </div>
        <Link href="/proposals/new">
          <Button data-testid="button-new-proposal" className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            New Proposal
          </Button>
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg, sub }) => (
          <Card key={label} className="relative overflow-hidden" data-testid={`stat-${label.toLowerCase().replace(' ', '-')}`}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{label}</p>
                  <p className="text-2xl font-bold tracking-tight">{value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{sub}</p>
                </div>
                <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center', bg)}>
                  <Icon className={cn('h-5 w-5', color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base font-semibold">Revenue Trend</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Monthly paid invoices — last 6 months</p>
          </div>
          <Link href="/analytics" className="text-xs text-primary hover:underline flex items-center gap-1">
            <BarChart3 className="h-3.5 w-3.5" />
            Full analytics
          </Link>
        </CardHeader>
        <CardContent>
          {!hasRevenueData ? (
            <div className="flex flex-col items-center justify-center h-36 text-center">
              <DollarSign className="h-7 w-7 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">Revenue will appear here once invoices are paid.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="dashRevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                  width={40}
                />
                <Tooltip content={<RevenueTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#dashRevGrad)"
                  dot={{ fill: '#6366f1', strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5, fill: '#6366f1' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
            <Link href="/proposals" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {activity.length === 0 ? (
              <div className="py-10 text-center">
                <Sparkles className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="text-sm text-muted-foreground">No activity yet — create your first proposal!</p>
                <Link href="/proposals/new">
                  <Button size="sm" className="mt-4" variant="outline">
                    <Plus className="h-4 w-4 mr-2" /> New Proposal
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {activity.map((item, i) => (
                  <Link
                    key={i}
                    href={`/${item.type}s/${item.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'h-8 w-8 rounded-lg flex items-center justify-center',
                        item.type === 'proposal' ? 'bg-blue-50' : 'bg-green-50'
                      )}>
                        {item.type === 'proposal'
                          ? <FileText className="h-4 w-4 text-blue-600" />
                          : <Receipt className="h-4 w-4 text-green-600" />
                        }
                      </div>
                      <div>
                        <p className="text-sm font-medium group-hover:text-primary transition-colors">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(item.date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium capitalize', getStatusColor(item.status))}>
                        {item.status}
                      </span>
                      <span className="text-sm font-semibold">{formatCurrency(item.amount || 0)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick actions + Pipeline */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { href: '/proposals/new', icon: FileText, label: 'New Proposal', desc: 'AI-powered in 60s' },
                { href: '/invoices', icon: Receipt, label: 'New Invoice', desc: 'Manual invoice' },
                { href: '/clients', icon: Users, label: 'Add Client', desc: 'Save client info' },
                { href: '/analytics', icon: BarChart3, label: 'View Analytics', desc: 'Revenue & trends' },
              ].map(({ href, icon: Icon, label, desc }) => (
                <Link
                  key={href}
                  href={href}
                  data-testid={`quick-action-${label.toLowerCase().replace(' ', '-')}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group border border-transparent hover:border-border"
                >
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Proposal status breakdown */}
          {stats && stats.totalProposals > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Proposal Pipeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {[
                  { label: 'Draft', key: 'draft', color: 'bg-gray-400' },
                  { label: 'Sent', key: 'sent', color: 'bg-blue-500' },
                  { label: 'Viewed', key: 'viewed', color: 'bg-purple-500' },
                  { label: 'Accepted', key: 'accepted', color: 'bg-green-500' },
                  { label: 'Declined', key: 'declined', color: 'bg-red-500' },
                ].filter(s => (stats?.proposals?.[s.key] || 0) > 0).map(({ label, key, color }) => {
                  const count = stats?.proposals?.[key] || 0
                  const pct = stats.totalProposals > 0 ? Math.round((count / stats.totalProposals) * 100) : 0
                  return (
                    <div key={key}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className={cn('h-full rounded-full', color)} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
