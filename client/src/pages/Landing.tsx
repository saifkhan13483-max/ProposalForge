import { Link } from 'wouter'
import { Button } from '@/components/ui/button'
import {
  Sparkles, FileText, CheckCircle, Zap, ArrowRight, Star,
  Clock, DollarSign, Send, Shield
} from 'lucide-react'

export function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
              ProposalForge
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/auth">
              <Button size="sm" className="gap-1.5">
                Get started free <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-900 text-white">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/2 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-indigo-600/20 rounded-full blur-3xl" />
          <div className="absolute top-1/4 -left-40 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl" />
          <div className="absolute top-1/3 -right-40 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto px-6 py-24 md:py-36 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 rounded-full px-4 py-1.5 text-sm font-medium mb-8">
            <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
            AI-powered in under 60 seconds
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-[1.05]" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
            Win clients with<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300">
              proposals that close.
            </span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            Describe your project and let AI generate a polished, branded proposal with a quote and invoice — ready to send in under 60 seconds.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth">
              <Button size="lg" className="h-12 px-8 gap-2 text-base bg-indigo-500 hover:bg-indigo-400 border-0">
                <Sparkles className="h-5 w-5" />
                Start for free
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="outline" className="h-12 px-8 text-base border-white/20 text-white hover:bg-white/10 hover:text-white gap-2">
                <ArrowRight className="h-4 w-4" />
                Try the live demo
              </Button>
            </Link>
          </div>
          <p className="mt-5 text-sm text-slate-500">Free forever · No credit card required · 3 proposals/month on free tier</p>
        </div>
      </section>

      {/* Social proof strip */}
      <section className="border-y bg-slate-50 py-5">
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
      <section className="max-w-5xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
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
            },
            {
              step: '02',
              icon: Sparkles,
              title: 'AI generates your proposal',
              desc: 'Gemini AI writes a polished executive summary, scope of work, deliverables list, and itemized quote — in seconds.',
              color: 'bg-purple-50 text-purple-600',
            },
            {
              step: '03',
              icon: Send,
              title: 'Send and get paid',
              desc: 'Email the proposal link to your client. They accept with an e-signature, and an invoice is auto-generated for Stripe payment.',
              color: 'bg-emerald-50 text-emerald-600',
            },
          ].map(({ step, icon: Icon, title, desc, color }) => (
            <div key={step} className="relative">
              <div className="flex flex-col h-full p-6 rounded-2xl border bg-white hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-400 tracking-widest">STEP {step}</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-slate-50 py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
              Everything a freelancer needs
            </h2>
            <p className="text-slate-500 text-lg">One tool for proposals, invoices, and payments.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Sparkles, title: 'AI Proposal Writing', desc: 'Gemini AI generates complete, professional proposals tailored to your project type and scope.' },
              { icon: FileText, title: 'Rich Text Editor', desc: 'Customize every section with an inline editor. Regenerate individual sections with one click.' },
              { icon: DollarSign, title: 'Auto Invoicing', desc: 'When a client accepts, an invoice is created automatically. Collect payment via Stripe Checkout.' },
              { icon: CheckCircle, title: 'E-Signature Acceptance', desc: 'Clients accept proposals with a typed signature on a branded acceptance page — no DocuSign needed.' },
              { icon: Clock, title: 'Real-time Tracking', desc: 'Know when your client views the proposal. Get notified on view, accept, and comment events.' },
              { icon: Shield, title: 'Branding Controls', desc: 'Upload your logo, set your accent color, and make every proposal look like it came from a top agency.' },
              { icon: Zap, title: 'PDF Export', desc: 'Download a print-ready PDF of any proposal for offline sharing or record keeping.' },
              { icon: Star, title: 'Free & Pro Tiers', desc: 'Get started free with 3 proposals/month. Upgrade to Pro for unlimited proposals and no branding.' },
              { icon: Send, title: 'Email Delivery', desc: 'Send proposals directly to clients via email with a personal message and one-click accept link.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-xl border p-5 hover:shadow-sm transition-shadow">
                <div className="h-9 w-9 rounded-lg bg-indigo-50 flex items-center justify-center mb-3">
                  <Icon className="h-4.5 w-4.5 text-indigo-600 h-5 w-5" />
                </div>
                <h3 className="font-semibold text-sm mb-1.5">{title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
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
              features: ['3 AI proposals / month', 'Unlimited clients & invoices', 'Stripe payment collection', 'E-signature acceptance', 'PDF export'],
              cta: 'Get started free',
              highlight: false,
            },
            {
              name: 'Pro',
              price: '$19',
              period: 'per month',
              desc: 'For serious freelancers who want to impress.',
              features: ['Unlimited AI proposals', 'Remove ProposalForge branding', 'Priority support', 'All future features', 'Early access to new AI models'],
              cta: 'Start Pro',
              highlight: true,
            },
          ].map(plan => (
            <div key={plan.name} className={`relative rounded-2xl border p-8 ${plan.highlight ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-lg' : ''}`}>
              {plan.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full">Most Popular</span>
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
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-indigo-950 to-slate-900 text-white py-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <Sparkles className="h-12 w-12 text-indigo-300 mx-auto mb-6" />
          <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
            Start winning more clients today
          </h2>
          <p className="text-slate-300 text-lg mb-8 max-w-xl mx-auto">
            Join freelancers who use ProposalForge to generate professional proposals in under 60 seconds.
          </p>
          <Link href="/auth">
            <Button size="lg" className="h-12 px-8 gap-2 text-base bg-indigo-500 hover:bg-indigo-400 border-0">
              <Sparkles className="h-5 w-5" />
              Get started for free
            </Button>
          </Link>
          <p className="mt-4 text-sm text-slate-500">No credit card required</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-indigo-600 flex items-center justify-center">
              <Sparkles className="h-3 w-3 text-white" />
            </div>
            <span className="font-semibold text-slate-600">ProposalForge</span>
          </div>
          <p>© {new Date().getFullYear()} ProposalForge. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
