import { useState } from 'react'
import { useLocation } from 'wouter'
import { useSEO } from '@/hooks/useSEO'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Sparkles, Loader2, ArrowRight } from 'lucide-react'

const PROJECT_TYPES = ['web-development', 'design', 'marketing', 'consulting', 'copywriting', 'other']

export function NewProposal() {
  const [, setLocation] = useLocation()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  useSEO({ title: 'New Proposal', noindex: true })

  const [form, setForm] = useState({
    title: '',
    clientName: '',
    clientEmail: '',
    projectType: 'other',
    projectDescription: '',
    budgetRange: '',
    timeline: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title) return
    setLoading(true)
    try {
      const data = await api.post<{ proposal: { id: string } }>('/proposals', form)
      setLocation(`/proposals/${data.proposal.id}`)
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <Button variant="ghost" size="sm" onClick={() => setLocation('/proposals')} className="gap-2 mb-4 -ml-2">
          <ArrowLeft className="h-4 w-4" /> Back to Proposals
        </Button>
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>New Proposal</h1>
        </div>
        <p className="text-muted-foreground text-sm ml-13">
          Describe your project and let AI generate a professional proposal in seconds.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Project Details</CardTitle>
            <CardDescription>The more detail you provide, the better the AI output.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title">Proposal Title *</Label>
              <Input
                id="title"
                placeholder="Website Redesign for Acme Corp"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                required
                data-testid="input-title"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Client Name</Label>
                <Input
                  placeholder="John Smith"
                  value={form.clientName}
                  onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))}
                  data-testid="input-client-name"
                />
              </div>
              <div className="space-y-2">
                <Label>Client Email</Label>
                <Input
                  type="email"
                  placeholder="john@example.com"
                  value={form.clientEmail}
                  onChange={e => setForm(f => ({ ...f, clientEmail: e.target.value }))}
                  data-testid="input-client-email"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Project Type</Label>
                <Select value={form.projectType} onValueChange={v => setForm(f => ({ ...f, projectType: v }))}>
                  <SelectTrigger data-testid="select-project-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_TYPES.map(t => (
                      <SelectItem key={t} value={t}>
                        <span className="capitalize">{t.replace('-', ' ')}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Budget Range</Label>
                <Input
                  placeholder="$5,000 – $10,000"
                  value={form.budgetRange}
                  onChange={e => setForm(f => ({ ...f, budgetRange: e.target.value }))}
                  data-testid="input-budget"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Timeline</Label>
              <Input
                placeholder="4–6 weeks"
                value={form.timeline}
                onChange={e => setForm(f => ({ ...f, timeline: e.target.value }))}
                data-testid="input-timeline"
              />
            </div>

            <div className="space-y-2">
              <Label>Describe the Project *</Label>
              <Textarea
                placeholder="Describe the project scope, goals, client needs, and any specific requirements. The more detail you provide, the better the AI-generated proposal will be."
                value={form.projectDescription}
                onChange={e => setForm(f => ({ ...f, projectDescription: e.target.value }))}
                className="min-h-[140px]"
                data-testid="textarea-description"
              />
            </div>

            <Button
              type="submit"
              disabled={loading || !form.title}
              className="w-full h-11 gap-2 text-base"
              data-testid="button-create-proposal"
            >
              {loading
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</>
                : <><Sparkles className="h-4 w-4" /> Create Proposal <ArrowRight className="h-4 w-4" /></>
              }
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
