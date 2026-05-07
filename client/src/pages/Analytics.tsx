import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import { Loader2, TrendingUp, DollarSign, FileText, Users } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface ChartPoint {
  month: string
  revenue: number
  proposals: number
  accepted: number
}

interface TopClient {
  name: string
  proposals: number
  totalValue: number
}

interface Stats {
  monthlyRevenue: number
  outstandingInvoices: number
  totalClients: number
  acceptanceRate: number
  proposals: Record<string, number>
  totalProposals: number
}

const PIE_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444']

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border rounded-xl shadow-lg px-4 py-3">
        <p className="text-xs font-semibold text-slate-500 mb-2">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} className="text-sm font-semibold" style={{ color: p.color }}>
            {p.name === 'revenue' ? formatCurrency(p.value) : p.value} {p.name !== 'revenue' && p.name}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function Analytics() {
  const { user } = useAuth()
  const [chartData, setChartData] = useState<ChartPoint[]>([])
  const [topClients, setTopClients] = useState<TopClient[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get<{ chartData: ChartPoint[]; topClients: TopClient[] }>('/dashboard/analytics'),
      api.get<{ stats: Stats }>('/dashboard/stats'),
    ]).then(([a, s]) => {
      setChartData(a.chartData)
      setTopClients(a.topClients)
      setStats(s.stats)
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const proposalPieData = stats ? [
    { name: 'Draft', value: stats.proposals?.draft || 0 },
    { name: 'Sent', value: stats.proposals?.sent || 0 },
    { name: 'Viewed', value: stats.proposals?.viewed || 0 },
    { name: 'Accepted', value: stats.proposals?.accepted || 0 },
    { name: 'Declined', value: stats.proposals?.declined || 0 },
  ].filter(d => d.value > 0) : []

  const totalRevenue = chartData.reduce((sum, d) => sum + d.revenue, 0)
  const totalProposalsSent = chartData.reduce((sum, d) => sum + d.proposals, 0)
  const avgMonthlyRevenue = chartData.length > 0 ? totalRevenue / chartData.filter(d => d.revenue > 0).length || 0 : 0

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
          Analytics
        </h1>
        <p className="text-muted-foreground mt-1">Track your business performance over time.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Revenue (6mo)',
            value: formatCurrency(totalRevenue),
            icon: DollarSign,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            sub: `Avg ${formatCurrency(isNaN(avgMonthlyRevenue) ? 0 : avgMonthlyRevenue)}/month`,
          },
          {
            label: 'Proposals Sent (6mo)',
            value: totalProposalsSent,
            icon: FileText,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            sub: `${chartData.reduce((s, d) => s + d.accepted, 0)} accepted`,
          },
          {
            label: 'Acceptance Rate',
            value: `${stats?.acceptanceRate || 0}%`,
            icon: TrendingUp,
            color: 'text-indigo-600',
            bg: 'bg-indigo-50',
            sub: `${stats?.proposals?.accepted || 0} total accepted`,
          },
          {
            label: 'Active Clients',
            value: stats?.totalClients || 0,
            icon: Users,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
            sub: `${stats?.totalProposals || 0} total proposals`,
          },
        ].map(({ label, value, icon: Icon, color, bg, sub }) => (
          <Card key={label} className="relative overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{label}</p>
                  <p className="text-2xl font-bold tracking-tight">{value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{sub}</p>
                </div>
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${bg}`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Revenue Over Time</CardTitle>
          <p className="text-xs text-muted-foreground">Monthly paid invoice totals for the last 6 months</p>
        </CardHeader>
        <CardContent>
          {chartData.every(d => d.revenue === 0) ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <DollarSign className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No paid invoices yet — revenue will appear here once clients pay.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fill="url(#revenueGrad)"
                  dot={{ fill: '#6366f1', strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, fill: '#6366f1' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Proposals bar chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Proposals Created vs Accepted</CardTitle>
            <p className="text-xs text-muted-foreground">Monthly proposal activity</p>
          </CardHeader>
          <CardContent>
            {chartData.every(d => d.proposals === 0) ? (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <FileText className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No proposals yet — create your first proposal to see data here.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  <Bar dataKey="proposals" name="Created" fill="#e0e7ff" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="accepted" name="Accepted" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Proposal status pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Proposal Status Breakdown</CardTitle>
            <p className="text-xs text-muted-foreground">All-time proposal distribution</p>
          </CardHeader>
          <CardContent>
            {proposalPieData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <FileText className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No proposals yet.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={proposalPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {proposalPieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number, name: string) => [value, name]} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top clients */}
      {topClients.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Top Clients by Proposal Value</CardTitle>
            <p className="text-xs text-muted-foreground">Clients with the highest total proposal amounts</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topClients.map((client, i) => {
                const maxValue = topClients[0]?.totalValue || 1
                const pct = Math.round((client.totalValue / maxValue) * 100)
                return (
                  <div key={client.name} className="flex items-center gap-4">
                    <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center text-xs font-bold text-indigo-600 shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium truncate">{client.name}</p>
                        <div className="flex items-center gap-3 shrink-0 ml-3">
                          <span className="text-xs text-muted-foreground">{client.proposals} proposals</span>
                          <span className="text-sm font-semibold">{formatCurrency(client.totalValue)}</span>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
