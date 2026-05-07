import { useState, useEffect } from 'react'
import { useLocation } from 'wouter'
import { useAuth } from '@/contexts/AuthContext'
import { useSEO } from '@/hooks/useSEO'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, Loader2, ArrowRight, FileText, Zap, CheckCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { setAuthToken } from '@/lib/api'

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

export function Auth() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, register, refreshUser } = useAuth()
  const [, setLocation] = useLocation()
  const { toast } = useToast()

  useSEO({ title: 'Sign In', noindex: true })

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const error = params.get('error')
    if (error === 'google_not_configured') {
      toast({ title: 'Google login not configured', description: 'Please use email/password login.', variant: 'destructive' })
    } else if (error === 'google_denied') {
      toast({ title: 'Google sign-in cancelled', description: 'You can try again or use email/password.', variant: 'destructive' })
    } else if (error === 'google_failed') {
      toast({ title: 'Google sign-in failed', description: 'Please try again or use email/password.', variant: 'destructive' })
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(email, password)
        setLocation('/dashboard')
      } else {
        await register(email, password, businessName)
        setLocation('/onboarding')
      }
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  function handleGoogleLogin() {
    window.location.href = '/api/auth/google'
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — dark side: light text, bright accents */}
      <div className="hidden lg:flex flex-col w-1/2 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-12 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-violet-400/20 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex items-center gap-3 mb-16">
          <div className="h-10 w-10 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/40">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-white font-bold text-xl" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>ProposalForge</span>
        </div>

        <div className="relative z-10 flex-1">
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
            Turn descriptions<br />into deals.
          </h1>
          <p className="text-slate-200 text-lg mb-12 leading-relaxed">
            AI-powered proposals, quotes, and invoices — from idea to client-ready in under 60 seconds.
          </p>

          <div className="space-y-5">
            {[
              { icon: Zap, text: 'Generate professional proposals with AI in seconds' },
              { icon: FileText, text: 'Send branded proposals with one-click accept' },
              { icon: CheckCircle, text: 'Auto-create invoices when proposals are accepted' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-indigo-400/25 border border-indigo-300/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="h-4 w-4 text-indigo-200" />
                </div>
                <p className="text-slate-100 text-sm leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 pt-8 border-t border-white/15">
          <p className="text-slate-300 text-sm">
            Join thousands of freelancers winning more clients.
          </p>
        </div>
      </div>

      {/* Right panel — light side: dark text, bold labels, deep accents */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-900" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>ProposalForge</span>
          </div>

          <Card className="border-0 shadow-none">
            <CardHeader className="px-0 pb-6">
              <CardTitle className="text-2xl text-slate-900" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
                {mode === 'login' ? 'Welcome back' : 'Create your account'}
              </CardTitle>
              <CardDescription className="text-base text-slate-600">
                {mode === 'login' ? "Sign in to your ProposalForge account" : "Start winning more clients today — free forever"}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <Button
                type="button"
                variant="outline"
                className="w-full h-10 gap-2 mb-4 border-slate-300 text-slate-800 font-medium hover:bg-slate-50 hover:border-slate-400"
                onClick={handleGoogleLogin}
              >
                <GoogleIcon />
                Continue with Google
              </Button>

              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-400 font-medium tracking-wider">or</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'register' && (
                  <div className="space-y-2">
                    <Label htmlFor="business-name" className="text-slate-800 font-semibold text-sm">Business name</Label>
                    <Input
                      id="business-name"
                      data-testid="input-business-name"
                      placeholder="Acme Studio"
                      value={businessName}
                      onChange={e => setBusinessName(e.target.value)}
                      className="border-slate-300 text-slate-900 placeholder:text-slate-400 focus-visible:ring-indigo-500"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-800 font-semibold text-sm">Email</Label>
                  <Input
                    id="email"
                    data-testid="input-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="border-slate-300 text-slate-900 placeholder:text-slate-400 focus-visible:ring-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-800 font-semibold text-sm">Password</Label>
                  <Input
                    id="password"
                    data-testid="input-password"
                    type="password"
                    placeholder="Min 8 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="border-slate-300 text-slate-900 placeholder:text-slate-400 focus-visible:ring-indigo-500"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-10 gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm shadow-indigo-200"
                  disabled={loading}
                  data-testid="button-submit"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      {mode === 'login' ? 'Sign in' : 'Create account'}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 space-y-3 text-center">
                <p className="text-sm text-slate-500">
                  {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                  <button
                    onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                    className="text-indigo-600 font-semibold hover:text-indigo-700 hover:underline"
                    data-testid="link-toggle-mode"
                  >
                    {mode === 'login' ? 'Sign up free' : 'Sign in'}
                  </button>
                </p>
                {mode === 'login' && (
                  <p className="text-sm">
                    <a href="/forgot-password" className="text-slate-400 hover:text-slate-700 hover:underline">
                      Forgot your password?
                    </a>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
