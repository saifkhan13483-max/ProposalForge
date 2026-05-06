import { useEffect, useState } from 'react'
import { useRoute } from 'wouter'
import { api } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { Loader2, CheckCircle, MessageSquare, FileText, Sparkles, Download, Clock } from 'lucide-react'

interface PublicProposal {
  id: string
  title: string
  status: string
  client_name: string
  client_email: string
  business_name: string
  logo_url: string
  accent_color: string
  font_family: string
  plan: string
  content: Record<string, unknown>
  line_items: { description: string; quantity: number; unit_price: number }[]
  total_amount: number
  accepted_at: string
  personal_message: string
}

interface Comment {
  id: string
  comment: string
  commenter_name: string | null
  created_at: string
}

export function PublicProposal() {
  const [, params] = useRoute('/proposal/:token')
  const { toast } = useToast()
  const [proposal, setProposal] = useState<PublicProposal | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAccept, setShowAccept] = useState(false)
  const [showComment, setShowComment] = useState(false)
  const [signerName, setSignerName] = useState('')
  const [commenterName, setCommenterName] = useState('')
  const [comment, setComment] = useState('')
  const [accepting, setAccepting] = useState(false)
  const [commenting, setCommenting] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [declined, setDeclined] = useState(false)
  const [showDecline, setShowDecline] = useState(false)
  const [declineReason, setDeclineReason] = useState('')
  const [declining, setDeclining] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])

  useEffect(() => {
    if (!params?.token) return
    fetch(`/api/public/proposal/${params.token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); return }
        setProposal(data.proposal)
        if (data.proposal.status === 'accepted') setAccepted(true)
        if (data.proposal.status === 'declined') setDeclined(true)
      })
      .catch(() => setError('Failed to load proposal'))
      .finally(() => setLoading(false))

    fetch(`/api/public/proposal/${params.token}/comments`)
      .then(r => r.json())
      .then(data => { if (data.comments) setComments(data.comments) })
      .catch(() => {})
  }, [params?.token])

  async function accept() {
    if (!signerName.trim() || !params?.token) return
    setAccepting(true)
    try {
      const res = await fetch(`/api/public/proposal/${params.token}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signerName }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAccepted(true)
      setShowAccept(false)
      toast({ title: 'Proposal accepted!', description: 'The freelancer has been notified.' })
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setAccepting(false)
    }
  }

  async function decline() {
    if (!params?.token) return
    setDeclining(true)
    try {
      const res = await fetch(`/api/public/proposal/${params.token}/decline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: declineReason.trim() || null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setDeclined(true)
      setShowDecline(false)
      toast({ title: 'Proposal declined', description: 'The freelancer has been notified.' })
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setDeclining(false)
    }
  }

  async function addComment() {
    if (!comment.trim() || !params?.token) return
    setCommenting(true)
    try {
      await fetch(`/api/public/proposal/${params.token}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment, commenterName: commenterName.trim() || null }),
      })
      const newComment: Comment = {
        id: Date.now().toString(),
        comment,
        commenter_name: commenterName.trim() || null,
        created_at: new Date().toISOString(),
      }
      setComments(prev => [...prev, newComment])
      setShowComment(false)
      setComment('')
      setCommenterName('')
      toast({ title: 'Comment sent', description: 'The freelancer has been notified.' })
    } catch {
      toast({ title: 'Error', description: 'Failed to send comment', variant: 'destructive' })
    } finally {
      setCommenting(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex items-center justify-center p-8 text-center">
      <div>
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Proposal not found</h2>
        <p className="text-muted-foreground">{error}</p>
      </div>
    </div>
  )

  if (!proposal) return null

  const content = proposal.content || {}
  const accentColor = proposal.accent_color || '#6366f1'
  const isFreeTier = proposal.plan === 'free'

  const fontMap: Record<string, string> = {
    inter: 'Inter, system-ui, sans-serif',
    bricolage: 'Bricolage Grotesque, system-ui, sans-serif',
    georgia: 'Georgia, Times New Roman, serif',
  }
  const bodyFont = fontMap[proposal.font_family as string] || fontMap.inter

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Free tier branding banner */}
      {isFreeTier && (
        <div className="bg-indigo-600 text-white text-center py-2 px-4 text-sm font-medium">
          <span>This proposal was created with </span>
          <a href="/" className="underline font-semibold hover:text-indigo-200">ProposalForge</a>
          <span> — AI-powered proposals for freelancers. </span>
          <a href="/auth" className="underline hover:text-indigo-200">Try it free →</a>
        </div>
      )}

      {/* Header bar */}
      <div className="border-b bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {proposal.logo_url ? (
              <img src={proposal.logo_url} alt={proposal.business_name} className="h-8 w-auto object-contain" />
            ) : (
              <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: accentColor }}>
                <Sparkles className="h-4 w-4 text-white" />
              </div>
            )}
            <span className="font-semibold text-gray-900">{proposal.business_name || 'Proposal'}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={`/api/public/proposal/${params?.token}/pdf`}
              download
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md border bg-white hover:bg-gray-50 transition-colors text-gray-700"
              data-testid="button-download-pdf"
            >
              <Download className="h-4 w-4" /> Download PDF
            </a>
            {!accepted && !declined && (
              <>
                {proposal.plan === 'pro' && (
                  <Button variant="outline" size="sm" onClick={() => setShowComment(true)} className="gap-2">
                    <MessageSquare className="h-4 w-4" /> Request Changes
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => setShowDecline(true)} className="gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
                  Decline
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowAccept(true)}
                  className="gap-2"
                  style={{ backgroundColor: accentColor, color: 'white', borderColor: accentColor }}
                  data-testid="button-accept-proposal"
                >
                  <CheckCircle className="h-4 w-4" /> Accept Proposal
                </Button>
              </>
            )}
            {declined && (
              <span className="inline-flex items-center text-sm font-medium text-red-700 bg-red-100 px-3 py-1.5 rounded-full">
                Declined
              </span>
            )}
            {accepted && (
              <span className="inline-flex items-center gap-2 text-sm font-medium text-green-700 bg-green-100 px-3 py-1.5 rounded-full">
                <CheckCircle className="h-4 w-4" /> Accepted
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8" style={{ fontFamily: bodyFont }}>
        {/* Title */}
        <div className="bg-white rounded-2xl border p-8 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
                {proposal.title}
              </h1>
              <p className="text-gray-500">Prepared for {proposal.client_name}</p>
              {proposal.accepted_at && (
                <p className="text-sm text-green-600 mt-1">Accepted on {formatDate(proposal.accepted_at)}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(proposal.total_amount || 0)}</p>
            </div>
          </div>

          {proposal.personal_message && (
            <div className="mt-6 pt-6 border-t">
              <p className="text-gray-600 italic">"{proposal.personal_message}"</p>
              <p className="text-sm text-gray-400 mt-1">— {proposal.business_name}</p>
            </div>
          )}
        </div>

        {/* Executive Summary */}
        {content.executiveSummary && (
          <div className="bg-white rounded-2xl border p-8 shadow-sm">
            <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>Executive Summary</h2>
            <div className="prose prose-gray max-w-none" dangerouslySetInnerHTML={{ __html: content.executiveSummary as string }} />
          </div>
        )}

        {/* Scope of Work */}
        {content.scopeOfWork && (
          <div className="bg-white rounded-2xl border p-8 shadow-sm">
            <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>Scope of Work</h2>
            <div className="prose prose-gray max-w-none" dangerouslySetInnerHTML={{ __html: content.scopeOfWork as string }} />
          </div>
        )}

        {/* Deliverables */}
        {content.deliverables && (
          <div className="bg-white rounded-2xl border p-8 shadow-sm">
            <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>Deliverables</h2>
            <ul className="space-y-2">
              {(content.deliverables as string[]).map((d, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 mt-0.5 shrink-0" style={{ color: accentColor }} />
                  <span className="text-gray-700">{d}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Quote */}
        {proposal.line_items?.length > 0 && (
          <div className="bg-white rounded-2xl border p-8 shadow-sm">
            <h2 className="text-xl font-bold mb-6" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>Project Quote</h2>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left text-sm font-medium text-gray-500 pb-3">Description</th>
                  <th className="text-right text-sm font-medium text-gray-500 pb-3">Qty</th>
                  <th className="text-right text-sm font-medium text-gray-500 pb-3">Unit Price</th>
                  <th className="text-right text-sm font-medium text-gray-500 pb-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {proposal.line_items.map((item, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-3 text-gray-700">{item.description}</td>
                    <td className="py-3 text-right text-gray-500">{item.quantity}</td>
                    <td className="py-3 text-right text-gray-500">{formatCurrency(item.unit_price)}</td>
                    <td className="py-3 text-right font-medium">{formatCurrency(item.quantity * item.unit_price)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="pt-4 text-right font-bold text-lg">Total</td>
                  <td className="pt-4 text-right font-bold text-lg">{formatCurrency(proposal.total_amount || 0)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Terms */}
        {content.terms && (
          <div className="bg-white rounded-2xl border p-8 shadow-sm">
            <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>Terms & Conditions</h2>
            <div className="prose prose-gray max-w-none text-sm" dangerouslySetInnerHTML={{ __html: content.terms as string }} />
          </div>
        )}

        {/* Comment Thread — Pro only */}
        {proposal.plan === 'pro' && comments.length > 0 && (
          <div className="bg-white rounded-2xl border p-8 shadow-sm">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
              <MessageSquare className="h-5 w-5 text-gray-500" />
              Change Requests ({comments.length})
            </h2>
            <div className="space-y-4">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-sm font-medium text-gray-600">
                    {c.commenter_name ? c.commenter_name[0].toUpperCase() : '?'}
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-gray-900">
                        {c.commenter_name || 'Anonymous'}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(c.created_at)}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm">{c.comment}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        {!accepted && !declined && (
          <div className="bg-white rounded-2xl border p-8 shadow-sm text-center">
            <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>Ready to move forward?</h2>
            <p className="text-gray-500 mb-6">Accept this proposal to get started. An invoice will be generated automatically.</p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {proposal.plan === 'pro' && (
                <Button variant="outline" onClick={() => setShowComment(true)} className="gap-2">
                  <MessageSquare className="h-4 w-4" /> Request Changes
                </Button>
              )}
              <Button variant="outline" onClick={() => setShowDecline(true)} className="gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
                Decline
              </Button>
              <Button
                onClick={() => setShowAccept(true)}
                size="lg"
                className="gap-2"
                style={{ backgroundColor: accentColor, color: 'white', borderColor: accentColor }}
                data-testid="button-accept-proposal-bottom"
              >
                <CheckCircle className="h-5 w-5" /> Accept Proposal
              </Button>
            </div>
          </div>
        )}

        {accepted && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-green-800 mb-2">Proposal Accepted!</h2>
            <p className="text-green-700">Thank you! The team has been notified and will be in touch soon.</p>
          </div>
        )}

        {declined && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
            <h2 className="text-xl font-bold text-red-800 mb-2">Proposal Declined</h2>
            <p className="text-red-700">You have declined this proposal. The freelancer has been notified.</p>
          </div>
        )}

        {/* Powered by — free tier only */}
        {isFreeTier && (
          <div className="text-center py-4 border-t">
            <p className="text-xs text-gray-400">
              Powered by{' '}
              <a href="/" className="text-gray-500 hover:text-gray-700 font-medium">ProposalForge</a>
              {' '}— AI-powered proposals for freelancers.{' '}
              <a href="/auth" className="text-indigo-600 hover:underline font-medium">Create your free account →</a>
            </p>
          </div>
        )}
      </div>

      {/* Decline dialog */}
      <Dialog open={showDecline} onOpenChange={setShowDecline}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Proposal</DialogTitle>
            <DialogDescription>Let the freelancer know you're not moving forward with this proposal.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label>Reason (optional)</Label>
              <Textarea
                placeholder="The budget doesn't fit our current plans..."
                value={declineReason}
                onChange={e => setDeclineReason(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDecline(false)}>Cancel</Button>
            <Button
              onClick={decline}
              disabled={declining}
              variant="destructive"
              className="gap-2"
            >
              {declining ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Decline Proposal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Accept dialog */}
      <Dialog open={showAccept} onOpenChange={setShowAccept}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept Proposal</DialogTitle>
            <DialogDescription>By typing your name below, you agree to the terms and accept this proposal.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input
                placeholder="Your full name"
                value={signerName}
                onChange={e => setSignerName(e.target.value)}
                data-testid="input-signer-name"
              />
            </div>
            <p className="text-xs text-gray-500">This will serve as your electronic signature.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAccept(false)}>Cancel</Button>
            <Button
              onClick={accept}
              disabled={accepting || !signerName.trim()}
              className="gap-2"
              style={{ backgroundColor: accentColor }}
              data-testid="button-confirm-accept"
            >
              {accepting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Accept Proposal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Comment dialog */}
      <Dialog open={showComment} onOpenChange={setShowComment}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Changes</DialogTitle>
            <DialogDescription>Send feedback to the freelancer. They'll review and update the proposal.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label>Your name (optional)</Label>
              <Input
                placeholder="Jane Smith"
                value={commenterName}
                onChange={e => setCommenterName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Feedback *</Label>
              <Textarea
                placeholder="Please clarify the timeline for Phase 2..."
                value={comment}
                onChange={e => setComment(e.target.value)}
                className="min-h-[100px]"
                data-testid="textarea-comment"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowComment(false)}>Cancel</Button>
            <Button onClick={addComment} disabled={commenting || !comment.trim()} data-testid="button-send-comment">
              {commenting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Feedback'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
