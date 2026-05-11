import { useState, useEffect } from 'react'
import { useSearch, useLocation } from 'wouter'
import { useSEO } from '@/hooks/useSEO'
import { verifyFirebasePasswordResetCode, confirmFirebasePasswordReset } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Sparkles, Loader2, CheckCircle, ArrowLeft, AlertCircle } from 'lucide-react'

export function ResetPassword() {
  const search = useSearch()
  const [, setLocation] = useLocation()
  const { toast } = useToast()

  const params = new URLSearchParams(search)
  const oobCode = params.get('oobCode') || ''
  const mode = params.get('mode') || ''

  useSEO({ title: 'Set New Password', noindex: true })

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [codeValid, setCodeValid] = useState<boolean | null>(null)

  useEffect(() => {
    if (!oobCode || mode !== 'resetPassword') {
      setCodeValid(false)
      return
    }
    verifyFirebasePasswordResetCode(oobCode)
      .then(() => setCodeValid(true))
      .catch(() => setCodeValid(false))
  }, [oobCode, mode])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      toast({ title: 'Passwords do not match', variant: 'destructive' })
      return
    }
    if (password.length < 8) {
      toast({ title: 'Password must be at least 8 characters', variant: 'destructive' })
      return
    }
    setLoading(true)
    try {
      await confirmFirebasePasswordReset(oobCode, password)
      setDone(true)
      setTimeout(() => setLocation('/auth'), 3000)
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code
      let message = 'Failed to reset password. Please try again.'
      if (code === 'auth/expired-action-code') {
        message = 'This reset link has expired. Please request a new one.'
      } else if (code === 'auth/invalid-action-code') {
        message = 'This reset link is invalid or has already been used.'
      } else if (code === 'auth/weak-password') {
        message = 'Password must be at least 6 characters.'
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
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-xl" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>ProposalForge</span>
        </div>

        <Card className="border-0 shadow-none">
          <CardHeader className="px-0 pb-6">
            <CardTitle className="text-2xl" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
              Set new password
            </CardTitle>
            <CardDescription className="text-base">
              Choose a strong password for your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            {codeValid === null && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {codeValid === false && (
              <div className="space-y-4">
                <div className="flex flex-col items-center py-8 text-center gap-3">
                  <div className="h-14 w-14 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertCircle className="h-7 w-7 text-red-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">Link expired or invalid</p>
                    <p className="text-muted-foreground text-sm mt-1">
                      This reset link is no longer valid. Please request a new one.
                    </p>
                  </div>
                </div>
                <Button variant="outline" className="w-full" onClick={() => setLocation('/forgot-password')}>
                  Request new link
                </Button>
              </div>
            )}

            {codeValid === true && !done && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Min 8 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={8}
                    autoFocus
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirm password</Label>
                  <Input
                    id="confirm"
                    type="password"
                    placeholder="Repeat your password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Set new password
                </Button>
                <Button variant="ghost" className="w-full gap-2" type="button" onClick={() => setLocation('/auth')}>
                  <ArrowLeft className="h-4 w-4" /> Back to sign in
                </Button>
              </form>
            )}

            {done && (
              <div className="flex flex-col items-center py-8 text-center gap-3">
                <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-7 w-7 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-lg">Password updated!</p>
                  <p className="text-muted-foreground text-sm mt-1">Redirecting you to sign in...</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
