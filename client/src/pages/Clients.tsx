import { useEffect, useState } from 'react'
import { Link } from 'wouter'
import { api } from '@/lib/api'
import { useSEO } from '@/hooks/useSEO'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Search, MoreHorizontal, Trash2, Users, Loader2, FileText, Receipt, Pencil } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Client {
  id: string
  name: string
  email: string
  company: string
  phone: string
  proposal_count: number
  invoice_count: number
  created_at: string
}

interface ClientForm {
  name: string
  email: string
  company: string
  phone: string
  notes: string
}

const EMPTY_FORM: ClientForm = { name: '', email: '', company: '', phone: '', notes: '' }

export function Clients() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ClientForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useSEO({ title: 'Clients', noindex: true })

  async function load() {
    try {
      const data = await api.get<{ clients: Client[] }>('/clients')
      setClients(data.clients)
    } catch {
      toast({ title: 'Error', description: 'Failed to load clients', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = clients.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.company?.toLowerCase().includes(search.toLowerCase())
  )

  function openCreate() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function openEdit(client: Client) {
    setEditingId(client.id)
    setForm({
      name: client.name,
      email: client.email || '',
      company: client.company || '',
      phone: client.phone || '',
      notes: '',
    })
    setShowForm(true)
  }

  async function save() {
    if (!form.name) return
    setSaving(true)
    try {
      if (editingId) {
        const data = await api.put<{ client: Client }>(`/clients/${editingId}`, form)
        setClients(prev => prev.map(c => c.id === editingId ? { ...c, ...data.client } : c))
        toast({ title: 'Updated', description: 'Client updated' })
      } else {
        const data = await api.post<{ client: Client }>('/clients', form)
        setClients(prev => [{ ...data.client, proposal_count: 0, invoice_count: 0 }, ...prev])
        toast({ title: 'Created', description: 'Client added' })
      }
      setShowForm(false)
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  async function deleteClient(id: string) {
    if (!confirm('Delete this client? This will not delete their proposals or invoices.')) return
    try {
      await api.delete(`/clients/${id}`)
      setClients(prev => prev.filter(c => c.id !== id))
      toast({ title: 'Deleted', description: 'Client deleted' })
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>Clients</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{clients.length} total clients</p>
        </div>
        <Button onClick={openCreate} className="gap-1.5" data-testid="button-new-client">
          <Plus className="h-4 w-4" /><span className="hidden sm:inline"> Add Client</span><span className="sm:hidden">Add</span>
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search clients..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 max-w-sm"
          data-testid="input-search-clients"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <h3 className="font-semibold text-lg mb-2">No clients yet</h3>
          <p className="text-muted-foreground text-sm max-w-sm mb-6">Add your clients to quickly fill in their details when creating proposals.</p>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> Add Client
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(client => (
            <Card key={client.id} data-testid={`client-card-${client.id}`} className="hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/clients/${client.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                      {client.name[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{client.name}</p>
                      {client.company && <p className="text-xs text-muted-foreground truncate">{client.company}</p>}
                    </div>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(client)}>
                        <Pencil className="h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => deleteClient(client.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {client.email && (
                  <p className="text-xs text-muted-foreground mt-3 truncate">{client.email}</p>
                )}

                <div className="flex items-center gap-4 mt-4 pt-4 border-t">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <FileText className="h-3.5 w-3.5" />
                    <span>{client.proposal_count} proposals</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Receipt className="h-3.5 w-3.5" />
                    <span>{client.invoice_count} invoices</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Client' : 'Add Client'}</DialogTitle>
            <DialogDescription>Fill in the client's contact information.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input placeholder="John Smith" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} data-testid="input-client-name" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="john@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} data-testid="input-client-email" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input placeholder="+1 555 0000" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Company</Label>
              <Input placeholder="Acme Corp" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving || !form.name} data-testid="button-save-client">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingId ? 'Save Changes' : 'Add Client')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
