import { useState } from 'react'
import { useLocation } from 'wouter'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, Loader2, ArrowRight, FileText, Zap, CheckCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function Auth() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, register } = useAuth()
  const [, setLocation] = useLocation()
  const { toast } = useToast()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await register(email, password, businessName)
      }
      setLocation('/dashboard')
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col w-1/2 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex items-center gap-3 mb-16">
          <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-white font-bold text-xl" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>ProposalForge</span>
        </div>

        <div className="relative z-10 flex-1">
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
            Turn descriptions<br />into deals.
          </h1>
          <p className="text-slate-400 text-lg mb-12 leading-relaxed">
            AI-powered proposals, quotes, and invoices — from idea to client-ready in under 60 seconds.
          </p>

          <div className="space-y-5">
            {[
              { icon: Zap, text: 'Generate professional proposals with AI in seconds' },
              { icon: FileText, text: 'Send branded proposals with one-click accept' },
              { icon: CheckCircle, text: 'Auto-create invoices when proposals are accepted' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="h-4 w-4 text-indigo-400" />
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 pt-8 border-t border-white/10">
          <p className="text-slate-500 text-sm">
            Join thousands of freelancers winning more clients.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-xl" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>ProposalForge</span>
          </div>

          <Card className="border-0 shadow-none">
            <CardHeader className="px-0 pb-6">
              <CardTitle className="text-2xl" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
                {mode === 'login' ? 'Welcome back' : 'Create your account'}
              </CardTitle>
              <CardDescription className="text-base">
                {mode === 'login' ? "Sign in to your ProposalForge account" : "Start winning more clients today — free forever"}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'register' && (
                  <div className="space-y-2">
                    <Label htmlFor="business-name">Business name</Label>
                    <Input
                      id="business-name"
                      data-testid="input-business-name"
                      placeholder="Acme Studio"
                      value={businessName}
                      onChange={e => setBusinessName(e.target.value)}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    data-testid="input-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    data-testid="input-password"
                    type="password"
                    placeholder="Min 8 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-10 gap-2"
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

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                  <button
                    onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                    className="text-primary font-medium hover:underline"
                    data-testid="link-toggle-mode"
                  >
                    {mode === 'login' ? 'Sign up free' : 'Sign in'}
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
