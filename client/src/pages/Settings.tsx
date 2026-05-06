import { useEffect, useState } from 'react'
import { useSearch } from 'wouter'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Save, Crown, CheckCircle, ExternalLink, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Subscription {
  plan: string
  proposalsThisMonth: number
  proposalLimit: number | null
  subscription: Record<string, unknown> | null
}

export function Settings() {
  const { user, refreshUser } = useAuth()
  const search = useSearch()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [upgrading, setUpgrading] = useState(false)
  const [sub, setSub] = useState<Subscription | null>(null)
  const [form, setForm] = useState({
    businessName: user?.business_name || '',
    accentColor: user?.accent_color || '#6366f1',
    defaultCurrency: user?.default_currency || 'USD',
  })

  useEffect(() => {
    api.get<Subscription>('/subscription').then(setSub).catch(console.error)
    const params = new URLSearchParams(search)
    if (params.get('upgraded') === 'true') {
      toast({ title: 'Upgraded to Pro!', description: 'Welcome to ProposalForge Pro. Enjoy unlimited proposals.' })
      refreshUser()
    }
  }, [])

  async function saveProfile() {
    setSaving(true)
    try {
      await api.put('/auth/me', form)
      await refreshUser()
      toast({ title: 'Profile updated' })
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  async function upgrade(interval: 'month' | 'year') {
    setUpgrading(true)
    try {
      const data = await api.post<{ url: string }>('/subscription/checkout', { interval })
      if (data.url) window.location.href = data.url
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
      setUpgrading(false)
    }
  }

  async function openPortal() {
    try {
      const data = await api.post<{ url: string }>('/subscription/portal')
      if (data.url) window.open(data.url, '_blank')
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>Settings</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Manage your account and billing preferences.</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Business Profile</CardTitle>
              <CardDescription>This information appears on your proposals and invoices.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user?.email || ''} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Business Name</Label>
                <Input
                  placeholder="Acme Studio"
                  value={form.businessName}
                  onChange={e => setForm(f => ({ ...f, businessName: e.target.value }))}
                  data-testid="input-business-name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Accent Color</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={form.accentColor}
                      onChange={e => setForm(f => ({ ...f, accentColor: e.target.value }))}
                      className="h-9 w-16 rounded border cursor-pointer"
                      data-testid="input-accent-color"
                    />
                    <Input
                      value={form.accentColor}
                      onChange={e => setForm(f => ({ ...f, accentColor: e.target.value }))}
                      placeholder="#6366f1"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Default Currency</Label>
                  <Input
                    placeholder="USD"
                    value={form.defaultCurrency}
                    onChange={e => setForm(f => ({ ...f, defaultCurrency: e.target.value }))}
                    data-testid="input-currency"
                  />
                </div>
              </div>
              <Button onClick={saveProfile} disabled={saving} className="gap-2" data-testid="button-save-profile">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Profile
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="mt-4 space-y-4">
          {/* Current plan */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Current Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'h-10 w-10 rounded-xl flex items-center justify-center',
                    user?.plan === 'pro' ? 'bg-amber-100 dark:bg-amber-900/20' : 'bg-muted'
                  )}>
                    {user?.plan === 'pro'
                      ? <Crown className="h-5 w-5 text-amber-600" />
                      : <Sparkles className="h-5 w-5 text-muted-foreground" />
                    }
                  </div>
                  <div>
                    <p className="font-semibold capitalize">{user?.plan || 'Free'} Plan</p>
                    <p className="text-sm text-muted-foreground">
                      {user?.plan === 'pro'
                        ? 'Unlimited proposals, no branding'
                        : `${sub?.proposalsThisMonth || 0} / 3 proposals used this month`
                      }
                    </p>
                  </div>
                </div>
                {user?.plan === 'pro' && (
                  <Button variant="outline" onClick={openPortal} className="gap-2">
                    <ExternalLink className="h-4 w-4" /> Manage Billing
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Upgrade cards */}
          {user?.plan !== 'pro' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Monthly', price: '$19/month', interval: 'month' as const, desc: 'Billed monthly, cancel anytime' },
                { label: 'Annual', price: '$190/year', interval: 'year' as const, desc: 'Save $38 vs monthly', highlight: true },
              ].map(plan => (
                <Card key={plan.interval} className={cn('relative', plan.highlight && 'border-primary ring-1 ring-primary')}>
                  {plan.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">Best Value</span>
                    </div>
                  )}
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Crown className="h-4 w-4 text-amber-500" />
                      <span className="font-semibold">Pro {plan.label}</span>
                    </div>
                    <p className="text-2xl font-bold mb-1">{plan.price}</p>
                    <p className="text-xs text-muted-foreground mb-4">{plan.desc}</p>
                    <ul className="space-y-1.5 mb-5">
                      {[
                        'Unlimited proposals',
                        'Remove ProposalForge branding',
                        'Priority support',
                        'All future features',
                      ].map(f => (
                        <li key={f} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Button
                      onClick={() => upgrade(plan.interval)}
                      disabled={upgrading}
                      className="w-full gap-2"
                      variant={plan.highlight ? 'default' : 'outline'}
                      data-testid={`button-upgrade-${plan.interval}`}
                    >
                      {upgrading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />}
                      Upgrade to Pro
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
