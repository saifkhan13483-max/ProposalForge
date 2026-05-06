import { useEffect, useState } from 'react'
import { useRoute, useLocation } from 'wouter'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { ArrowLeft, Plus, Trash2, Save, CheckCircle, CreditCard, Loader2 } from 'lucide-react'

interface Invoice {
  id: string
  invoice_number: string
  status: string
  client_name: string
  client_email: string
  line_items: { description: string; quantity: number; unitPrice: number }[]
  subtotal: number
  tax_rate: number
  tax_amount: number
  total: number
  due_date: string
  notes: string
  paid_at: string
  created_at: string
}

export function InvoiceDetail() {
  const [, params] = useRoute('/invoices/:id')
  const [, setLocation] = useLocation()
  const { toast } = useToast()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    clientName: '', clientEmail: '', dueDate: '', notes: '', taxRate: 0,
    lineItems: [] as { description: string; quantity: number; unitPrice: number }[],
  })

  useEffect(() => {
    if (!params?.id) return
    api.get<{ invoice: Invoice }>(`/invoices/${params.id}`)
      .then(data => {
        setInvoice(data.invoice)
        setForm({
          clientName: data.invoice.client_name || '',
          clientEmail: data.invoice.client_email || '',
          dueDate: data.invoice.due_date?.split('T')[0] || '',
          notes: data.invoice.notes || '',
          taxRate: parseFloat(String(data.invoice.tax_rate)) || 0,
          lineItems: data.invoice.line_items || [],
        })
      })
      .catch(() => toast({ title: 'Error', description: 'Failed to load invoice', variant: 'destructive' }))
      .finally(() => setLoading(false))
  }, [params?.id])

  async function save() {
    if (!invoice) return
    setSaving(true)
    try {
      const data = await api.put<{ invoice: Invoice }>(`/invoices/${invoice.id}`, form)
      setInvoice(data.invoice)
      toast({ title: 'Saved' })
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  async function markPaid() {
    if (!invoice) return
    try {
      const data = await api.post<{ invoice: Invoice }>(`/invoices/${invoice.id}/mark-paid`)
      setInvoice(data.invoice)
      toast({ title: 'Marked as paid' })
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    }
  }

  async function checkout() {
    if (!invoice) return
    try {
      const data = await api.post<{ url: string }>(`/invoices/${invoice.id}/checkout`)
      if (data.url) window.open(data.url, '_blank')
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    }
  }

  function addItem() { setForm(f => ({ ...f, lineItems: [...f.lineItems, { description: '', quantity: 1, unitPrice: 0 }] })) }
  function removeItem(i: number) { setForm(f => ({ ...f, lineItems: f.lineItems.filter((_, idx) => idx !== i) })) }
  function updateItem(i: number, field: string, value: string | number) {
    setForm(f => ({ ...f, lineItems: f.lineItems.map((item, idx) => idx === i ? { ...item, [field]: value } : item) }))
  }

  const subtotal = form.lineItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
  const taxAmount = subtotal * (form.taxRate / 100)
  const total = subtotal + taxAmount

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  if (!invoice) return <div className="p-8">Invoice not found</div>

  return (
    <div className="max-w-3xl mx-auto p-6 lg:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setLocation('/invoices')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>{invoice.invoice_number}</h1>
            <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium capitalize', getStatusColor(invoice.status))}>{invoice.status}</span>
          </div>
          <p className="text-sm text-muted-foreground">Created {formatDate(invoice.created_at)}</p>
        </div>
        <div className="flex gap-2">
          {invoice.status !== 'paid' && (
            <>
              <Button variant="outline" onClick={markPaid} className="gap-2" data-testid="button-mark-paid">
                <CheckCircle className="h-4 w-4" /> Mark Paid
              </Button>
              <Button onClick={checkout} className="gap-2" data-testid="button-checkout">
                <CreditCard className="h-4 w-4" /> Payment Link
              </Button>
            </>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Client Name</Label>
              <Input value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} data-testid="input-client-name" />
            </div>
            <div className="space-y-2">
              <Label>Client Email</Label>
              <Input type="email" value={form.clientEmail} onChange={e => setForm(f => ({ ...f, clientEmail: e.target.value }))} data-testid="input-client-email" />
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} data-testid="input-due-date" />
            </div>
            <div className="space-y-2">
              <Label>Tax Rate (%)</Label>
              <Input type="number" min="0" max="100" value={form.taxRate} onChange={e => setForm(f => ({ ...f, taxRate: parseFloat(e.target.value) || 0 }))} data-testid="input-tax-rate" />
            </div>
          </div>

          {/* Line items */}
          <div>
            <Label className="mb-3 block">Line Items</Label>
            <div className="space-y-2">
              {form.lineItems.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-6"><Input placeholder="Description" value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} /></div>
                  <div className="col-span-2"><Input type="number" min="0" step="0.5" placeholder="Qty" value={item.quantity} onChange={e => updateItem(i, 'quantity', parseFloat(e.target.value) || 0)} /></div>
                  <div className="col-span-3"><Input type="number" min="0" placeholder="Price" value={item.unitPrice} onChange={e => updateItem(i, 'unitPrice', parseFloat(e.target.value) || 0)} /></div>
                  <div className="col-span-1 flex justify-end">
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:text-destructive" onClick={() => removeItem(i)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" onClick={addItem} className="gap-2 w-full mt-2" data-testid="button-add-item">
              <Plus className="h-4 w-4" /> Add Line Item
            </Button>
          </div>

          {/* Totals */}
          <div className="pt-4 border-t space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {form.taxRate > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax ({form.taxRate}%)</span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-2 border-t">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Payment terms, thank you note..." data-testid="textarea-notes" />
          </div>

          <div className="flex justify-end">
            <Button onClick={save} disabled={saving} className="gap-2" data-testid="button-save-invoice">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Invoice
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
