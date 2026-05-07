import { Link } from 'wouter'
import { Button } from '@/components/ui/button'
import {
  Sparkles, FileText, CheckCircle, Zap, ArrowRight, Star,
  Clock, DollarSign, Send, Shield, TrendingUp, Users, BarChart3,
  Quote
} from 'lucide-react'

const stats = [
  { value: '2,400+', label: 'Freelancers using ProposalForge' },
  { value: '$4.2M', label: 'In proposals generated' },
  { value: '68%', label: 'Average acceptance rate' },
  { value: '58s', label: 'Average proposal generation time' },
]

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Brand Designer',
    avatar: 'SC',
    color: 'bg-purple-500',
    quote: 'I used to spend 2 hours on every proposal. Now it takes me 5 minutes to review and send. My acceptance rate went from 40% to 70% in the first month.',
    stars: 5,
  },
  {
    name: 'Marcus Rivera',
    role: 'Full-Stack Developer',
    avatar: 'MR',
    color: 'bg-blue-500',
    quote: 'The AI-generated scope of work sections are genuinely impressive. Clients often tell me my proposals look more professional than agencies they\'ve hired.',
    stars: 5,
  },
  {
    name: 'Priya Nair',
    role: 'Content Strategist',
    avatar: 'PN',
    color: 'bg-emerald-500',
    quote: 'Auto-invoicing on acceptance is a game changer. I don\'t have to chase payments anymore — Stripe handles everything automatically.',
    stars: 5,
  },
]

const features = [
  { icon: Sparkles, title: 'AI Proposal Writing', desc: 'Gemini AI generates complete, professional proposals tailored to your project type and scope.', color: 'bg-indigo-50 text-indigo-600' },
  { icon: FileText, title: 'Rich Text Editor', desc: 'Customize every section with an inline editor. Regenerate individual sections with one click.', color: 'bg-purple-50 text-purple-600' },
  { icon: DollarSign, title: 'Auto Invoicing', desc: 'When a client accepts, an invoice is created automatically. Collect payment via Stripe Checkout.', color: 'bg-emerald-50 text-emerald-600' },
  { icon: CheckCircle, title: 'E-Signature Acceptance', desc: 'Clients accept proposals with a typed signature on a branded acceptance page — no DocuSign needed.', color: 'bg-green-50 text-green-600' },
  { icon: Clock, title: 'Real-time Tracking', desc: 'Know when your client views the proposal. Get notified on view, accept, and comment events.', color: 'bg-orange-50 text-orange-600' },
  { icon: Shield, title: 'Branding Controls', desc: 'Upload your logo, set your accent color, and make every proposal look like it came from a top agency.', color: 'bg-blue-50 text-blue-600' },
  { icon: Zap, title: 'PDF Export', desc: 'Download a print-ready PDF of any proposal for offline sharing or record keeping.', color: 'bg-yellow-50 text-yellow-600' },
  { icon: BarChart3, title: 'Analytics Dashboard', desc: 'Track revenue trends, proposal pipeline, acceptance rates, and outstanding invoices at a glance.', color: 'bg-cyan-50 text-cyan-600' },
  { icon: Send, title: 'Email Delivery', desc: 'Send proposals directly to clients via email with a personal message and one-click accept link.', color: 'bg-rose-50 text-rose-600' },
]

export function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
              ProposalForge
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-slate-900 transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/auth">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/auth">
              <Button size="sm" className="gap-1.5 shadow-sm">
                Get started free <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-900 text-white">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/2 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-indigo-600/20 rounded-full blur-3xl" />
          <div className="absolute top-1/4 -left-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
          <div className="absolute top-1/3 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
          {/* Grid overlay */}
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }} />
        </div>
        <div className="relative max-w-5xl mx-auto px-6 py-28 md:py-40 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 rounded-full px-4 py-1.5 text-sm font-medium mb-8">
            <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
            AI-powered in under 60 seconds
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-[1.05]" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
            Win clients with<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300">
              proposals that close.
            </span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            Describe your project and let AI generate a polished, branded proposal with a quote and invoice — ready to send in under 60 seconds.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth">
              <Button size="lg" className="h-12 px-8 gap-2 text-base bg-indigo-500 hover:bg-indigo-400 border-0 shadow-lg shadow-indigo-900/50">
                <Sparkles className="h-5 w-5" />
                Start for free
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" className="h-12 px-8 text-base bg-white/10 border border-white/20 text-white hover:bg-white/20 hover:text-white gap-2">
                <ArrowRight className="h-4 w-4" />
                Try the live demo
              </Button>
            </Link>
          </div>
          <p className="mt-5 text-sm text-slate-500">Free forever · No credit card required · 3 proposals/month on free tier</p>
        </div>

        {/* Dashboard preview mockup */}
        <div className="relative max-w-5xl mx-auto px-6 pb-0">
          <div className="relative rounded-t-2xl border border-white/10 bg-slate-800/60 backdrop-blur-sm overflow-hidden shadow-2xl shadow-indigo-900/40">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-slate-900/50">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-500/70" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
                <div className="h-3 w-3 rounded-full bg-green-500/70" />
              </div>
              <div className="flex-1 mx-4 h-6 rounded-md bg-slate-700/60 flex items-center px-3">
                <span className="text-xs text-slate-400">app.proposalforge.com/dashboard</span>
              </div>
            </div>
            {/* Dashboard UI mockup */}
            <div className="p-5 space-y-4 min-h-[280px]">
              {/* Stats row */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Monthly Revenue', value: '$8,450', color: 'text-emerald-400', icon: '💰' },
                  { label: 'Outstanding', value: '$2,100', color: 'text-orange-400', icon: '⏳' },
                  { label: 'Acceptance Rate', value: '72%', color: 'text-blue-400', icon: '📈' },
                  { label: 'Total Clients', value: '24', color: 'text-purple-400', icon: '👥' },
                ].map(s => (
                  <div key={s.label} className="bg-slate-700/50 rounded-xl p-3 border border-white/5">
                    <p className="text-xs text-slate-400 mb-1">{s.label}</p>
                    <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>
              {/* Chart + activity row */}
              <div className="grid grid-cols-3 gap-3">
                {/* Chart mockup */}
                <div className="col-span-2 bg-slate-700/50 rounded-xl p-3 border border-white/5">
                  <p className="text-xs text-slate-400 mb-3">Revenue (last 6 months)</p>
                  <div className="flex items-end gap-2 h-20">
                    {[35, 52, 40, 68, 75, 90].map((h, i) => (
                      <div key={i} className="flex-1 flex flex-col justify-end">
                        <div
                          className="rounded-sm bg-gradient-to-t from-indigo-500 to-indigo-400"
                          style={{ height: `${h}%` }}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-1">
                    {['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'].map(m => (
                      <span key={m} className="text-[9px] text-slate-500">{m}</span>
                    ))}
                  </div>
                </div>
                {/* Pipeline mockup */}
                <div className="bg-slate-700/50 rounded-xl p-3 border border-white/5">
                  <p className="text-xs text-slate-400 mb-3">Pipeline</p>
                  <div className="space-y-2">
                    {[
                      { label: 'Accepted', pct: 72, color: 'bg-green-500' },
                      { label: 'Sent', pct: 48, color: 'bg-blue-500' },
                      { label: 'Viewed', pct: 30, color: 'bg-purple-500' },
                      { label: 'Draft', pct: 15, color: 'bg-slate-500' },
                    ].map(p => (
                      <div key={p.label}>
                        <div className="flex justify-between text-[9px] text-slate-400 mb-0.5">
                          <span>{p.label}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-600 overflow-hidden">
                          <div className={`h-full rounded-full ${p.color}`} style={{ width: `${p.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-b bg-slate-50 py-12">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-3xl font-extrabold text-slate-900 mb-1" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>{s.value}</p>
                <p className="text-sm text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof strip */}
      <section className="border-b bg-white py-5">
        <div className="max-w-5xl mx-auto px-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
          {[
            'Trusted by freelancers worldwide',
            '60-second proposal generation',
            'Stripe-powered payments',
            'Electronic signatures',
          ].map((text, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-slate-600 font-medium">
              <CheckCircle className="h-4 w-4 text-indigo-500" />
              {text}
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <span className="text-xs font-bold tracking-widest text-indigo-600 uppercase mb-4 block">How it works</span>
          <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
            From idea to signed deal in minutes
          </h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            ProposalForge handles the writing so you can focus on winning the work.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: '01',
              icon: FileText,
              title: 'Describe your project',
              desc: 'Fill in a short intake form — project type, scope, budget, and timeline. The more detail, the better the output.',
              color: 'bg-indigo-50 text-indigo-600',
              border: 'border-indigo-100',
            },
            {
              step: '02',
              icon: Sparkles,
              title: 'AI generates your proposal',
              desc: 'Gemini AI writes a polished executive summary, scope of work, deliverables list, and itemized quote — in seconds.',
              color: 'bg-purple-50 text-purple-600',
              border: 'border-purple-100',
            },
            {
              step: '03',
              icon: Send,
              title: 'Send and get paid',
              desc: 'Email the proposal link to your client. They accept with an e-signature, and an invoice is auto-generated for Stripe payment.',
              color: 'bg-emerald-50 text-emerald-600',
              border: 'border-emerald-100',
            },
          ].map(({ step, icon: Icon, title, desc, color, border }) => (
            <div key={step} className={`relative flex flex-col h-full p-7 rounded-2xl border-2 ${border} bg-white hover:shadow-lg transition-all duration-200 group`}>
              <div className="flex items-center gap-3 mb-5">
                <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${color} shadow-sm`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold text-slate-400 tracking-widest">STEP {step}</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">{title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-slate-50 py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-xs font-bold tracking-widest text-indigo-600 uppercase mb-4 block">Features</span>
            <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
              Everything a freelancer needs
            </h2>
            <p className="text-slate-500 text-lg">One tool for proposals, invoices, clients, and payments.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="bg-white rounded-xl border p-5 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-sm mb-1.5 group-hover:text-indigo-600 transition-colors">{title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-xs font-bold tracking-widest text-indigo-600 uppercase mb-4 block">Testimonials</span>
            <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
              Freelancers love ProposalForge
            </h2>
            <p className="text-slate-500 text-lg">Don't take our word for it.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="relative bg-white border rounded-2xl p-6 hover:shadow-lg transition-all duration-200 flex flex-col">
                <Quote className="h-6 w-6 text-indigo-200 mb-3" />
                <p className="text-slate-600 text-sm leading-relaxed flex-1 mb-5">"{t.quote}"</p>
                <div className="flex items-center gap-3 pt-4 border-t">
                  <div className={`h-9 w-9 rounded-full ${t.color} flex items-center justify-center text-white font-bold text-xs shrink-0`}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                  <div className="ml-auto flex gap-0.5">
                    {Array.from({ length: t.stars }).map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-slate-50 py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-xs font-bold tracking-widest text-indigo-600 uppercase mb-4 block">Pricing</span>
            <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
              Simple, transparent pricing
            </h2>
            <p className="text-slate-500 text-lg">Start free. Upgrade when you're ready.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {[
              {
                name: 'Free',
                price: '$0',
                period: 'forever',
                desc: 'Perfect for freelancers just getting started.',
                features: ['3 AI proposals / month', 'Unlimited clients & invoices', 'Stripe payment collection', 'E-signature acceptance', 'PDF export', 'Analytics dashboard'],
                cta: 'Get started free',
                highlight: false,
              },
              {
                name: 'Pro',
                price: '$19',
                period: 'per month',
                desc: 'For serious freelancers who want to impress.',
                features: ['Unlimited AI proposals', 'Remove ProposalForge branding', 'Client comment threads', 'Priority support', 'All future features', 'Early access to new AI models'],
                cta: 'Start Pro',
                highlight: true,
              },
            ].map(plan => (
              <div key={plan.name} className={`relative rounded-2xl border p-8 bg-white ${plan.highlight ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-xl shadow-indigo-100' : 'shadow-sm'}`}>
                {plan.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow">Most Popular</span>
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-4xl font-extrabold">{plan.price}</span>
                    <span className="text-slate-500 text-sm">/ {plan.period}</span>
                  </div>
                  <p className="text-sm text-slate-500">{plan.desc}</p>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm">
                      <CheckCircle className="h-4 w-4 text-indigo-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/auth">
                  <Button
                    className="w-full"
                    variant={plan.highlight ? 'default' : 'outline'}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 text-white py-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="h-16 w-16 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center mx-auto mb-6">
            <Sparkles className="h-8 w-8 text-indigo-300" />
          </div>
          <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
            Start winning more clients today
          </h2>
          <p className="text-slate-300 text-lg mb-8 max-w-xl mx-auto">
            Join 2,400+ freelancers who use ProposalForge to generate professional proposals in under 60 seconds.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth">
              <Button size="lg" className="h-12 px-8 gap-2 text-base bg-indigo-500 hover:bg-indigo-400 border-0 shadow-lg">
                <Sparkles className="h-5 w-5" />
                Get started for free
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="outline" className="h-12 px-8 text-base border-white/20 text-white hover:bg-white/10 hover:text-white gap-2 bg-transparent">
                Try the live demo
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-slate-500">No credit card required · Cancel anytime</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-10">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-bold text-slate-800">ProposalForge</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <a href="#features" className="hover:text-slate-800 transition-colors">Features</a>
              <a href="#pricing" className="hover:text-slate-800 transition-colors">Pricing</a>
              <Link href="/demo" className="hover:text-slate-800 transition-colors">Demo</Link>
            </div>
            <p className="text-sm text-slate-400">© {new Date().getFullYear()} ProposalForge. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
