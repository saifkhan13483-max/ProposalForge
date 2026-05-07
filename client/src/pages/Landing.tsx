import { Link } from 'wouter'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Sparkles, FileText, CheckCircle, Zap, ArrowRight, Star,
  Clock, DollarSign, Send, Shield, TrendingUp, Users, BarChart3,
  Quote, Layers, Globe, Lock
} from 'lucide-react'
import { SiReact, SiTypescript, SiPostgresql, SiStripe, SiTailwindcss } from 'react-icons/si'

function useCountUp(target: number, duration = 2000, active = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!active) return
    let startTime: number | null = null
    const tick = (ts: number) => {
      if (!startTime) startTime = ts
      const progress = Math.min((ts - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target, duration, active])
  return count
}

function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal, .reveal-left')
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0.12 }
    )
    els.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])
}

function useStatsInView() {
  const ref = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setActive(true) }, { threshold: 0.4 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return { ref, active }
}

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Brand Designer',
    company: 'Lumina Studio',
    avatar: 'SC',
    color: 'from-purple-500 to-indigo-500',
    quote: 'I used to spend 2 hours on every proposal. Now it takes me 5 minutes to review and send. My acceptance rate went from 40% to 70% in the first month.',
    stars: 5,
  },
  {
    name: 'Marcus Rivera',
    role: 'Full-Stack Developer',
    company: 'DevCraft Co.',
    avatar: 'MR',
    color: 'from-blue-500 to-cyan-500',
    quote: "The AI-generated scope of work sections are genuinely impressive. Clients often tell me my proposals look more professional than agencies they've hired.",
    stars: 5,
  },
  {
    name: 'Priya Nair',
    role: 'Content Strategist',
    company: 'Inkwell Agency',
    avatar: 'PN',
    color: 'from-emerald-500 to-teal-500',
    quote: "Auto-invoicing on acceptance is a game changer. I don't have to chase payments anymore — Stripe handles everything automatically.",
    stars: 5,
  },
]

const features = [
  { icon: Sparkles, title: 'AI Proposal Writing', desc: 'Llama AI generates complete, professional proposals tailored to your project type and scope.', color: 'bg-indigo-500', glow: 'shadow-indigo-200' },
  { icon: FileText, title: 'Rich Text Editor', desc: 'Customize every section with an inline editor. Regenerate individual sections with one click.', color: 'bg-purple-500', glow: 'shadow-purple-200' },
  { icon: DollarSign, title: 'Auto Invoicing', desc: 'When a client accepts, an invoice is created automatically. Collect payment via Stripe Checkout.', color: 'bg-emerald-500', glow: 'shadow-emerald-200' },
  { icon: CheckCircle, title: 'E-Signature Acceptance', desc: 'Clients accept proposals with a typed signature on a branded acceptance page.', color: 'bg-green-500', glow: 'shadow-green-200' },
  { icon: Clock, title: 'Real-time Tracking', desc: 'Know when your client views the proposal. Get notified on view, accept, and comment events.', color: 'bg-orange-500', glow: 'shadow-orange-200' },
  { icon: Shield, title: 'Branding Controls', desc: 'Upload your logo, set your accent color, and make every proposal look like it came from an agency.', color: 'bg-blue-500', glow: 'shadow-blue-200' },
  { icon: Zap, title: 'PDF Export', desc: 'Download a print-ready PDF of any proposal or invoice for offline sharing or record keeping.', color: 'bg-yellow-500', glow: 'shadow-yellow-200' },
  { icon: BarChart3, title: 'Analytics Dashboard', desc: 'Track revenue trends, proposal pipeline, acceptance rates, and outstanding invoices at a glance.', color: 'bg-cyan-500', glow: 'shadow-cyan-200' },
  { icon: Send, title: 'Email Delivery', desc: 'Send proposals directly to clients via email with a personal message and one-click accept link.', color: 'bg-rose-500', glow: 'shadow-rose-200' },
]

const techStack = [
  { Icon: SiReact, label: 'React 19', color: 'text-cyan-400' },
  { Icon: SiTypescript, label: 'TypeScript', color: 'text-blue-400' },
  { Icon: SiPostgresql, label: 'PostgreSQL', color: 'text-sky-400' },
  { Icon: SiStripe, label: 'Stripe', color: 'text-indigo-400' },
  { Icon: SiTailwindcss, label: 'Tailwind CSS', color: 'text-teal-400' },
  { icon: Sparkles, label: 'Groq AI', color: 'text-purple-400' } as any,
]

export function Landing() {
  useScrollReveal()
  const { ref: statsRef, active: statsActive } = useStatsInView()

  const c1 = useCountUp(2400, 1800, statsActive)
  const c2 = useCountUp(420, 1800, statsActive)
  const c3 = useCountUp(68, 1500, statsActive)
  const c4 = useCountUp(58, 1400, statsActive)

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* ── Nav ── */}
      <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm shadow-indigo-300">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
              ProposalForge
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-7 text-sm text-slate-600">
            <a href="#features" className="hover:text-slate-900 transition-colors font-medium">Features</a>
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors font-medium">How it works</a>
            <a href="#pricing" className="hover:text-slate-900 transition-colors font-medium">Pricing</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/auth">
              <Button variant="ghost" size="sm" className="font-medium">Sign in</Button>
            </Link>
            <Link href="/auth">
              <Button size="sm" className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 font-medium">
                Get started free <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-900 text-white">
        {/* Animated glow orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="animate-glow-pulse absolute -top-1/2 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-indigo-600/20 rounded-full blur-3xl" />
          <div className="animate-glow-pulse absolute top-1/4 -left-40 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl" style={{ animationDelay: '1.5s' }} />
          <div className="animate-glow-pulse absolute top-1/3 -right-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl" style={{ animationDelay: '3s' }} />
          {/* Grid overlay */}
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }} />
          {/* Radial fade at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-slate-900 to-transparent" />
        </div>

        <div className="relative max-w-5xl mx-auto px-6 py-28 md:py-36 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 rounded-full px-4 py-1.5 text-sm font-medium mb-8 animate-slide-up-fade" style={{ animation: 'slide-up-fade 0.7s ease-out both' }}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-300 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-400" />
            </span>
            AI-powered proposals in under 60 seconds
          </div>

          <h1
            className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-[1.05]"
            style={{ fontFamily: 'Bricolage Grotesque, sans-serif', animation: 'slide-up-fade 0.8s 0.1s ease-out both' }}
          >
            Win clients with<br />
            <span className="text-shimmer">proposals that close.</span>
          </h1>

          <p
            className="text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed"
            style={{ animation: 'slide-up-fade 0.8s 0.25s ease-out both' }}
          >
            Describe your project and let AI generate a polished, branded proposal with a quote and invoice — ready to send in under 60 seconds.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4" style={{ animation: 'slide-up-fade 0.8s 0.4s ease-out both' }}>
            <Link href="/auth">
              <Button size="lg" className="h-12 px-8 gap-2 text-base bg-indigo-500 hover:bg-indigo-400 border-0 shadow-lg shadow-indigo-900/60 font-semibold">
                <Sparkles className="h-5 w-5" />
                Start for free
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" className="h-12 px-8 text-base bg-white/10 border border-white/20 text-white hover:bg-white/20 hover:text-white gap-2 backdrop-blur-sm">
                <ArrowRight className="h-4 w-4" />
                Try the live demo
              </Button>
            </Link>
          </div>
          <p className="mt-5 text-sm text-slate-500">Free forever · No credit card required · 3 proposals/month on free tier</p>
        </div>

        {/* Floating dashboard preview */}
        <div className="relative max-w-5xl mx-auto px-6 pb-0">
          <div className="animate-float relative">
            {/* Glow under card */}
            <div className="absolute -inset-4 bg-indigo-500/10 rounded-3xl blur-2xl" />
            <div className="relative rounded-t-2xl border border-white/10 bg-slate-800/70 backdrop-blur-sm overflow-hidden shadow-2xl shadow-indigo-950/60">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-slate-900/60">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500/70" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
                  <div className="h-3 w-3 rounded-full bg-green-500/70" />
                </div>
                <div className="flex-1 mx-4 h-6 rounded-md bg-slate-700/60 flex items-center px-3">
                  <Lock className="h-3 w-3 text-slate-400 mr-1.5" />
                  <span className="text-xs text-slate-400">app.proposalforge.com/dashboard</span>
                </div>
                <div className="flex gap-2">
                  <div className="h-5 w-5 rounded bg-slate-700/60" />
                  <div className="h-5 w-5 rounded bg-slate-700/60" />
                </div>
              </div>
              {/* Dashboard UI mockup */}
              <div className="flex">
                {/* Sidebar */}
                <div className="w-14 bg-slate-900/80 border-r border-white/5 py-4 flex flex-col items-center gap-3 shrink-0 hidden sm:flex">
                  <div className="h-7 w-7 rounded-lg bg-indigo-500/80 flex items-center justify-center mb-2">
                    <Sparkles className="h-3.5 w-3.5 text-white" />
                  </div>
                  {[BarChart3, FileText, DollarSign, Users].map((Icon, i) => (
                    <div key={i} className={`h-8 w-8 rounded-lg flex items-center justify-center ${i === 0 ? 'bg-indigo-500/20' : 'hover:bg-white/5'}`}>
                      <Icon className={`h-4 w-4 ${i === 0 ? 'text-indigo-400' : 'text-slate-500'}`} />
                    </div>
                  ))}
                </div>
                {/* Content */}
                <div className="flex-1 p-5 space-y-4 min-h-[260px]">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-slate-300">Good morning, Alex</p>
                    <div className="flex gap-2">
                      <div className="h-5 w-16 rounded-md bg-indigo-500/70 flex items-center justify-center">
                        <span className="text-[9px] text-white font-medium">+ New Proposal</span>
                      </div>
                    </div>
                  </div>
                  {/* Stats row */}
                  <div className="grid grid-cols-4 gap-2.5">
                    {[
                      { label: 'Monthly Revenue', value: '$8,450', color: 'text-emerald-400', bar: 'bg-emerald-500' },
                      { label: 'Outstanding', value: '$2,100', color: 'text-orange-400', bar: 'bg-orange-500' },
                      { label: 'Acceptance Rate', value: '72%', color: 'text-blue-400', bar: 'bg-blue-500' },
                      { label: 'Total Clients', value: '24', color: 'text-purple-400', bar: 'bg-purple-500' },
                    ].map(s => (
                      <div key={s.label} className="bg-slate-700/50 rounded-xl p-3 border border-white/5">
                        <p className="text-[9px] text-slate-400 mb-1 truncate">{s.label}</p>
                        <p className={`text-base font-bold ${s.color}`}>{s.value}</p>
                        <div className="h-0.5 rounded-full bg-slate-600 mt-2 overflow-hidden">
                          <div className={`h-full rounded-full ${s.bar}`} style={{ width: '65%' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Chart + activity */}
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="col-span-2 bg-slate-700/50 rounded-xl p-3 border border-white/5">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[9px] text-slate-400">Revenue (last 6 months)</p>
                        <span className="text-[8px] text-emerald-400 font-medium">↑ 18% vs last period</span>
                      </div>
                      <div className="flex items-end gap-1.5 h-16">
                        {[28, 42, 35, 58, 70, 90].map((h, i) => (
                          <div key={i} className="flex-1 flex flex-col justify-end">
                            <div
                              className={`rounded-sm ${i === 5 ? 'bg-gradient-to-t from-indigo-500 to-indigo-400' : 'bg-slate-600/70'}`}
                              style={{ height: `${h}%` }}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between mt-1.5">
                        {['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'].map(m => (
                          <span key={m} className="text-[8px] text-slate-500">{m}</span>
                        ))}
                      </div>
                    </div>
                    <div className="bg-slate-700/50 rounded-xl p-3 border border-white/5">
                      <p className="text-[9px] text-slate-400 mb-3">Pipeline</p>
                      <div className="space-y-2">
                        {[
                          { label: 'Accepted', pct: 72, color: 'bg-emerald-500' },
                          { label: 'Sent', pct: 48, color: 'bg-blue-500' },
                          { label: 'Viewed', pct: 30, color: 'bg-purple-500' },
                          { label: 'Draft', pct: 15, color: 'bg-slate-500' },
                        ].map(p => (
                          <div key={p.label}>
                            <div className="flex justify-between text-[8px] text-slate-400 mb-0.5">
                              <span>{p.label}</span><span>{p.pct}%</span>
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
          </div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section className="border-b bg-slate-50 py-14" ref={statsRef}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: c1, suffix: '+', label: 'Freelancers using ProposalForge' },
              { value: `$${c2 >= 100 ? (c2 / 100).toFixed(1) : c2}`, suffix: c2 >= 100 ? 'M' : 'k', label: 'In proposals generated', raw: true },
              { value: c3, suffix: '%', label: 'Average acceptance rate' },
              { value: c4, suffix: 's', label: 'Avg proposal generation time' },
            ].map((s, i) => (
              <div key={i} className="reveal">
                <p className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-1 tabular-nums" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
                  {s.raw ? s.value : s.value}{s.suffix}
                </p>
                <p className="text-sm text-slate-500 leading-snug">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Social proof ── */}
      <section className="border-b bg-white py-5">
        <div className="max-w-5xl mx-auto px-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
          {[
            'Trusted by freelancers worldwide',
            '60-second proposal generation',
            'Stripe-powered payments',
            'Electronic signatures',
          ].map((text, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-slate-600 font-medium">
              <CheckCircle className="h-4 w-4 text-indigo-500 shrink-0" />
              {text}
            </div>
          ))}
        </div>
      </section>

      {/* ── Tech stack ── */}
      <section className="bg-slate-900 py-10 border-y border-slate-800">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-center text-xs font-bold tracking-widest text-slate-500 uppercase mb-7">Built with modern technology</p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
            {techStack.map(({ Icon, icon: IconFallback, label, color }: any, i) => (
              <div key={i} className="flex items-center gap-2.5 text-slate-400 hover:text-slate-200 transition-colors group">
                {Icon
                  ? <Icon className={`h-6 w-6 ${color} group-hover:scale-110 transition-transform`} />
                  : <IconFallback className={`h-5 w-5 ${color} group-hover:scale-110 transition-transform`} />
                }
                <span className="text-sm font-semibold">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-6 py-24">
        <div className="text-center mb-16 reveal">
          <span className="text-xs font-bold tracking-widest text-indigo-600 uppercase mb-4 block">How it works</span>
          <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
            From idea to signed deal<br />in minutes
          </h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            ProposalForge handles the writing so you can focus on winning the work.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-12 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-px bg-gradient-to-r from-indigo-200 via-purple-200 to-emerald-200" />
          {[
            {
              step: '01', icon: FileText, title: 'Describe your project',
              desc: 'Fill in a short form — project type, scope, budget, and timeline. The more detail, the better the output.',
              color: 'bg-indigo-600', ring: 'ring-indigo-100', delay: '0ms',
            },
            {
              step: '02', icon: Sparkles, title: 'AI generates your proposal',
              desc: 'Groq AI writes a polished executive summary, scope of work, deliverables, and itemized quote in seconds.',
              color: 'bg-purple-600', ring: 'ring-purple-100', delay: '100ms',
            },
            {
              step: '03', icon: Send, title: 'Send and get paid',
              desc: 'Email the proposal link to your client. They accept with an e-signature and an invoice is auto-created for Stripe payment.',
              color: 'bg-emerald-600', ring: 'ring-emerald-100', delay: '200ms',
            },
          ].map(({ step, icon: Icon, title, desc, color, ring, delay }) => (
            <div key={step} className={`reveal relative flex flex-col h-full p-7 rounded-2xl border bg-white hover:shadow-xl hover:shadow-indigo-50 transition-all duration-300 hover:-translate-y-1 group`} style={{ transitionDelay: delay }}>
              <div className="flex flex-col items-center text-center">
                <div className={`h-14 w-14 rounded-2xl ${color} flex items-center justify-center shadow-lg mb-5 ring-4 ${ring} group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs font-bold text-slate-400 tracking-widest mb-3">STEP {step}</span>
                <h3 className="text-lg font-bold mb-3" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="bg-gradient-to-b from-slate-50 to-white py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16 reveal">
            <span className="text-xs font-bold tracking-widest text-indigo-600 uppercase mb-4 block">Features</span>
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
              Everything a freelancer needs
            </h2>
            <p className="text-slate-500 text-lg">One tool for proposals, invoices, clients, and payments.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map(({ icon: Icon, title, desc, color, glow }, i) => (
              <div
                key={title}
                className="reveal bg-white rounded-2xl border p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group cursor-default"
                style={{ transitionDelay: `${(i % 3) * 60}ms` }}
              >
                <div className={`h-11 w-11 rounded-xl ${color} flex items-center justify-center mb-4 shadow-md ${glow} group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-bold text-sm mb-2 group-hover:text-indigo-600 transition-colors" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>{title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16 reveal">
            <span className="text-xs font-bold tracking-widest text-indigo-600 uppercase mb-4 block">Testimonials</span>
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
              Freelancers love ProposalForge
            </h2>
            <p className="text-slate-500 text-lg">Don't take our word for it.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={t.name} className="reveal relative group" style={{ transitionDelay: `${i * 80}ms` }}>
                <div className="relative bg-white border rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col h-full overflow-hidden">
                  {/* Gradient top border */}
                  <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${t.color}`} />
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: t.stars }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <Quote className="h-7 w-7 text-indigo-100 mb-3 rotate-180" />
                  <p className="text-slate-600 text-sm leading-relaxed flex-1 mb-6 italic">"{t.quote}"</p>
                  <div className="flex items-center gap-3 pt-4 border-t">
                    <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-md`}>
                      {t.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{t.name}</p>
                      <p className="text-xs text-slate-500">{t.role} · {t.company}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="bg-slate-50 py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16 reveal">
            <span className="text-xs font-bold tracking-widest text-indigo-600 uppercase mb-4 block">Pricing</span>
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
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
            ].map((plan, i) => (
              <div
                key={plan.name}
                className={`reveal relative rounded-2xl p-8 bg-white ${plan.highlight
                  ? 'border-2 border-indigo-500 ring-4 ring-indigo-500/10 shadow-2xl shadow-indigo-100'
                  : 'border shadow-sm'
                }`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                {plan.highlight && (
                  <>
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg">Most Popular</span>
                    </div>
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-t-2xl" />
                  </>
                )}
                <div className="mb-6">
                  <h3 className="text-lg font-bold mb-1" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-4xl font-extrabold" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>{plan.price}</span>
                    <span className="text-slate-500 text-sm">/ {plan.period}</span>
                  </div>
                  <p className="text-sm text-slate-500">{plan.desc}</p>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm">
                      <div className={`h-5 w-5 rounded-full ${plan.highlight ? 'bg-indigo-100' : 'bg-slate-100'} flex items-center justify-center shrink-0`}>
                        <CheckCircle className={`h-3 w-3 ${plan.highlight ? 'text-indigo-600' : 'text-slate-500'}`} />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/auth">
                  <Button
                    className={`w-full font-semibold ${plan.highlight ? 'bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200' : ''}`}
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

      {/* ── Final CTA ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 text-white py-28">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="animate-glow-pulse absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-600/20 rounded-full blur-3xl" />
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }} />
        </div>
        <div className="relative max-w-3xl mx-auto px-6 text-center reveal">
          <div className="inline-flex h-16 w-16 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 items-center justify-center mx-auto mb-6">
            <Sparkles className="h-8 w-8 text-indigo-300" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-5" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
            Start winning more clients today
          </h2>
          <p className="text-slate-300 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Join 2,400+ freelancers who use ProposalForge to generate professional proposals in under 60 seconds.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth">
              <Button size="lg" className="h-13 px-10 gap-2 text-base bg-indigo-500 hover:bg-indigo-400 border-0 shadow-xl shadow-indigo-900/50 font-semibold">
                <Sparkles className="h-5 w-5" />
                Get started for free
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="outline" className="h-12 px-8 text-base border-white/20 text-white hover:bg-white/10 hover:text-white gap-2 bg-transparent backdrop-blur-sm">
                Try the live demo
              </Button>
            </Link>
          </div>
          <p className="mt-5 text-sm text-slate-500">No credit card required · Cancel anytime</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t bg-white py-10">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm shadow-indigo-200">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-bold text-slate-800" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>ProposalForge</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <a href="#features" className="hover:text-slate-800 transition-colors">Features</a>
              <a href="#pricing" className="hover:text-slate-800 transition-colors">Pricing</a>
              <Link href="/demo" className="hover:text-slate-800 transition-colors">Demo</Link>
              <Link href="/auth" className="hover:text-slate-800 transition-colors">Sign in</Link>
            </div>
            <p className="text-sm text-slate-400">© {new Date().getFullYear()} ProposalForge</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
