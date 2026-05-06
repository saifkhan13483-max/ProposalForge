import { useEffect, useState, useRef } from 'react'
import { useSearch } from 'wouter'
import { useAuth } from '@/contexts/AuthContext'
import { api, getAuthToken } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Save, Crown, CheckCircle, ExternalLink, Sparkles, Upload, X } from 'lucide-react'
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
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [sub, setSub] = useState<Subscription | null>(null)
  const [form, setForm] = useState({
    businessName: user?.business_name || '',
    accentColor: user?.accent_color || '#6366f1',
    defaultCurrency: user?.default_currency || 'USD',
    invoicePrefix: user?.invoice_prefix || 'INV',
    fontFamily: user?.font_family || 'inter',
  })
  const logoInputRef = useRef<HTMLInputElement>(null)

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
      await api.put('/auth/me', {
        businessName: form.businessName,
        accentColor: form.accentColor,
        defaultCurrency: form.defaultCurrency,
        invoicePrefix: form.invoicePrefix,
        fontFamily: form.fontFamily,
      })
      await refreshUser()
      toast({ title: 'Profile updated' })
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  async function uploadLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingLogo(true)
    try {
      const formData = new FormData()
      formData.append('logo', file)
      const token = getAuthToken()
      const res = await fetch('/api/auth/upload-logo', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Upload failed')
      }
      await refreshUser()
      toast({ title: 'Logo uploaded' })
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setUploadingLogo(false)
      if (logoInputRef.current) logoInputRef.current.value = ''
    }
  }

  async function removeLogo() {
    try {
      await api.delete('/auth/logo')
      await refreshUser()
      toast({ title: 'Logo removed' })
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
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
              {/* Logo upload */}
              <div className="space-y-2">
                <Label>Business Logo</Label>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden bg-muted/50 shrink-0">
                    {user?.logo_url ? (
                      <img src={user.logo_url} alt="Logo" className="h-full w-full object-contain p-1" />
                    ) : (
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={uploadLogo}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={uploadingLogo}
                      className="gap-2"
                    >
                      {uploadingLogo ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                      {user?.logo_url ? 'Replace logo' : 'Upload logo'}
                    </Button>
                    {user?.logo_url && (
                      <Button variant="ghost" size="sm" onClick={removeLogo} className="gap-2 text-destructive hover:text-destructive">
                        <X className="h-3.5 w-3.5" /> Remove
                      </Button>
                    )}
                    <p className="text-xs text-muted-foreground">PNG, JPG up to 5 MB</p>
                  </div>
                </div>
              </div>

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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Proposal Font</Label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { value: 'inter', label: 'Inter', style: 'font-sans', preview: 'Modern & clean' },
                      { value: 'bricolage', label: 'Bricolage Grotesque', style: '', preview: 'Bold & expressive' },
                      { value: 'georgia', label: 'Georgia', style: 'font-serif', preview: 'Classic & professional' },
                    ].map(font => (
                      <button
                        key={font.value}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, fontFamily: font.value }))}
                        className={cn(
                          'flex items-center justify-between p-3 rounded-lg border text-left transition-all',
                          form.fontFamily === font.value
                            ? 'border-primary bg-primary/5 ring-1 ring-primary'
                            : 'hover:border-border hover:bg-muted/50'
                        )}
                        data-testid={`font-${font.value}`}
                      >
                        <div>
                          <p className={cn('text-sm font-medium', font.style)} style={font.value === 'bricolage' ? { fontFamily: 'Bricolage Grotesque, sans-serif' } : {}}>
                            {font.label}
                          </p>
                          <p className="text-xs text-muted-foreground">{font.preview}</p>
                        </div>
                        {form.fontFamily === font.value && (
                          <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Invoice Number Prefix</Label>
                  <Input
                    placeholder="INV"
                    value={form.invoicePrefix}
                    onChange={e => setForm(f => ({ ...f, invoicePrefix: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') }))}
                    maxLength={8}
                    data-testid="input-invoice-prefix"
                  />
                  <p className="text-xs text-muted-foreground">
                    Your invoices will be numbered: <span className="font-medium">{form.invoicePrefix || 'INV'}-0001</span>
                  </p>
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
