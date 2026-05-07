import { useEffect, useRef, useState } from 'react'
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

function useCountUp(target: number, duration = 1400) {
  const [count, setCount] = useState(0)
  const hasRun = useRef(false)
  useEffect(() => {
    if (hasRun.current || target === 0) return
    hasRun.current = true
    let startTime: number | null = null
    const tick = (ts: number) => {
      if (!startTime) startTime = ts
      const progress = Math.min((ts - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(tick)
    }
    const raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return count
}

function AnimatedValue({ value, format }: { value: number | string; format?: (n: number) => string }) {
  const numVal = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.]/g, ''))
  const animated = useCountUp(isNaN(numVal) ? 0 : numVal)
  if (typeof value === 'string' && value.includes('%')) return <>{animated}%</>
  if (format) return <>{format(animated)}</>
  return <>{animated}</>
}

const RevenueTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border rounded-xl shadow-lg px-3 py-2.5 text-xs">
        <p className="font-semibold text-slate-400 mb-1">{label}</p>
        <p className="font-bold text-indigo-600 text-sm">{formatCurrency(payload[0].value)}</p>
      </div>
    )
  }
  return null
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
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
      value: stats?.monthlyRevenue || 0,
      display: formatCurrency(stats?.monthlyRevenue || 0),
      icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      iconBg: 'bg-emerald-500',
      glow: 'shadow-emerald-100',
      sub: 'Paid this month',
    },
    {
      label: 'Outstanding',
      value: stats?.outstandingInvoices || 0,
      display: formatCurrency(stats?.outstandingInvoices || 0),
      icon: Clock,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      border: 'border-orange-100',
      iconBg: 'bg-orange-500',
      glow: 'shadow-orange-100',
      sub: 'Awaiting payment',
    },
    {
      label: 'Acceptance Rate',
      value: stats?.acceptanceRate || 0,
      display: `${stats?.acceptanceRate || 0}%`,
      icon: TrendingUp,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      iconBg: 'bg-blue-500',
      glow: 'shadow-blue-100',
      sub: `${stats?.proposals?.accepted || 0} proposals accepted`,
    },
    {
      label: 'Total Clients',
      value: stats?.totalClients || 0,
      display: String(stats?.totalClients || 0),
      icon: Users,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-100',
      iconBg: 'bg-purple-500',
      glow: 'shadow-purple-100',
      sub: `${stats?.totalProposals || 0} total proposals`,
    },
  ]

  const hasRevenueData = chartData.some(d => d.revenue > 0)
  const hasActivity = activity.length > 0

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
            {getGreeting()}{user?.business_name ? `, ${user.business_name}` : ''}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Here's what's happening with your business.</p>
        </div>
        <Link href="/proposals/new">
          <Button data-testid="button-new-proposal" className="gap-2 shrink-0 shadow-md shadow-primary/20">
            <Plus className="h-4 w-4" />
            New Proposal
          </Button>
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map(({ label, value, display, icon: Icon, color, bg, border, iconBg, glow, sub }) => (
          <Card
            key={label}
            className={`relative overflow-hidden stat-card-glow border ${border} hover:shadow-lg ${glow}`}
            data-testid={`stat-${label.toLowerCase().replace(' ', '-')}`}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">{label}</p>
                  <p className="text-2xl font-bold tracking-tight tabular-nums">
                    {value > 0 ? (
                      display.startsWith('$')
                        ? <><span className="text-base font-semibold text-muted-foreground mr-0.5">$</span><AnimatedValue value={value} format={(n) => n.toLocaleString()} /></>
                        : display.endsWith('%')
                          ? <AnimatedValue value={value} />
                          : <AnimatedValue value={value} />
                    ) : display}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1.5">{sub}</p>
                </div>
                <div className={cn(`h-11 w-11 rounded-xl ${iconBg} flex items-center justify-center shadow-md shrink-0`)}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue chart */}
      <Card className="border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base font-semibold">Revenue Trend</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Monthly paid invoices — last 6 months</p>
          </div>
          <Link href="/analytics" className="text-xs text-primary hover:underline flex items-center gap-1 font-medium">
            <BarChart3 className="h-3.5 w-3.5" />
            Full analytics
          </Link>
        </CardHeader>
        <CardContent>
          {!hasRevenueData ? (
            <div className="flex flex-col items-center justify-center h-40 text-center border-2 border-dashed rounded-xl">
              <DollarSign className="h-8 w-8 text-muted-foreground/20 mb-2" />
              <p className="text-sm text-muted-foreground font-medium">Revenue appears here once invoices are paid</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Create and send your first proposal to get started</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="dashRevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
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
                  strokeWidth={2.5}
                  fill="url(#dashRevGrad)"
                  dot={{ fill: '#6366f1', strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2 border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
            <Link href="/proposals" className="text-xs text-primary hover:underline flex items-center gap-1 font-medium">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {!hasActivity ? (
              <div className="py-12 text-center border-2 border-dashed rounded-xl">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-7 w-7 text-primary/60" />
                </div>
                <p className="text-sm font-semibold text-slate-700 mb-1">No activity yet</p>
                <p className="text-xs text-muted-foreground mb-5">Create your first AI-powered proposal and win more clients.</p>
                <Link href="/proposals/new">
                  <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" /> New Proposal
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-1">
                {activity.map((item, i) => (
                  <Link
                    key={i}
                    href={`/${item.type}s/${item.id}`}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'h-9 w-9 rounded-xl flex items-center justify-center shadow-sm',
                        item.type === 'proposal' ? 'bg-blue-50' : 'bg-emerald-50'
                      )}>
                        {item.type === 'proposal'
                          ? <FileText className="h-4 w-4 text-blue-600" />
                          : <Receipt className="h-4 w-4 text-emerald-600" />
                        }
                      </div>
                      <div>
                        <p className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-1">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(item.date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium capitalize', getStatusColor(item.status))}>
                        {item.status}
                      </span>
                      <span className="text-sm font-bold tabular-nums">{formatCurrency(item.amount || 0)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick actions + Pipeline */}
        <div className="space-y-4">
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {[
                { href: '/proposals/new', icon: Sparkles, label: 'New Proposal', desc: 'AI-powered in 60s', color: 'bg-indigo-500' },
                { href: '/invoices', icon: Receipt, label: 'New Invoice', desc: 'Manual invoice', color: 'bg-emerald-500' },
                { href: '/clients', icon: Users, label: 'Add Client', desc: 'Save client info', color: 'bg-purple-500' },
                { href: '/analytics', icon: BarChart3, label: 'View Analytics', desc: 'Revenue & trends', color: 'bg-blue-500' },
              ].map(({ href, icon: Icon, label, desc, color }) => (
                <Link
                  key={href}
                  href={href}
                  data-testid={`quick-action-${label.toLowerCase().replace(' ', '-')}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-all duration-200 group border border-transparent hover:border-border hover:shadow-sm"
                >
                  <div className={`h-9 w-9 rounded-xl ${color} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform shrink-0`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold leading-none mb-0.5">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Proposal status breakdown */}
          {stats && stats.totalProposals > 0 && (
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Proposal Pipeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: 'Draft', key: 'draft', color: 'bg-slate-400' },
                  { label: 'Sent', key: 'sent', color: 'bg-blue-500' },
                  { label: 'Viewed', key: 'viewed', color: 'bg-purple-500' },
                  { label: 'Accepted', key: 'accepted', color: 'bg-emerald-500' },
                  { label: 'Declined', key: 'declined', color: 'bg-red-400' },
                ].filter(s => (stats?.proposals?.[s.key] || 0) > 0).map(({ label, key, color }) => {
                  const count = stats?.proposals?.[key] || 0
                  const pct = stats.totalProposals > 0 ? Math.round((count / stats.totalProposals) * 100) : 0
                  return (
                    <div key={key}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-muted-foreground font-medium">{label}</span>
                        <span className="font-bold tabular-nums">{count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn('h-full rounded-full transition-all duration-1000', color)}
                          style={{ width: `${pct}%` }}
                        />
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
