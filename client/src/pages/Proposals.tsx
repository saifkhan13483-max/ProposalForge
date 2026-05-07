import { useEffect, useState } from 'react'
import { Link, useLocation } from 'wouter'
import { api } from '@/lib/api'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import {
  Plus, Search, MoreHorizontal, Copy, Trash2, Send, Download,
  Loader2, FileText, Sparkles, Eye, CheckCircle, Archive, ArchiveRestore
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
  archived: boolean
}

const STATUS_OPTIONS = ['all', 'draft', 'sent', 'viewed', 'accepted', 'declined']

export function Proposals() {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showArchived, setShowArchived] = useState(false)
  const [, setLocation] = useLocation()
  const { toast } = useToast()

  async function load() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (search) params.set('search', search)
      if (showArchived) params.set('archived', 'true')
      const data = await api.get<{ proposals: Proposal[] }>(`/proposals?${params}`)
      setProposals(data.proposals)
    } catch {
      toast({ title: 'Error', description: 'Failed to load proposals', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [statusFilter, search, showArchived])

  async function duplicate(id: string) {
    try {
      const data = await api.post<{ proposal: Proposal }>(`/proposals/${id}/duplicate`)
      toast({ title: 'Duplicated', description: 'Proposal duplicated successfully' })
      setProposals(prev => [data.proposal, ...prev])
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    }
  }

  async function archive(id: string) {
    try {
      await api.post(`/proposals/${id}/archive`, {})
      toast({ title: 'Archived', description: 'Proposal moved to archive' })
      setProposals(prev => prev.filter(p => p.id !== id))
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    }
  }

  async function unarchive(id: string) {
    try {
      await api.post(`/proposals/${id}/unarchive`, {})
      toast({ title: 'Restored', description: 'Proposal restored from archive' })
      setProposals(prev => prev.filter(p => p.id !== id))
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    }
  }

  async function deleteProposal(id: string) {
    if (!confirm('Delete this proposal permanently?')) return
    try {
      await api.delete(`/proposals/${id}`)
      setProposals(prev => prev.filter(p => p.id !== id))
      toast({ title: 'Deleted', description: 'Proposal deleted' })
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    }
  }

  async function downloadPdf(proposal: Proposal) {
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

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
            {showArchived ? 'Archived Proposals' : 'Proposals'}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">{proposals.length} {showArchived ? 'archived' : 'total'} proposals</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setShowArchived(!showArchived); setStatusFilter('all') }}
            className="gap-2"
          >
            {showArchived ? <><ArchiveRestore className="h-4 w-4" /> Active</> : <><Archive className="h-4 w-4" /> Archived</>}
          </Button>
          {!showArchived && (
            <Link href="/proposals/new">
              <Button data-testid="button-new-proposal" className="gap-2">
                <Plus className="h-4 w-4" /> New Proposal
              </Button>
            </Link>
          )}
        </div>
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
        {!showArchived && (
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
        )}
      </div>

      {/* Proposals list */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : proposals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            {showArchived ? <Archive className="h-8 w-8 text-primary" /> : <Sparkles className="h-8 w-8 text-primary" />}
          </div>
          <h3 className="font-semibold text-lg mb-2" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
            {showArchived ? 'No archived proposals' : 'No proposals yet'}
          </h3>
          <p className="text-muted-foreground text-sm max-w-sm mb-6">
            {showArchived
              ? 'Archived proposals will appear here.'
              : 'Create your first AI-powered proposal and win more clients.'}
          </p>
          {!showArchived && (
            <Link href="/proposals/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Create Proposal
              </Button>
            </Link>
          )}
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
                <Link
                  href={`/proposals/${proposal.id}`}
                  className="font-medium text-sm hover:text-primary transition-colors truncate block"
                >
                  {proposal.title}
                </Link>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground truncate">
                    {proposal.client_name || 'No client'} · {formatDate(proposal.created_at)}
                  </span>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-3">
                {showArchived && (
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-amber-50 text-amber-700">
                    Archived
                  </span>
                )}
                {!showArchived && (
                  <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium capitalize', getStatusColor(proposal.status))}>
                    {proposal.status}
                  </span>
                )}
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
                  {!showArchived && proposal.status !== 'accepted' && (
                    <DropdownMenuItem onClick={() => setLocation(`/proposals/${proposal.id}?action=send`)}>
                      <Send className="h-4 w-4" /> {proposal.status === 'draft' ? 'Send to Client' : 'Resend to Client'}
                    </DropdownMenuItem>
                  )}
                  {!showArchived && (proposal.total_amount || 0) > 0 && (
                    <DropdownMenuItem onClick={() => downloadPdf(proposal)}>
                      <Download className="h-4 w-4" /> Download PDF
                    </DropdownMenuItem>
                  )}
                  {!showArchived && (
                    <DropdownMenuItem onClick={() => duplicate(proposal.id)}>
                      <Copy className="h-4 w-4" /> Duplicate
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  {showArchived ? (
                    <DropdownMenuItem onClick={() => unarchive(proposal.id)}>
                      <ArchiveRestore className="h-4 w-4" /> Restore from Archive
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => archive(proposal.id)}>
                      <Archive className="h-4 w-4" /> Archive
                    </DropdownMenuItem>
                  )}
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
