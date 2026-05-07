import { useEffect, useState } from 'react'
import { useRoute, useLocation, Link } from 'wouter'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import {
  ArrowLeft, Pencil, FileText, Receipt, Loader2, Mail, Phone, Building2,
  Plus, ExternalLink
} from 'lucide-react'

interface Client {
  id: string
  name: string
  email: string
  company: string
  phone: string
  notes: string
  created_at: string
}

interface Proposal {
  id: string
  title: string
  status: string
  total_amount: number
  created_at: string
}

interface Invoice {
  id: string
  invoice_number: string
  status: string
  total: number
  due_date: string
  paid_at: string
}

export function ClientDetail() {
  const [, params] = useRoute('/clients/:id')
  const [, setLocation] = useLocation()
  const { toast } = useToast()
  const [client, setClient] = useState<Client | null>(null)
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', company: '', phone: '', notes: '' })

  useEffect(() => {
    if (!params?.id) return
    Promise.all([
      api.get<{ client: Client }>(`/clients/${params.id}`),
      api.get<{ proposals: Proposal[] }>(`/clients/${params.id}/proposals`),
      api.get<{ invoices: Invoice[] }>(`/clients/${params.id}/invoices`),
    ]).then(([c, p, i]) => {
      setClient(c.client)
      setProposals(p.proposals)
      setInvoices(i.invoices)
      setForm({
        name: c.client.name || '',
        email: c.client.email || '',
        company: c.client.company || '',
        phone: c.client.phone || '',
        notes: c.client.notes || '',
      })
    }).catch(() => {
      toast({ title: 'Error', description: 'Failed to load client', variant: 'destructive' })
    }).finally(() => setLoading(false))
  }, [params?.id])

  async function saveClient() {
    if (!client) return
    setSaving(true)
    try {
      const data = await api.put<{ client: Client }>(`/clients/${client.id}`, form)
      setClient(data.client)
      setShowEdit(false)
      toast({ title: 'Updated', description: 'Client updated successfully' })
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  function getInvoiceStatus(invoice: Invoice): string {
    if (invoice.status === 'paid') return 'paid'
    if (invoice.due_date && new Date(invoice.due_date) < new Date()) return 'overdue'
    return invoice.status
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )

  if (!client) return <div className="p-8 text-center text-muted-foreground">Client not found</div>

  return (
    <div className="max-w-5xl mx-auto p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation('/clients')} className="shrink-0 mt-1">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold truncate" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
            {client.name}
          </h1>
          {client.company && (
            <p className="text-muted-foreground mt-0.5">{client.company}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/proposals/new">
            <Button variant="outline" className="gap-2">
              <Plus className="h-4 w-4" /> New Proposal
            </Button>
          </Link>
          <Button variant="outline" onClick={() => setShowEdit(true)} className="gap-2">
            <Pencil className="h-4 w-4" /> Edit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client info card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Contact Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {client.email && (
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Email</p>
                  <a href={`mailto:${client.email}`} className="text-sm hover:text-primary transition-colors">
                    {client.email}
                  </a>
                </div>
              </div>
            )}
            {client.phone && (
              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Phone</p>
                  <p className="text-sm">{client.phone}</p>
                </div>
              </div>
            )}
            {client.company && (
              <div className="flex items-start gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Company</p>
                  <p className="text-sm">{client.company}</p>
                </div>
              </div>
            )}
            {client.notes && (
              <div className="pt-3 border-t">
                <p className="text-xs text-muted-foreground mb-1">Notes</p>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{client.notes}</p>
              </div>
            )}
            <div className="pt-3 border-t">
              <p className="text-xs text-muted-foreground">
                Client since {formatDate(client.created_at)}
              </p>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t">
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold">{proposals.length}</p>
                <p className="text-xs text-muted-foreground">Proposals</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold">{invoices.length}</p>
                <p className="text-xs text-muted-foreground">Invoices</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Proposals & Invoices */}
        <div className="lg:col-span-2 space-y-5">
          {/* Proposals */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                Proposals
              </CardTitle>
              <Link href="/proposals/new" className="text-xs text-primary hover:underline flex items-center gap-1">
                New <Plus className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent>
              {proposals.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No proposals yet for this client.</p>
              ) : (
                <div className="space-y-2">
                  {proposals.map(p => (
                    <Link
                      key={p.id}
                      href={`/proposals/${p.id}`}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{p.title}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(p.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-3">
                        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium capitalize', getStatusColor(p.status))}>
                          {p.status}
                        </span>
                        <span className="text-sm font-semibold">{formatCurrency(p.total_amount || 0)}</span>
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoices */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Receipt className="h-4 w-4 text-green-600" />
                Invoices
              </CardTitle>
              <Link href="/invoices" className="text-xs text-primary hover:underline flex items-center gap-1">
                New <Plus className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No invoices yet for this client.</p>
              ) : (
                <div className="space-y-2">
                  {invoices.map(inv => (
                    <Link
                      key={inv.id}
                      href={`/invoices/${inv.id}`}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold group-hover:text-primary transition-colors">{inv.invoice_number}</p>
                        <p className="text-xs text-muted-foreground">Due {formatDate(inv.due_date)}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-3">
                        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium capitalize', getStatusColor(getInvoiceStatus(inv)))}>
                          {getInvoiceStatus(inv)}
                        </span>
                        <span className="text-sm font-semibold">{formatCurrency(inv.total || 0)}</span>
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>Update the client's contact information.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="John Smith" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="john@example.com" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+1 555 0000" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Company</Label>
              <Input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} placeholder="Acme Corp" />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Internal notes about this client..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEdit(false)}>Cancel</Button>
            <Button onClick={saveClient} disabled={saving || !form.name}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
