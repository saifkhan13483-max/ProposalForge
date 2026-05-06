import { useEffect, useState } from 'react'
import { Link } from 'wouter'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DollarSign, FileText, TrendingUp, Users, Plus, ArrowRight,
  Loader2, Sparkles, Receipt, Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'

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

export function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get<{ stats: Stats }>('/dashboard/stats'),
      api.get<{ activity: ActivityItem[] }>('/dashboard/activity'),
    ]).then(([s, a]) => {
      setStats(s.stats)
      setActivity(a.activity)
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
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      sub: 'Paid this month',
    },
    {
      label: 'Outstanding',
      value: formatCurrency(stats?.outstandingInvoices || 0),
      icon: Clock,
      color: 'text-orange-600',
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      sub: 'Awaiting payment',
    },
    {
      label: 'Acceptance Rate',
      value: `${stats?.acceptanceRate || 0}%`,
      icon: TrendingUp,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      sub: `${stats?.proposals?.accepted || 0} proposals accepted`,
    },
    {
      label: 'Total Clients',
      value: stats?.totalClients || 0,
      icon: Users,
      color: 'text-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      sub: `${stats?.totalProposals || 0} total proposals`,
    },
  ]

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
            <Link href="/proposals">
              <a className="text-xs text-primary hover:underline flex items-center gap-1">View all <ArrowRight className="h-3 w-3" /></a>
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
                  <Link key={i} href={`/${item.type}s/${item.id}`}>
                    <a className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'h-8 w-8 rounded-lg flex items-center justify-center',
                          item.type === 'proposal' ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-green-50 dark:bg-green-900/20'
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
                    </a>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick actions */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { href: '/proposals/new', icon: FileText, label: 'New Proposal', desc: 'AI-powered in 60s' },
                { href: '/invoices/new', icon: Receipt, label: 'New Invoice', desc: 'Manual invoice' },
                { href: '/clients/new', icon: Users, label: 'Add Client', desc: 'Save client info' },
              ].map(({ href, icon: Icon, label, desc }) => (
                <Link key={href} href={href}>
                  <a
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
                  </a>
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
