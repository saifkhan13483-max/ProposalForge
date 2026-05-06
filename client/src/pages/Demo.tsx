import { useState } from 'react'
import { Link } from 'wouter'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sparkles, Loader2, ArrowRight, CheckCircle, FileText, ChevronRight } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface DemoProposal {
  executiveSummary: string
  scopeOfWork: string
  deliverables: string[]
  timeline: string
  lineItems: { description: string; quantity: number; unitPrice: number }[]
  totalEstimate: number
  terms: string
}

const PROJECT_TYPES = [
  { value: 'web_development', label: 'Web Development' },
  { value: 'design', label: 'Design' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'other', label: 'Other' },
]

export function Demo() {
  const [projectDescription, setProjectDescription] = useState('')
  const [clientName, setClientName] = useState('')
  const [projectType, setProjectType] = useState('web_development')
  const [budget, setBudget] = useState('')
  const [timeline, setTimeline] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<DemoProposal | null>(null)
  const [limitReached, setLimitReached] = useState(false)
  const { toast } = useToast()

  async function generate() {
    if (!projectDescription.trim()) {
      toast({ title: 'Required', description: 'Please describe your project', variant: 'destructive' })
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/public/demo/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectDescription, clientName, projectType, budget, timeline }),
      })
      const data = await res.json()
      if (res.status === 429) {
        setLimitReached(true)
        return
      }
      if (!res.ok) throw new Error(data.error || 'Generation failed')
      setResult(data.proposal)
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2.5 cursor-pointer">
              <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-lg" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
                ProposalForge
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/auth">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/auth">
              <Button size="sm" className="gap-1.5">
                Get started free <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {!result ? (
          <>
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
                <Sparkles className="h-3.5 w-3.5" />
                Live AI Demo — no account needed
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight mb-3" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
                Generate a proposal in 60 seconds
              </h1>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                Describe your project and watch AI create a full client proposal with scope, deliverables, and pricing.
              </p>
            </div>

            <div className="bg-white border rounded-2xl shadow-sm p-8 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="desc">Describe the project *</Label>
                <Textarea
                  id="desc"
                  placeholder="e.g. Build a modern e-commerce website for a fashion brand. Needs product catalog, cart, checkout with Stripe, and a CMS for the client to manage products..."
                  value={projectDescription}
                  onChange={e => setProjectDescription(e.target.value)}
                  className="min-h-[120px] resize-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Client name (optional)</Label>
                  <Input placeholder="Acme Corp" value={clientName} onChange={e => setClientName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Project type</Label>
                  <Select value={projectType} onValueChange={setProjectType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PROJECT_TYPES.map(p => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Budget range (optional)</Label>
                  <Input placeholder="$5,000 – $10,000" value={budget} onChange={e => setBudget(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Timeline (optional)</Label>
                  <Input placeholder="6–8 weeks" value={timeline} onChange={e => setTimeline(e.target.value)} />
                </div>
              </div>
              <Button
                className="w-full h-12 text-base gap-2"
                onClick={generate}
                disabled={loading || !projectDescription.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Generating your proposal...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    Generate Proposal with AI
                  </>
                )}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                1 free demo per session ·{' '}
                <Link href="/auth" className="underline">Sign up free</Link>
                {' '}for 3 full proposals/month
              </p>
            </div>
          </>
        ) : limitReached ? (
          <div className="text-center py-20">
            <div className="h-16 w-16 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
              Demo limit reached
            </h2>
            <p className="text-muted-foreground mb-6">
              You've used your free demo. Sign up for a free account to generate up to 3 full proposals per month.
            </p>
            <Link href="/auth">
              <Button size="lg" className="gap-2">
                Create free account <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 rounded-full px-3 py-1 text-sm font-medium mb-2">
                  <CheckCircle className="h-3.5 w-3.5" /> Proposal generated!
                </div>
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
                  Your AI-Generated Proposal
                </h2>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setResult(null)}>Try Again</Button>
                <Link href="/auth">
                  <Button className="gap-2">
                    Save & Send <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>

            {result.executiveSummary && (
              <div className="bg-white rounded-2xl border p-6 shadow-sm">
                <h3 className="font-bold text-lg mb-3" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>Executive Summary</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">{result.executiveSummary}</p>
              </div>
            )}

            {result.deliverables?.length > 0 && (
              <div className="bg-white rounded-2xl border p-6 shadow-sm">
                <h3 className="font-bold text-lg mb-3" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>Deliverables</h3>
                <ul className="space-y-2">
                  {result.deliverables.map((d, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 mt-0.5 shrink-0 text-indigo-500" />
                      <span className="text-gray-700">{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.lineItems?.length > 0 && (
              <div className="bg-white rounded-2xl border p-6 shadow-sm">
                <h3 className="font-bold text-lg mb-4" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>Project Quote</h3>
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left text-sm text-muted-foreground pb-3">Description</th>
                      <th className="text-right text-sm text-muted-foreground pb-3">Qty</th>
                      <th className="text-right text-sm text-muted-foreground pb-3">Unit Price</th>
                      <th className="text-right text-sm text-muted-foreground pb-3">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.lineItems.map((item, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-3 text-gray-700">{item.description}</td>
                        <td className="py-3 text-right text-muted-foreground">{item.quantity}</td>
                        <td className="py-3 text-right text-muted-foreground">{formatCurrency(item.unitPrice)}</td>
                        <td className="py-3 text-right font-medium">{formatCurrency(item.quantity * item.unitPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3} className="pt-4 text-right font-bold text-lg">Total</td>
                      <td className="pt-4 text-right font-bold text-lg text-indigo-600">{formatCurrency(result.totalEstimate)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-8 text-center">
              <FileText className="h-10 w-10 text-indigo-500 mx-auto mb-3" />
              <h3 className="font-bold text-lg mb-2" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
                Want to send this to a client?
              </h3>
              <p className="text-muted-foreground mb-4">
                Sign up free to edit this proposal, add your branding, download a PDF, and send it with one click.
              </p>
              <Link href="/auth">
                <Button size="lg" className="gap-2">
                  Create free account <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
                <p className="mt-3 text-xs text-muted-foreground">Free forever · 3 proposals/month · No credit card</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
