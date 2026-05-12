import { useState } from 'react'
import { Link } from 'wouter'
import { useSEO } from '@/hooks/useSEO'
import { sendFirebasePasswordReset } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Sparkles, Loader2, ArrowLeft, Mail } from 'lucide-react'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const { toast } = useToast()

  useSEO({ title: 'Reset Password', noindex: true })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await sendFirebasePasswordReset(email)
      setSent(true)
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code
      let message = 'Failed to send reset email. Please try again.'
      if (code === 'auth/user-not-found') {
        // Show success anyway to prevent email enumeration
        setSent(true)
        return
      } else if (code === 'auth/invalid-email') {
        message = 'Please enter a valid email address.'
      } else if (code === 'auth/too-many-requests') {
        message = 'Too many attempts. Please try again later.'
      }
      toast({ title: 'Error', description: message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-8">
          <img src="/logo.png" alt="ProposalForge" className="h-9 w-9 object-contain shrink-0" />
          <span className="font-bold text-xl" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>ProposalForge</span>
        </div>

        <Card className="border-0 shadow-none">
          <CardHeader className="px-0 pb-6">
            <CardTitle className="text-2xl" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
              Reset your password
            </CardTitle>
            <CardDescription className="text-base">
              Enter your email and we'll send you a reset link.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            {sent ? (
              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
                  <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center">
                    <Mail className="h-7 w-7 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">Check your inbox</p>
                    <p className="text-muted-foreground text-sm mt-1">
                      If an account exists for <strong>{email}</strong>, a password reset link has been sent.
                    </p>
                  </div>
                </div>
                <Link href="/auth">
                  <Button variant="outline" className="w-full gap-2">
                    <ArrowLeft className="h-4 w-4" /> Back to sign in
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <Button type="submit" className="w-full gap-2" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  Send reset link
                </Button>
                <Link href="/auth">
                  <Button variant="ghost" className="w-full gap-2 mt-1">
                    <ArrowLeft className="h-4 w-4" /> Back to sign in
                  </Button>
                </Link>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
