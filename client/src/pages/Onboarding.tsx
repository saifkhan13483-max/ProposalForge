import { useState } from 'react'
import { useLocation } from 'wouter'
import { useAuth } from '@/contexts/AuthContext'
import { useSEO } from '@/hooks/useSEO'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { Sparkles, Loader2, ArrowRight, Building2, Palette, Globe, Upload, X } from 'lucide-react'

const CURRENCIES = [
  { code: 'USD', label: 'US Dollar (USD)' },
  { code: 'EUR', label: 'Euro (EUR)' },
  { code: 'GBP', label: 'British Pound (GBP)' },
  { code: 'CAD', label: 'Canadian Dollar (CAD)' },
  { code: 'AUD', label: 'Australian Dollar (AUD)' },
  { code: 'NZD', label: 'New Zealand Dollar (NZD)' },
  { code: 'CHF', label: 'Swiss Franc (CHF)' },
  { code: 'SGD', label: 'Singapore Dollar (SGD)' },
  { code: 'INR', label: 'Indian Rupee (INR)' },
  { code: 'BRL', label: 'Brazilian Real (BRL)' },
]

const STEPS = [
  { id: 1, label: 'Business', icon: Building2 },
  { id: 2, label: 'Branding', icon: Palette },
  { id: 3, label: 'Currency', icon: Globe },
]

export function Onboarding() {
  const [step, setStep] = useState(1)
  const [businessName, setBusinessName] = useState('')
  const [accentColor, setAccentColor] = useState('#6366f1')
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [currency, setCurrency] = useState('USD')

  useSEO({ title: 'Set Up Your Account', noindex: true })
  const [saving, setSaving] = useState(false)
  const { refreshUser } = useAuth()
  const [, setLocation] = useLocation()
  const { toast } = useToast()

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Logo too large', description: 'Max 5 MB', variant: 'destructive' })
      return
    }
    setLogoFile(file)
    const reader = new FileReader()
    reader.onload = ev => setLogoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function finish() {
    setSaving(true)
    try {
      await api.put('/auth/me', {
        businessName: businessName || undefined,
        accentColor,
        defaultCurrency: currency,
      })

      if (logoFile) {
        const formData = new FormData()
        formData.append('logo', logoFile)
        const { getFirebaseIdToken } = await import('@/lib/firebase')
        const idToken = await getFirebaseIdToken()
        await fetch('/api/auth/upload-logo', {
          method: 'POST',
          headers: idToken ? { Authorization: `Bearer ${idToken}` } : {},
          body: formData,
        })
      }

      await api.post('/auth/complete-onboarding', {})
      await refreshUser()
      setLocation('/dashboard')
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-center gap-2 mb-10">
          <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-white font-bold text-xl" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
            ProposalForge
          </span>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                step === s.id
                  ? 'bg-indigo-600 text-white'
                  : step > s.id
                  ? 'bg-indigo-900/60 text-indigo-300'
                  : 'bg-white/10 text-white/40'
              }`}>
                <s.icon className="h-3.5 w-3.5" />
                {s.label}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-px ${step > s.id ? 'bg-indigo-500' : 'bg-white/20'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
                  What's your business name?
                </h2>
                <p className="text-muted-foreground text-sm">This appears on all your proposals and invoices.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="biz-name">Business name</Label>
                <Input
                  id="biz-name"
                  placeholder="Acme Studio"
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  className="h-11"
                  autoFocus
                />
              </div>
              <Button
                className="w-full h-11 gap-2"
                onClick={() => setStep(2)}
              >
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
              <button
                onClick={() => setStep(2)}
                className="w-full text-sm text-muted-foreground hover:text-foreground text-center"
              >
                Skip for now
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
                  Brand your proposals
                </h2>
                <p className="text-muted-foreground text-sm">Add a logo and pick an accent color for client-facing pages.</p>
              </div>

              <div className="space-y-2">
                <Label>Logo (optional)</Label>
                {logoPreview ? (
                  <div className="flex items-center gap-3">
                    <img src={logoPreview} alt="Logo preview" className="h-14 w-auto max-w-[140px] object-contain rounded-lg border" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setLogoPreview(null); setLogoFile(null) }}
                      className="gap-1 text-muted-foreground"
                    >
                      <X className="h-3.5 w-3.5" /> Remove
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl cursor-pointer hover:bg-muted/30 transition-colors">
                    <Upload className="h-5 w-5 text-muted-foreground mb-1" />
                    <span className="text-sm text-muted-foreground">Click to upload · PNG, JPG, SVG · Max 5 MB</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                  </label>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="accent">Accent color</Label>
                <div className="flex items-center gap-3">
                  <input
                    id="accent"
                    type="color"
                    value={accentColor}
                    onChange={e => setAccentColor(e.target.value)}
                    className="h-10 w-16 rounded-lg border cursor-pointer p-1"
                  />
                  <div
                    className="flex-1 h-10 rounded-lg border flex items-center px-3 text-sm font-mono text-muted-foreground"
                    style={{ backgroundColor: accentColor + '18' }}
                  >
                    {accentColor}
                  </div>
                  <div className="flex gap-1.5">
                    {['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'].map(c => (
                      <button
                        key={c}
                        onClick={() => setAccentColor(c)}
                        className="h-6 w-6 rounded-full border-2 transition-transform hover:scale-110"
                        style={{ backgroundColor: c, borderColor: accentColor === c ? c : 'transparent' }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
                <Button className="flex-1 gap-2" onClick={() => setStep(3)}>
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
                  Default currency
                </h2>
                <p className="text-muted-foreground text-sm">Used for all quotes and invoices. You can change this later.</p>
              </div>

              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map(c => (
                      <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>Back</Button>
                <Button className="flex-1 gap-2" onClick={finish} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Finish setup <ArrowRight className="h-4 w-4" /></>}
                </Button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-white/30 text-sm mt-6">You can update all of this later in Settings.</p>
      </div>
    </div>
  )
}
