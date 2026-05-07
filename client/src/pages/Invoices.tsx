import { useEffect, useState } from 'react'
import { Link, useLocation } from 'wouter'
import { api } from '@/lib/api'
import { useSEO } from '@/hooks/useSEO'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Plus, Search, MoreHorizontal, Trash2, CheckCircle,
  Loader2, Receipt, CreditCard
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface Invoice {
  id: string
  invoice_number: string
  status: string
  client_name: string
  client_email: string
  total: number
  due_date: string
  created_at: string
  paid_at: string
}

function getEffectiveStatus(invoice: Invoice): string {
  if (invoice.status === 'paid') return 'paid'
  if (invoice.due_date && new Date(invoice.due_date) < new Date() && invoice.status !== 'paid') return 'overdue'
  return invoice.status
}

interface NewInvoiceForm {
  clientName: string
  clientEmail: string
  dueDate: string
  notes: string
}

const STATUS_OPTIONS = ['all', 'draft', 'sent', 'paid', 'overdue']

export function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')

  useSEO({ title: 'Invoices', noindex: true })
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState<NewInvoiceForm>({ clientName: '', clientEmail: '', dueDate: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const [, setLocation] = useLocation()
  const { toast } = useToast()

  async function load() {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (search) params.set('search', search)
      const data = await api.get<{ invoices: Invoice[] }>(`/invoices?${params}`)
      setInvoices(data.invoices)
    } catch {
      toast({ title: 'Error', description: 'Failed to load invoices', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [statusFilter, search])

  async function createInvoice() {
    setSaving(true)
    try {
      const data = await api.post<{ invoice: Invoice }>('/invoices', {
        ...form,
        lineItems: [],
      })
      setInvoices(prev => [data.invoice, ...prev])
      setShowNew(false)
      setForm({ clientName: '', clientEmail: '', dueDate: '', notes: '' })
      setLocation(`/invoices/${data.invoice.id}`)
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  async function markPaid(id: string) {
    try {
      const data = await api.post<{ invoice: Invoice }>(`/invoices/${id}/mark-paid`)
      setInvoices(prev => prev.map(i => i.id === id ? data.invoice : i))
      toast({ title: 'Marked as paid', description: 'Invoice updated successfully' })
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    }
  }

  async function deleteInvoice(id: string) {
    if (!confirm('Delete this invoice?')) return
    try {
      await api.delete(`/invoices/${id}`)
      setInvoices(prev => prev.filter(i => i.id !== id))
      toast({ title: 'Deleted', description: 'Invoice deleted' })
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    }
  }

  async function checkout(id: string) {
    try {
      const data = await api.post<{ url: string }>(`/invoices/${id}/checkout`)
      if (data.url) window.open(data.url, '_blank')
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>Invoices</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{invoices.length} total invoices</p>
        </div>
        <Button onClick={() => setShowNew(true)} className="gap-1.5" data-testid="button-new-invoice">
          <Plus className="h-4 w-4" /><span className="hidden sm:inline"> New Invoice</span><span className="sm:hidden">New</span>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by client or invoice number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-invoices"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(s => (
              <SelectItem key={s} value={s}>
                <span className="capitalize">{s === 'all' ? 'All statuses' : s}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Invoices list */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Receipt className="h-8 w-8 text-primary" />
          </div>
          <h3 className="font-semibold text-lg mb-2">No invoices yet</h3>
          <p className="text-muted-foreground text-sm max-w-sm mb-6">
            Create your first invoice or accept a proposal to generate one automatically.
          </p>
          <Button onClick={() => setShowNew(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Create Invoice
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {invoices.map(invoice => (
            <div
              key={invoice.id}
              data-testid={`invoice-row-${invoice.id}`}
              className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:shadow-sm transition-all group"
            >
              <div className="h-10 w-10 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center shrink-0">
                <Receipt className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/invoices/${invoice.id}`}
                  className="font-semibold text-sm hover:text-primary transition-colors"
                >
                  {invoice.invoice_number}
                </Link>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {invoice.client_name || 'No client'} · Due {formatDate(invoice.due_date)}
                </p>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <span className={cn('text-xs px-2 sm:px-2.5 py-1 rounded-full font-medium capitalize hidden sm:inline', getStatusColor(getEffectiveStatus(invoice)))}>
                  {getEffectiveStatus(invoice)}
                </span>
                <span className="text-sm font-semibold sm:w-24 text-right">{formatCurrency(invoice.total || 0)}</span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="shrink-0 sm:opacity-0 sm:group-hover:opacity-100">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setLocation(`/invoices/${invoice.id}`)}>
                    <Receipt className="h-4 w-4" /> View Invoice
                  </DropdownMenuItem>
                  {invoice.status !== 'paid' && (
                    <>
                      <DropdownMenuItem onClick={() => checkout(invoice.id)}>
                        <CreditCard className="h-4 w-4" /> Send Payment Link
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => markPaid(invoice.id)}>
                        <CheckCircle className="h-4 w-4" /> Mark as Paid
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => deleteInvoice(invoice.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}

      {/* New invoice dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Invoice</DialogTitle>
            <DialogDescription>Fill in the client details to create a new invoice.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Client Name</Label>
              <Input
                placeholder="Acme Corp"
                value={form.clientName}
                onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))}
                data-testid="input-client-name"
              />
            </div>
            <div className="space-y-2">
              <Label>Client Email</Label>
              <Input
                type="email"
                placeholder="client@example.com"
                value={form.clientEmail}
                onChange={e => setForm(f => ({ ...f, clientEmail: e.target.value }))}
                data-testid="input-client-email"
              />
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={form.dueDate}
                onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                data-testid="input-due-date"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button onClick={createInvoice} disabled={saving || !form.clientName} data-testid="button-create-invoice">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Invoice'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
