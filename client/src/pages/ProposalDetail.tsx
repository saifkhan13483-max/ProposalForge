import { useEffect, useState } from 'react'
import { useRoute, useLocation } from 'wouter'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import {
  ArrowLeft, Sparkles, Send, Loader2, Plus, Trash2, RotateCw,
  RefreshCw, Save, ExternalLink, Copy, CheckCircle, Download, MessageSquare, Clock
} from 'lucide-react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

interface Proposal {
  id: string
  title: string
  status: string
  client_name: string
  client_email: string
  project_type: string
  project_description: string
  budget_range: string
  timeline: string
  content: Record<string, unknown>
  total_amount: number
  accept_token: string
  accepted_at: string
  sent_at: string
}

interface LineItem {
  id?: string
  description: string
  quantity: number
  unit_price: number
}

const PROJECT_TYPES = ['web-development', 'design', 'marketing', 'consulting', 'copywriting', 'other']

export function ProposalDetail() {
  const [, params] = useRoute('/proposals/:id')
  const [, setLocation] = useLocation()
  const { toast } = useToast()

  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [showSendDialog, setShowSendDialog] = useState(false)
  const [personalMessage, setPersonalMessage] = useState('')
  const [sentUrl, setSentUrl] = useState('')
  const [activeTab, setActiveTab] = useState('intake')
  const [regeneratingSection, setRegeneratingSection] = useState<string | null>(null)
  const [comments, setComments] = useState<{ id: string; comment: string; commenter_name: string | null; created_at: string }[]>([])

  const [form, setForm] = useState({
    title: '',
    clientName: '',
    clientEmail: '',
    projectType: 'other',
    projectDescription: '',
    budgetRange: '',
    timeline: '',
  })

  const executiveSummaryEditor = useEditor({
    extensions: [StarterKit],
    content: '',
    editorProps: { attributes: { class: 'tiptap p-3 min-h-[120px]' } },
  })

  const scopeEditor = useEditor({
    extensions: [StarterKit],
    content: '',
    editorProps: { attributes: { class: 'tiptap p-3 min-h-[150px]' } },
  })

  const termsEditor = useEditor({
    extensions: [StarterKit],
    content: '',
    editorProps: { attributes: { class: 'tiptap p-3 min-h-[120px]' } },
  })

  useEffect(() => {
    if (!params?.id) return
    api.get<{ proposal: Proposal; lineItems: LineItem[] }>(`/proposals/${params.id}`)
      .then(data => {
        setProposal(data.proposal)
        setLineItems(data.lineItems || [])
        setForm({
          title: data.proposal.title || '',
          clientName: data.proposal.client_name || '',
          clientEmail: data.proposal.client_email || '',
          projectType: data.proposal.project_type || 'other',
          projectDescription: data.proposal.project_description || '',
          budgetRange: data.proposal.budget_range || '',
          timeline: data.proposal.timeline || '',
        })
        const content = data.proposal.content || {}
        executiveSummaryEditor?.commands.setContent((content.executiveSummary as string) || '')
        scopeEditor?.commands.setContent((content.scopeOfWork as string) || '')
        termsEditor?.commands.setContent((content.terms as string) || '')
        if (data.proposal.content && Object.keys(data.proposal.content).length > 0) {
          setActiveTab('proposal')
        }
      })
      .catch(() => toast({ title: 'Error', description: 'Failed to load proposal', variant: 'destructive' }))
      .finally(() => setLoading(false))

    api.get<{ comments: { id: string; comment: string; commenter_name: string | null; created_at: string }[] }>(`/proposals/${params.id}/comments`)
      .then(data => setComments(data.comments || []))
      .catch(() => {})
  }, [params?.id])

  async function saveBasics() {
    if (!proposal) return
    setSaving(true)
    try {
      const data = await api.put<{ proposal: Proposal }>(`/proposals/${proposal.id}`, form)
      setProposal(data.proposal)
      toast({ title: 'Saved' })
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  async function generateAI() {
    if (!proposal) return
    await saveBasics()
    setGenerating(true)
    try {
      const data = await api.post<{ proposal: Proposal; lineItems: LineItem[]; content: Record<string, unknown> }>(`/proposals/${proposal.id}/generate`)
      setProposal(data.proposal)
      setLineItems(data.lineItems || [])
      executiveSummaryEditor?.commands.setContent((data.content.executiveSummary as string) || '')
      scopeEditor?.commands.setContent((data.content.scopeOfWork as string) || '')
      termsEditor?.commands.setContent((data.content.terms as string) || '')
      setActiveTab('proposal')
      toast({ title: 'Proposal generated!', description: 'AI has created your proposal. Review and edit as needed.' })
    } catch (err: unknown) {
      const error = err as { message?: string; upgradeRequired?: boolean }
      if (error?.upgradeRequired) {
        toast({
          title: 'Upgrade required',
          description: 'You\'ve used all free proposals this month. Upgrade to Pro for unlimited proposals.',
          variant: 'destructive',
        })
      } else {
        toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
      }
    } finally {
      setGenerating(false)
    }
  }

  async function saveProposal() {
    if (!proposal) return
    setSaving(true)
    try {
      const content = {
        ...((proposal.content as Record<string, unknown>) || {}),
        executiveSummary: executiveSummaryEditor?.getHTML() || '',
        scopeOfWork: scopeEditor?.getHTML() || '',
        terms: termsEditor?.getHTML() || '',
      }
      await api.put(`/proposals/${proposal.id}`, { content })
      await api.put(`/proposals/${proposal.id}/line-items`, { lineItems })
      toast({ title: 'Saved' })
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  async function regenerateSection(section: string) {
    if (!proposal) return
    setRegeneratingSection(section)
    try {
      const data = await api.post<{ content: Record<string, unknown> }>(`/proposals/${proposal.id}/regenerate-section`, { section })
      if (section === 'executiveSummary') executiveSummaryEditor?.commands.setContent((data.content.executiveSummary as string) || '')
      if (section === 'scopeOfWork') scopeEditor?.commands.setContent((data.content.scopeOfWork as string) || '')
      if (section === 'terms') termsEditor?.commands.setContent((data.content.terms as string) || '')
      toast({ title: 'Section regenerated' })
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setRegeneratingSection(null)
    }
  }

  async function downloadPdf() {
    if (!proposal) return
    try {
      const token = localStorage.getItem('pf_token')
      const res = await fetch(`/api/proposals/${proposal.id}/pdf`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error('Failed to generate PDF')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${proposal.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-proposal.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    }
  }

  async function sendProposal() {
    if (!proposal) return
    setSending(true)
    try {
      const data = await api.post<{ success: boolean; acceptUrl: string }>(`/proposals/${proposal.id}/send`, { personalMessage })
      setSentUrl(data.acceptUrl)
      setProposal(prev => prev ? { ...prev, status: 'sent' } : prev)
      setShowSendDialog(false)
      toast({ title: 'Sent!', description: 'Proposal sent to client.' })
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setSending(false)
    }
  }

  function addLineItem() {
    setLineItems(prev => [...prev, { description: '', quantity: 1, unit_price: 0 }])
  }

  function updateLineItem(index: number, field: keyof LineItem, value: string | number) {
    setLineItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  function removeLineItem(index: number) {
    setLineItems(prev => prev.filter((_, i) => i !== index))
  }

  const total = lineItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )

  if (!proposal) return <div className="p-8">Proposal not found</div>

  const acceptUrl = `${window.location.origin}/proposal/${proposal.accept_token}`

  return (
    <div className="max-w-5xl mx-auto p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation('/proposals')} className="shrink-0 mt-1">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold truncate" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
              {proposal.title}
            </h1>
            <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium capitalize shrink-0', getStatusColor(proposal.status))}>
              {proposal.status}
            </span>
          </div>
          {proposal.client_name && (
            <p className="text-sm text-muted-foreground mt-0.5">{proposal.client_name}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {proposal.status === 'draft' && (
            <Button
              onClick={generateAI}
              disabled={generating}
              className="gap-2"
              data-testid="button-generate-ai"
            >
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {generating ? 'Generating...' : 'Generate with AI'}
            </Button>
          )}
          {proposal.content && Object.keys(proposal.content).length > 0 && (
            <Button
              variant="outline"
              className="gap-2"
              onClick={downloadPdf}
              data-testid="button-download-pdf"
            >
              <Download className="h-4 w-4" /> PDF
            </Button>
          )}
          {proposal.status !== 'accepted' && (
            <Button
              variant="outline"
              onClick={() => setShowSendDialog(true)}
              className="gap-2"
              data-testid="button-send-proposal"
            >
              <Send className="h-4 w-4" /> Send
            </Button>
          )}
        </div>
      </div>

      {/* Sent URL */}
      {sentUrl && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
          <p className="text-sm text-green-700 dark:text-green-400 flex-1 truncate">
            Proposal link: <a href={sentUrl} target="_blank" rel="noreferrer" className="underline">{sentUrl}</a>
          </p>
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => { navigator.clipboard.writeText(sentUrl); toast({ title: 'Copied!' }) }}>
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="intake" data-testid="tab-intake">Project Details</TabsTrigger>
          <TabsTrigger value="proposal" data-testid="tab-proposal">Proposal Content</TabsTrigger>
          <TabsTrigger value="quote" data-testid="tab-quote">Quote & Pricing</TabsTrigger>
        </TabsList>

        {/* Intake form */}
        <TabsContent value="intake">
          <Card>
            <CardContent className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-2">
                  <Label>Proposal Title *</Label>
                  <Input
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Website Redesign for Acme Corp"
                    data-testid="input-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Client Name</Label>
                  <Input value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} placeholder="John Smith" data-testid="input-client-name" />
                </div>
                <div className="space-y-2">
                  <Label>Client Email</Label>
                  <Input type="email" value={form.clientEmail} onChange={e => setForm(f => ({ ...f, clientEmail: e.target.value }))} placeholder="john@example.com" data-testid="input-client-email" />
                </div>
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
                  <Input value={form.budgetRange} onChange={e => setForm(f => ({ ...f, budgetRange: e.target.value }))} placeholder="$5,000 – $10,000" data-testid="input-budget" />
                </div>
                <div className="space-y-2">
                  <Label>Timeline</Label>
                  <Input value={form.timeline} onChange={e => setForm(f => ({ ...f, timeline: e.target.value }))} placeholder="4–6 weeks" data-testid="input-timeline" />
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <Label>Describe the Project</Label>
                  <Textarea
                    value={form.projectDescription}
                    onChange={e => setForm(f => ({ ...f, projectDescription: e.target.value }))}
                    placeholder="Describe the project scope, goals, and any specific requirements..."
                    className="min-h-[120px]"
                    data-testid="textarea-description"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <Button onClick={saveBasics} disabled={saving} variant="outline" className="gap-2" data-testid="button-save-basics">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Details
                </Button>
                <Button onClick={generateAI} disabled={generating || !form.projectDescription} className="gap-2" data-testid="button-generate">
                  {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {generating ? 'Generating...' : 'Generate Proposal with AI'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Proposal content */}
        <TabsContent value="proposal" className="space-y-4">
          {!proposal.content || Object.keys(proposal.content).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-xl">
              <Sparkles className="h-10 w-10 text-primary mb-3 opacity-50" />
              <h3 className="font-semibold mb-2">No proposal content yet</h3>
              <p className="text-sm text-muted-foreground mb-4">Fill in project details and generate AI content.</p>
              <Button onClick={() => setActiveTab('intake')} variant="outline">Go to Project Details</Button>
            </div>
          ) : (
            <>
              {[
                { key: 'executiveSummary', label: 'Executive Summary', editor: executiveSummaryEditor },
                { key: 'scopeOfWork', label: 'Scope of Work', editor: scopeEditor },
                { key: 'terms', label: 'Terms & Conditions', editor: termsEditor },
              ].map(({ key, label, editor }) => (
                <Card key={key}>
                  <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-sm font-semibold">{label}</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => regenerateSection(key)}
                      disabled={regeneratingSection === key}
                      className="gap-1.5 text-xs"
                      data-testid={`button-regenerate-${key}`}
                    >
                      {regeneratingSection === key
                        ? <Loader2 className="h-3 w-3 animate-spin" />
                        : <RotateCw className="h-3 w-3" />
                      }
                      Regenerate
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="border-t rounded-b-xl overflow-hidden">
                      <EditorContent editor={editor} />
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Deliverables */}
              {proposal.content?.deliverables && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">Deliverables</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {(proposal.content.deliverables as string[]).map((d, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          {d}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end">
                <Button onClick={saveProposal} disabled={saving} className="gap-2" data-testid="button-save-proposal">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Proposal
                </Button>
              </div>
            </>
          )}
        </TabsContent>

        {/* Quote */}
        <TabsContent value="quote">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-3">
                {lineItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-center" data-testid={`line-item-${index}`}>
                    <div className="col-span-6">
                      <Input
                        placeholder="Description"
                        value={item.description}
                        onChange={e => updateLineItem(index, 'description', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.5"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={e => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="number"
                        min="0"
                        placeholder="Unit price"
                        value={item.unit_price}
                        onChange={e => updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <Button variant="ghost" size="icon" onClick={() => removeLineItem(index)} className="h-9 w-9 text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="col-span-6 text-xs text-muted-foreground">
                      {/* label spacer */}
                    </div>
                    <div className="col-span-6 text-right text-sm font-medium text-muted-foreground">
                      {formatCurrency(item.quantity * item.unit_price)}
                    </div>
                  </div>
                ))}
              </div>

              <Button variant="outline" onClick={addLineItem} className="gap-2 w-full" data-testid="button-add-line-item">
                <Plus className="h-4 w-4" /> Add Line Item
              </Button>

              <div className="pt-4 border-t flex items-center justify-between">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-bold">{formatCurrency(total)}</span>
              </div>

              <div className="flex justify-end">
                <Button onClick={saveProposal} disabled={saving} className="gap-2" data-testid="button-save-quote">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Quote
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Client change requests */}
      {comments.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-900/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-800 dark:text-amber-300">
              <MessageSquare className="h-4 w-4" />
              Client Feedback ({comments.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {comments.map(c => (
              <div key={c.id} className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-800 flex items-center justify-center shrink-0 text-sm font-medium text-amber-700 dark:text-amber-200">
                  {c.commenter_name ? c.commenter_name[0].toUpperCase() : '?'}
                </div>
                <div className="flex-1 bg-white dark:bg-muted rounded-xl p-3 border">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{c.commenter_name || 'Anonymous'}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />{new Date(c.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{c.comment}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Send dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Proposal to Client</DialogTitle>
            <DialogDescription>
              The client will receive an email with a link to review and accept the proposal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="p-3 rounded-lg bg-muted text-sm">
              <p><span className="font-medium">To:</span> {proposal.client_email || 'No email set'}</p>
              <p className="mt-1"><span className="font-medium">Proposal:</span> {proposal.title}</p>
            </div>
            <div className="space-y-2">
              <Label>Personal message (optional)</Label>
              <Textarea
                value={personalMessage}
                onChange={e => setPersonalMessage(e.target.value)}
                placeholder="Looking forward to working together on this..."
                data-testid="textarea-personal-message"
              />
            </div>
            {!proposal.client_email && (
              <p className="text-sm text-destructive">Please add a client email in Project Details before sending.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendDialog(false)}>Cancel</Button>
            <Button
              onClick={sendProposal}
              disabled={sending || !proposal.client_email}
              className="gap-2"
              data-testid="button-confirm-send"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send Proposal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
