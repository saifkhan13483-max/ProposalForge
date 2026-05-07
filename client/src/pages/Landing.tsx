import { Link } from 'wouter'
import { Button } from '@/components/ui/button'
import {
  Sparkles, FileText, CheckCircle, Zap, ArrowRight, Star,
  Clock, DollarSign, Send, Shield, TrendingUp, Users, BarChart3,
  Quote, Menu, X
} from 'lucide-react'
import { useState } from 'react'

const stats = [
  { value: '2,400+', label: 'Freelancers' },
  { value: '$4.2M', label: 'Proposals sent' },
  { value: '68%', label: 'Acceptance rate' },
  { value: '58s', label: 'Avg. generation' },
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
  {
    icon: Sparkles,
    title: 'AI Proposal Writing',
    desc: 'AI generates complete, professional proposals tailored to your project type and scope — in under 60 seconds.',
    gradient: 'from-indigo-500 to-violet-600',
    glow: 'group-hover:shadow-indigo-500/20',
  },
  {
    icon: FileText,
    title: 'Rich Text Editor',
    desc: 'Customize every section with an inline editor. Regenerate individual sections with a single click.',
    gradient: 'from-violet-500 to-purple-600',
    glow: 'group-hover:shadow-violet-500/20',
  },
  {
    icon: DollarSign,
    title: 'Auto Invoicing',
    desc: 'When a client accepts, an invoice is created automatically. Collect payment via Stripe Checkout.',
    gradient: 'from-emerald-500 to-teal-600',
    glow: 'group-hover:shadow-emerald-500/20',
  },
  {
    icon: CheckCircle,
    title: 'E-Signature Acceptance',
    desc: 'Clients accept proposals with a typed signature on a branded page — no DocuSign or extra tools needed.',
    gradient: 'from-blue-500 to-cyan-600',
    glow: 'group-hover:shadow-blue-500/20',
  },
  {
    icon: Clock,
    title: 'Real-time Tracking',
    desc: 'Know the moment your client views the proposal. Get notified on every view, accept, and comment.',
    gradient: 'from-orange-500 to-amber-500',
    glow: 'group-hover:shadow-orange-500/20',
  },
  {
    icon: Shield,
    title: 'Branding Controls',
    desc: 'Upload your logo, set your accent color, and make every proposal look like it came from a top agency.',
    gradient: 'from-rose-500 to-pink-600',
    glow: 'group-hover:shadow-rose-500/20',
  },
  {
    icon: Zap,
    title: 'PDF Export',
    desc: 'Download a print-ready PDF of any proposal or invoice for offline sharing or record keeping.',
    gradient: 'from-yellow-500 to-orange-500',
    glow: 'group-hover:shadow-yellow-500/20',
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    desc: 'Track revenue trends, proposal pipeline, acceptance rates, and outstanding invoices at a glance.',
    gradient: 'from-cyan-500 to-sky-600',
    glow: 'group-hover:shadow-cyan-500/20',
  },
  {
    icon: Send,
    title: 'Email Delivery',
    desc: 'Send proposals directly to clients via email with a personal message and one-click accept link.',
    gradient: 'from-pink-500 to-rose-600',
    glow: 'group-hover:shadow-pink-500/20',
  },
]

export function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm shrink-0">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
              ProposalForge
            </span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-slate-900 transition-colors">Pricing</a>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/auth">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/auth">
              <Button size="sm" className="gap-1.5 shadow-sm">
                Get started free <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          {/* Mobile: CTA + hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <Link href="/auth">
              <Button size="sm" className="gap-1 text-xs px-3 h-8">
                Get started
              </Button>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-white px-4 py-4 space-y-1">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              How it works
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Pricing
            </a>
            <div className="pt-2 border-t mt-2">
              <Link href="/auth" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full justify-start">Sign in</Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#0a0a14] text-white sm:min-h-[90vh] flex items-center">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-700/15 rounded-full blur-[80px]" />
          <div className="absolute top-1/3 right-0 w-72 h-72 bg-blue-700/15 rounded-full blur-[80px]" />
          {/* Dot grid */}
          <div className="absolute inset-0 opacity-[0.07]" style={{
            backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '32px 32px'
          }} />
        </div>

        <div className="relative w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-20 md:py-0">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16">

            {/* Left: Copy */}
            <div className="flex-1 text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 rounded-full px-3 py-1 text-xs font-medium mb-3 sm:mb-6">
                <Sparkles className="h-3 w-3 shrink-0" />
                AI-powered · Ready in 60 seconds
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight leading-[1.1] mb-3 sm:mb-6" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
                Close more clients with{' '}
                <span className="relative inline-block">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400">
                    AI proposals
                  </span>
                  <span className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-indigo-400/60 via-violet-400/60 to-fuchsia-400/0" />
                </span>
              </h1>

              <p className="text-sm sm:text-lg text-slate-400 max-w-lg mx-auto lg:mx-0 mb-4 sm:mb-8 leading-relaxed">
                Describe your project and get a fully written, branded proposal with scope, deliverables, and pricing — in under a minute.
              </p>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-2.5 sm:gap-3 mb-4 sm:mb-8">
                <Link href="/auth" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto h-10 sm:h-12 px-8 gap-2 text-sm sm:text-base bg-indigo-600 hover:bg-indigo-500 border-0 shadow-xl shadow-indigo-900/60 font-semibold">
                    <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Start for free
                  </Button>
                </Link>
                <a href="#how-it-works" className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 group">
                  See how it works <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </a>
              </div>

              {/* Trust row */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-4 gap-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {['SC', 'MR', 'PN', 'JK'].map((initials, i) => (
                      <div key={i} className={`h-6 w-6 sm:h-7 sm:w-7 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] font-bold text-white ring-2 ring-[#0a0a14] ${['bg-purple-500','bg-blue-500','bg-emerald-500','bg-rose-500'][i]}`}>
                        {initials}
                      </div>
                    ))}
                  </div>
                  <span className="text-xs text-slate-400">2,400+ freelancers</span>
                </div>
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="text-xs text-slate-400 ml-1">4.9 / 5</span>
                </div>
                <span className="text-xs text-slate-500">No credit card</span>
              </div>
            </div>

            {/* Mobile-only: compact proof strip */}
            <div className="lg:hidden w-full mt-1">
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                {/* Header bar */}
                <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 bg-white/5">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 rounded-full bg-red-500/70" />
                    <div className="h-2 w-2 rounded-full bg-yellow-500/70" />
                    <div className="h-2 w-2 rounded-full bg-green-500/70" />
                  </div>
                  <span className="text-[10px] text-slate-500 flex-1 text-center">Proposal Preview</span>
                  <div className="inline-flex items-center gap-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-full px-2 py-0.5 text-[10px] font-medium">
                    <CheckCircle className="h-2.5 w-2.5" /> Accepted
                  </div>
                </div>
                {/* Two-column body */}
                <div className="p-3 grid grid-cols-2 gap-2">
                  <div className="bg-white/5 rounded-xl p-2.5">
                    <div className="text-[9px] font-semibold text-indigo-300 uppercase tracking-widest mb-2">Scope of Work</div>
                    <div className="space-y-1">
                      {[72, 55, 80, 42].map((w, i) => (
                        <div key={i} className="h-1.5 bg-white/15 rounded-full" style={{ width: `${w}%` }} />
                      ))}
                    </div>
                  </div>
                  <div className="bg-indigo-600/20 border border-indigo-500/30 rounded-xl p-2.5">
                    <div className="text-[9px] font-semibold text-indigo-300 uppercase tracking-widest mb-2">Pricing</div>
                    <div className="space-y-1.5">
                      {[['Design', '$1,200'], ['Dev', '$6,500'], ['QA', '$800']].map(([label, price]) => (
                        <div key={label} className="flex items-center justify-between">
                          <div className="h-1 bg-white/20 rounded-full w-12" />
                          <span className="text-[10px] font-semibold text-white/80">{price}</span>
                        </div>
                      ))}
                      <div className="border-t border-white/10 pt-1.5 flex justify-between">
                        <span className="text-[10px] text-white/50">Total</span>
                        <span className="text-[11px] font-bold text-indigo-300">$8,500</span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Generation bar */}
                <div className="px-3 pb-3">
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
                    <span className="text-[10px] text-slate-400 flex-1">Generated by AI in <span className="text-indigo-300 font-medium">47 seconds</span></span>
                    <Sparkles className="h-2.5 w-2.5 text-indigo-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Proposal card mockup (desktop only) */}
            <div className="hidden lg:block flex-1 w-full max-w-md lg:max-w-none relative">
              {/* Glow behind card */}
              <div className="absolute inset-0 bg-indigo-600/20 blur-3xl rounded-3xl scale-90" />

              <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                {/* Card header */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-white/5">
                  <div className="flex gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                    <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
                    <div className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
                  </div>
                  <div className="flex-1 text-center">
                    <span className="text-xs text-slate-500">Proposal Preview</span>
                  </div>
                </div>

                {/* Card body */}
                <div className="p-5 space-y-4">
                  {/* Logo + Title */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center mb-3">
                        <Sparkles className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div className="h-2.5 w-44 bg-white/20 rounded-full mb-2" />
                      <div className="h-2 w-28 bg-white/10 rounded-full" />
                    </div>
                    <div className="text-right">
                      <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-full px-2.5 py-0.5 text-xs font-medium">
                        <CheckCircle className="h-3 w-3" /> Accepted
                      </div>
                      <div className="h-2 w-16 bg-white/10 rounded-full mt-2 ml-auto" />
                    </div>
                  </div>

                  {/* Section blocks */}
                  <div className="space-y-3">
                    {[
                      { label: 'Project Overview', lines: [20, 28, 16] },
                      { label: 'Scope of Work', lines: [24, 20, 26, 14] },
                    ].map((section) => (
                      <div key={section.label} className="bg-white/5 rounded-xl p-3.5">
                        <div className="text-[10px] font-semibold text-indigo-300 uppercase tracking-widest mb-2.5">{section.label}</div>
                        <div className="space-y-1.5">
                          {section.lines.map((w, i) => (
                            <div key={i} className="h-1.5 bg-white/15 rounded-full" style={{ width: `${w * 3}%` }} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Quote table */}
                  <div className="bg-indigo-600/20 border border-indigo-500/30 rounded-xl p-3.5">
                    <div className="text-[10px] font-semibold text-indigo-300 uppercase tracking-widest mb-3">Pricing</div>
                    <div className="space-y-2">
                      {[
                        { item: 'Discovery & Planning', price: '$1,200' },
                        { item: 'Design & Development', price: '$6,500' },
                        { item: 'QA & Launch', price: '$800' },
                      ].map((row) => (
                        <div key={row.item} className="flex items-center justify-between">
                          <div className="h-1.5 bg-white/20 rounded-full w-32" />
                          <span className="text-xs font-semibold text-white/80">{row.price}</span>
                        </div>
                      ))}
                      <div className="border-t border-white/10 pt-2 flex items-center justify-between">
                        <span className="text-xs font-bold text-white/60">Total</span>
                        <span className="text-sm font-bold text-indigo-300">$8,500</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Generation status bar */}
                <div className="px-5 pb-4">
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                    <div className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
                    <span className="text-xs text-slate-400 flex-1">Generated by AI in <span className="text-indigo-300 font-medium">47 seconds</span></span>
                    <Sparkles className="h-3 w-3 text-indigo-400" />
                  </div>
                </div>
              </div>

              {/* Floating badge */}
              <div className="absolute -top-3 -right-3 bg-emerald-500 text-white text-[10px] font-bold rounded-full px-2.5 py-1 shadow-lg shadow-emerald-900/50 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" /> Client signed
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="bg-[#0d0d1a] border-t border-white/5 py-3 sm:py-5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-4 gap-px bg-white/5 rounded-xl sm:rounded-2xl overflow-hidden">
            {stats.map((s) => (
              <div key={s.label} className="group flex flex-col items-center justify-center text-center px-2 py-3 sm:py-5 bg-[#0d0d1a] hover:bg-[#111127] transition-colors">
                <p className="text-lg sm:text-2xl font-extrabold text-white mb-0.5 group-hover:text-indigo-400 transition-colors leading-none" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>{s.value}</p>
                <p className="text-[9px] sm:text-xs text-slate-500 leading-tight">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof strip */}
      <section className="bg-slate-50 border-y border-slate-200 py-3 sm:py-4">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {[
              { icon: Users,        label: 'Trusted by freelancers worldwide' },
              { icon: Zap,          label: '60-second generation' },
              { icon: DollarSign,   label: 'Stripe-powered payments' },
              { icon: CheckCircle,  label: 'Electronic signatures' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-full px-3 py-1.5 shadow-sm">
                <Icon className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                <span className="text-xs sm:text-[13px] font-medium text-slate-600 whitespace-nowrap">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-white py-14 sm:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-14">
            <span className="inline-block text-xs font-bold tracking-widest text-indigo-600 uppercase bg-indigo-50 px-3 py-1 rounded-full mb-3 sm:mb-4">How it works</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mb-3 sm:mb-4" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
              From idea to signed deal<br className="hidden sm:block" /> in minutes
            </h2>
            <p className="text-slate-400 text-sm sm:text-lg max-w-lg mx-auto">
              ProposalForge handles the writing so you can focus on winning the work.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                step: '01',
                icon: FileText,
                title: 'Describe your project',
                desc: 'Fill in a short form — project type, scope, budget, and timeline. The more detail, the better the output.',
                accent: 'from-indigo-500 to-violet-500',
                bg: 'bg-indigo-50',
                text: 'text-indigo-600',
              },
              {
                step: '02',
                icon: Sparkles,
                title: 'AI writes your proposal',
                desc: 'AI generates a polished executive summary, scope of work, deliverables list, and itemized quote in seconds.',
                accent: 'from-violet-500 to-fuchsia-500',
                bg: 'bg-violet-50',
                text: 'text-violet-600',
              },
              {
                step: '03',
                icon: Send,
                title: 'Send and get paid',
                desc: 'Email the proposal link. Your client accepts with an e-signature, and an invoice is auto-generated for payment.',
                accent: 'from-emerald-500 to-teal-500',
                bg: 'bg-emerald-50',
                text: 'text-emerald-600',
              },
            ].map(({ step, icon: Icon, title, desc, accent, bg, text }, idx) => (
              <div key={step} className="relative flex flex-col p-5 sm:p-7 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex items-center gap-3 mb-5">
                  <div className={`h-11 w-11 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`h-5 w-5 ${text}`} />
                  </div>
                  <span className={`text-xs font-bold tracking-widest bg-gradient-to-r ${accent} bg-clip-text text-transparent`}>STEP {step}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
                {idx < 2 && (
                  <div className="hidden md:block absolute top-10 -right-4 z-10">
                    <ArrowRight className="h-5 w-5 text-slate-200" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-[#07070f] py-14 sm:py-28 overflow-hidden relative">
        {/* Ambient background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="text-center mb-10 sm:mb-16">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-widest text-indigo-400 uppercase bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-full mb-4 sm:mb-5">
              <Sparkles className="h-3 w-3" /> Features
            </span>
            <h2 className="text-2xl sm:text-5xl font-extrabold text-white mb-3 sm:mb-5 leading-tight" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
              Everything you need to<br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent"> win more clients</span>
            </h2>
            <p className="text-slate-400 text-sm sm:text-lg max-w-lg mx-auto leading-relaxed">
              One focused tool that handles proposals, invoices, clients, and payments — so you never lose a deal to slow paperwork.
            </p>
          </div>

          {/* Feature grid — shared-border mosaic */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/[0.06] rounded-2xl overflow-hidden border border-white/[0.06]">
            {features.map(({ icon: Icon, title, desc, gradient, glow }) => (
              <div
                key={title}
                className={`group relative bg-[#0d0d1a] hover:bg-[#111127] p-5 sm:p-7 transition-all duration-300 cursor-default overflow-hidden`}
              >
                {/* Card hover glow */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-[0.04]`} />

                {/* Top accent line */}
                <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-60 transition-opacity duration-300`} />

                {/* Icon */}
                <div className={`relative h-12 w-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-5 shadow-lg ${glow} group-hover:shadow-xl transition-shadow duration-300`}>
                  <Icon className="h-5 w-5 text-white" strokeWidth={1.75} />
                </div>

                {/* Text */}
                <h3 className="font-bold text-[15px] text-white mb-2 leading-snug">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* Bottom CTA nudge */}
          <div className="text-center mt-12">
            <p className="text-slate-500 text-sm">
              All features included on the free plan.{' '}
              <Link href="/auth" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors">
                Start building today →
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-white py-14 sm:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-14">
            <span className="inline-block text-xs font-bold tracking-widest text-indigo-600 uppercase bg-indigo-50 px-3 py-1 rounded-full mb-3 sm:mb-4">Testimonials</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mb-3 sm:mb-4" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
              Freelancers love ProposalForge
            </h2>
            <p className="text-slate-400 text-sm sm:text-lg">Real results from real users.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            {testimonials.map((t) => (
              <div key={t.name} className="flex flex-col bg-slate-50 border border-slate-100 rounded-2xl p-6 hover:shadow-md transition-shadow">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-700 text-sm leading-relaxed flex-1 mb-6">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-full ${t.color} flex items-center justify-center text-white font-bold text-xs shrink-0`}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-slate-50 py-14 sm:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 sm:mb-14">
            <span className="inline-block text-xs font-bold tracking-widest text-indigo-600 uppercase bg-indigo-50 px-3 py-1 rounded-full mb-3 sm:mb-4">Pricing</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mb-3 sm:mb-4" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
              Simple, transparent pricing
            </h2>
            <p className="text-slate-400 text-sm sm:text-lg">Start free. Upgrade when you're ready.</p>
          </div>

          {/* Cards row — both wrapped in pt-5 so tops align */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl mx-auto items-stretch">

            {/* Free plan */}
            <div className="pt-5">
              <div className="h-full rounded-2xl p-5 sm:p-7 flex flex-col bg-white border border-slate-200 shadow-sm">
                <div className="mb-6">
                  <h3 className="text-lg font-bold mb-1 text-slate-900">Free</h3>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-4xl font-extrabold text-slate-900">$0</span>
                    <span className="text-sm text-slate-500">/ forever</span>
                  </div>
                  <p className="text-sm text-slate-500">Perfect for freelancers just getting started.</p>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {['3 AI proposals / month', 'Unlimited clients & invoices', 'Stripe payment collection', 'E-signature acceptance', 'PDF export', 'Analytics dashboard'].map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-slate-600">
                      <CheckCircle className="h-4 w-4 shrink-0 text-indigo-500" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/auth">
                  <Button className="w-full h-11 font-semibold bg-white border border-slate-200 text-slate-800 hover:bg-slate-50">
                    Get started free
                  </Button>
                </Link>
              </div>
            </div>

            {/* Pro plan */}
            <div className="relative pt-5">
              {/* Badge floats above the card, outside overflow-hidden */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 z-30">
                <span className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg shadow-indigo-900/50 whitespace-nowrap">
                  Most Popular
                </span>
              </div>

              {/* Card — overflow-hidden clips the background decorations */}
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-indigo-950/60">
                {/* Gradient border */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-violet-500 to-indigo-800 p-px rounded-2xl">
                  <div className="absolute inset-0 rounded-2xl bg-[#0c0c1e]" />
                </div>
                {/* Dot-grid texture */}
                <div
                  className="absolute inset-0 opacity-[0.18] pointer-events-none"
                  style={{
                    backgroundImage: 'radial-gradient(circle, rgba(139,92,246,0.5) 1px, transparent 1px)',
                    backgroundSize: '22px 22px',
                  }}
                />
                {/* Top glow */}
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-60 h-40 bg-indigo-500/30 rounded-full blur-[60px] pointer-events-none" />
                {/* Bottom-right accent */}
                <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-violet-600/20 rounded-full blur-[60px] pointer-events-none" />

                {/* Content */}
                <div className="relative z-10 p-5 sm:p-7 flex flex-col">
                  <div className="mb-6">
                    <h3 className="text-lg font-bold mb-1 text-white">Pro</h3>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-4xl font-extrabold text-white">$19</span>
                      <span className="text-sm text-slate-400">/ per month</span>
                    </div>
                    <p className="text-sm text-slate-400">For serious freelancers who want to impress.</p>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {['Unlimited AI proposals', 'Remove ProposalForge branding', 'Client comment threads', 'Priority support', 'All future features', 'Early access to new AI models'].map(f => (
                      <li key={f} className="flex items-center gap-2.5 text-sm text-slate-300">
                        <CheckCircle className="h-4 w-4 shrink-0 text-indigo-400" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/auth">
                    <Button className="w-full h-12 font-bold text-base bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white border-0 shadow-lg shadow-indigo-900/50">
                      Start Pro
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#0a0a14] relative overflow-hidden py-14 sm:py-28">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-indigo-600/20 rounded-full blur-[100px]" />
        </div>
        <div className="relative max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 items-center justify-center mx-auto mb-5 sm:mb-6">
            <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 text-indigo-400" />
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-3 sm:mb-4" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
            Start winning more clients today
          </h2>
          <p className="text-slate-400 text-sm sm:text-lg mb-6 sm:mb-8 max-w-md mx-auto">
            Join 2,400+ freelancers who send polished proposals in under 60 seconds.
          </p>
          <Link href="/auth" className="block sm:inline-block">
            <Button size="lg" className="w-full sm:w-auto h-11 sm:h-12 px-8 sm:px-10 gap-2 text-base bg-indigo-600 hover:bg-indigo-500 border-0 shadow-xl shadow-indigo-900/50 font-semibold">
              <Sparkles className="h-4 w-4" />
              Get started for free
            </Button>
          </Link>
          <p className="mt-4 text-xs text-slate-600">No credit card required · 3 proposals free every month</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#07070f] border-t border-white/5 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col items-center gap-4 md:flex-row md:justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-bold text-white">ProposalForge</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <a href="#features" className="hover:text-slate-300 transition-colors">Features</a>
              <a href="#pricing" className="hover:text-slate-300 transition-colors">Pricing</a>
            </div>
            <p className="text-xs text-slate-600">© {new Date().getFullYear()} ProposalForge. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
