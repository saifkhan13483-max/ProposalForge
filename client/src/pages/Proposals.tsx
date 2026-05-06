import { useEffect, useState } from 'react'
import { Link, useLocation } from 'wouter'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import {
  Plus, Search, MoreHorizontal, Copy, Trash2, Send, Download,
  Loader2, FileText, Sparkles, Eye, CheckCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface Proposal {
  id: string
  title: string
  status: string
  client_name: string
  client_email: string
  total_amount: number
  project_type: string
  created_at: string
  sent_at: string
  accepted_at: string
}

const STATUS_OPTIONS = ['all', 'draft', 'sent', 'viewed', 'accepted', 'declined']

export function Proposals() {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [, setLocation] = useLocation()
  const { toast } = useToast()

  async function load() {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (search) params.set('search', search)
      const data = await api.get<{ proposals: Proposal[] }>(`/proposals?${params}`)
      setProposals(data.proposals)
    } catch {
      toast({ title: 'Error', description: 'Failed to load proposals', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [statusFilter, search])

  async function duplicate(id: string) {
    try {
      const data = await api.post<{ proposal: Proposal }>(`/proposals/${id}/duplicate`)
      toast({ title: 'Duplicated', description: 'Proposal duplicated successfully' })
      setProposals(prev => [data.proposal, ...prev])
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    }
  }

  async function deleteProposal(id: string) {
    if (!confirm('Delete this proposal?')) return
    try {
      await api.delete(`/proposals/${id}`)
      setProposals(prev => prev.filter(p => p.id !== id))
      toast({ title: 'Deleted', description: 'Proposal deleted' })
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>Proposals</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{proposals.length} total proposals</p>
        </div>
        <Link href="/proposals/new">
          <Button data-testid="button-new-proposal" className="gap-2">
            <Plus className="h-4 w-4" /> New Proposal
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search proposals..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40" data-testid="select-status">
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

      {/* Proposals list */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : proposals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h3 className="font-semibold text-lg mb-2" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>No proposals yet</h3>
          <p className="text-muted-foreground text-sm max-w-sm mb-6">
            Create your first AI-powered proposal and win more clients.
          </p>
          <Link href="/proposals/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Create Proposal
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {proposals.map(proposal => (
            <div
              key={proposal.id}
              data-testid={`proposal-row-${proposal.id}`}
              className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:shadow-sm transition-all group"
            >
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <FileText className="h-5 w-5 text-primary" />
              </div>

              <div className="flex-1 min-w-0">
                <Link href={`/proposals/${proposal.id}`}>
                  <a className="font-medium text-sm hover:text-primary transition-colors truncate block">
                    {proposal.title}
                  </a>
                </Link>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground truncate">
                    {proposal.client_name || 'No client'} · {formatDate(proposal.created_at)}
                  </span>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-3">
                <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium capitalize', getStatusColor(proposal.status))}>
                  {proposal.status}
                </span>
                <span className="text-sm font-semibold w-24 text-right">
                  {formatCurrency(proposal.total_amount || 0)}
                </span>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 shrink-0" data-testid={`proposal-menu-${proposal.id}`}>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setLocation(`/proposals/${proposal.id}`)}>
                    <Eye className="h-4 w-4" /> View / Edit
                  </DropdownMenuItem>
                  {proposal.status === 'draft' && (
                    <DropdownMenuItem onClick={() => setLocation(`/proposals/${proposal.id}?action=send`)}>
                      <Send className="h-4 w-4" /> Send to Client
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => duplicate(proposal.id)}>
                    <Copy className="h-4 w-4" /> Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => deleteProposal(proposal.id)}
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
    </div>
  )
}
