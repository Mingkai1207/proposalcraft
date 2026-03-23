import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import Footer from "@/components/Footer";
import { useState } from "react";
import {
  Zap, FileText, Mail, Eye, Shield, Star,
  CheckCircle, ArrowRight, Wrench, Droplets,
  Bolt, Home as HomeIcon, ChevronRight, Clock,
  TrendingUp, Users, Award, ChevronDown, ChevronUp,
  Smartphone, BarChart3, Layers, Timer
} from "lucide-react";

const FEATURES = [
  {
    icon: Zap,
    title: "AI-Powered in 60 Seconds",
    desc: "Describe the job and our AI writes a complete, professional proposal instantly — no templates to fill, no hours wasted.",
    color: "bg-orange-50 text-orange-600",
  },
  {
    icon: FileText,
    title: "Branded PDF Output",
    desc: "Every proposal is a polished PDF with your logo, business info, and custom terms. Looks like you hired a copywriter.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: Mail,
    title: "Send Directly to Clients",
    desc: "Email proposals to homeowners and GCs right from the platform. No copy-pasting into Gmail.",
    color: "bg-purple-50 text-purple-600",
  },
  {
    icon: Eye,
    title: "Read Receipt Tracking",
    desc: "Know the moment your client opens your proposal. Follow up at exactly the right time.",
    color: "bg-green-50 text-green-600",
  },
  {
    icon: Shield,
    title: "Trade-Specific Templates",
    desc: "Pre-built templates for HVAC, plumbing, electrical, and roofing — trained on real contractor language.",
    color: "bg-indigo-50 text-indigo-600",
  },
  {
    icon: TrendingUp,
    title: "Win More Jobs",
    desc: "Contractors who respond faster win more work. ProposAI gets you there first, every time.",
    color: "bg-rose-50 text-rose-600",
  },
];

const TRADES = [
  { icon: Wrench, label: "HVAC", color: "bg-blue-50 text-blue-700 border border-blue-100" },
  { icon: Droplets, label: "Plumbing", color: "bg-cyan-50 text-cyan-700 border border-cyan-100" },
  { icon: Bolt, label: "Electrical", color: "bg-yellow-50 text-yellow-700 border border-yellow-100" },
  {icon: BarChart3, label: "Roofing", color: "bg-orange-50 text-orange-700 border border-orange-100" },
];

const GUARANTEE_BADGE_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663464819175/TxoyTEEFMfksnn9C3wscL4/proposai-guarantee-badge-iVr29Hp4v4FN5DhPsDtUwF.webp";

const TESTIMONIALS = [
  {
    name: "Mike R.",
    trade: "HVAC Contractor, Texas",
    quote: "I used to spend 2 hours on a proposal. Now it takes 90 seconds and looks better than anything I ever wrote myself. Closed 3 jobs last week alone.",
    stars: 5,
    avatar: "MR",
    avatarColor: "bg-blue-500",
  },
  {
    name: "Sandra T.",
    trade: "Electrician, Florida",
    quote: "Sent a proposal while still in the client's driveway. They called me back before I got home. Closed the job on the spot.",
    stars: 5,
    avatar: "ST",
    avatarColor: "bg-purple-500",
  },
  {
    name: "Dave K.",
    trade: "Plumber, Ohio",
    quote: "My close rate went from maybe 40% to over 65% in the first month. The proposals just look so professional — clients trust me more.",
    stars: 5,
    avatar: "DK",
    avatarColor: "bg-green-500",
  },
];

const WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Describe the Job",
    desc: "Enter the trade type, job scope, materials, and your estimated cost. Takes less than a minute.",
    icon: Smartphone,
    color: "text-orange-500",
    bg: "bg-orange-50",
  },
  {
    step: "02",
    title: "AI Writes the Proposal",
    desc: "Our AI generates a complete, professional proposal in seconds — with itemized costs, scope of work, and your branding.",
    icon: Zap,
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    step: "03",
    title: "Send & Track",
    desc: "Email the proposal directly to your client. Get notified the moment they open it so you can follow up at the perfect time.",
    icon: Eye,
    color: "text-green-500",
    bg: "bg-green-50",
  },
];

const STATS = [
  { value: "60s", label: "Average proposal time", icon: Timer },
  { value: "65%", label: "Higher close rate reported", icon: TrendingUp },
  { value: "3+", label: "Hours saved per week", icon: Clock },
  { value: "4", label: "Trades supported", icon: Layers },
];

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    proposals: "3 proposals/month",
    features: [
      "AI proposal generation",
      "PDF download",
      "5 trade templates",
      "English only",
      "ProposAI watermark on PDF",
    ],
    cta: "Get Started Free",
    highlight: false,
    badge: null,
  },
  {
    name: "Starter",
    price: "$29",
    period: "/month",
    proposals: "20 proposals/month",
    features: [
      "No watermark on PDF",
      "Email delivery to clients",
      "Proposal open & read tracking",
      "Custom logo & branding",
      "Multi-language (EN, ZH, ES, FR)",
      "7 AI models incl. GPT-4o Mini",
      "Auto follow-up email (48h)",
      "Proposal expiry date",
    ],
    cta: "Start Starter Plan",
    highlight: false,
    badge: "Most Popular",
  },
  {
    name: "Pro",
    price: "$59",
    period: "/month",
    proposals: "Unlimited proposals",
    features: [
      "Everything in Starter",
      "GPT-4o, Claude 3.7, DeepSeek R1",
      "10+ trade proposal templates",
      "Bulk export all proposals (ZIP)",
      "Custom sender email domain",
      "Analytics: open rate & win rate",
      "Client portal (accept/decline)",
      "Priority support (4h response)",
    ],
    cta: "Go Pro",
    highlight: true,
    badge: "Best Value",
  },
];

const FAQS = [
  {
    q: "Do I need any tech skills to use ProposAI?",
    a: "None at all. If you can type a text message, you can use ProposAI. Just describe the job in plain English and the AI does the rest.",
  },
  {
    q: "How does the AI know contractor language?",
    a: "ProposAI is specifically trained on trade contractor proposals — HVAC, plumbing, electrical, and roofing. It understands job scopes, materials, and industry-standard terms.",
  },
  {
    q: "Can I add my own logo and business info?",
    a: "Yes. Every proposal includes your business name, logo, license number, phone, and custom terms. Your branding is saved once and applied to every proposal automatically.",
  },
  {
    q: "What happens when my client opens the proposal?",
    a: "You get an instant notification the moment your client opens the email. This lets you follow up while the job is still top of mind — dramatically improving close rates.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. There are no long-term contracts. You can cancel your subscription at any time from your account settings. Your free tier access remains after cancellation.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. All data is encrypted in transit and at rest. We never share your business information or client data with third parties.",
  },
];

const COMPARISON = [
  { feature: "Time to write a proposal", manual: "1–3 hours", proposai: "Under 60 seconds" },
  { feature: "Professional formatting", manual: "Inconsistent", proposai: "Always perfect" },
  { feature: "Client email delivery", manual: "Copy-paste to Gmail", proposai: "One click from app" },
  { feature: "Open tracking", manual: "Never know", proposai: "Real-time notification" },
  { feature: "Custom branding", manual: "DIY in Word/PDF", proposai: "Auto-applied to every proposal" },
  { feature: "Cost", manual: "Your time = $$$", proposai: "From $0/month" },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="border border-border rounded-xl overflow-hidden cursor-pointer"
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-center justify-between p-5 bg-card hover:bg-muted/30 transition-colors">
        <span className="font-medium text-foreground text-sm md:text-base pr-4">{q}</span>
        {open ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        )}
      </div>
      {open && (
        <div className="px-5 pb-5 bg-card">
          <p className="text-muted-foreground text-sm leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const handleCTA = () => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      window.location.href = getLoginUrl();
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Navigation ── */}
      <nav className="border-b border-border bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-sm">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg text-foreground tracking-tight">ProposAI</span>
          </div>
          <div className="hidden md:flex items-center gap-7">
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">How It Works</a>
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">Features</a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">Pricing</a>
            <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Button onClick={() => navigate("/dashboard")} size="sm">
                Dashboard <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => { window.location.href = getLoginUrl(); }} className="hidden sm:flex">
                  Sign In
                </Button>
                <Button size="sm" onClick={handleCTA} className="shadow-sm">
                  Start Free
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-slate-900">
        {/* Background gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(ellipse at 20% 60%, oklch(0.62 0.19 38) 0%, transparent 55%)" }} />
        <div className="absolute inset-0 opacity-15" style={{ backgroundImage: "radial-gradient(ellipse at 80% 20%, oklch(0.55 0.18 260) 0%, transparent 50%)" }} />
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

        <div className="relative container py-20 md:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Copy */}
            <div>
              <Badge className="mb-6 bg-orange-500/20 text-orange-300 border-orange-500/30 hover:bg-orange-500/20 text-xs font-semibold tracking-wide uppercase">
                <Zap className="w-3 h-3 mr-1.5" /> AI Proposals in 60 Seconds
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.1] mb-6 tracking-tight">
                Stop Losing Jobs to<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-300">Faster Contractors.</span>
              </h1>
              <p className="text-lg text-slate-300 mb-8 max-w-lg leading-relaxed">
                ProposAI generates professional, branded proposals for HVAC, plumbing, electrical, and roofing contractors in under 60 seconds — so you respond first and win more jobs.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <Button size="lg" onClick={handleCTA} className="text-base px-8 h-12 bg-orange-500 hover:bg-orange-600 text-white border-0 shadow-lg shadow-orange-500/30">
                  Start Free — No Credit Card <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button size="lg" variant="outline" asChild className="text-base h-12 px-6 border-white/20 text-white hover:bg-white/10 bg-transparent">
                  <a href="#how-it-works">See How It Works</a>
                </Button>
              </div>
              <div className="flex items-center gap-5 text-sm text-slate-400">
                <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-400" /> 3 free proposals/month</span>
                <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-400" /> No credit card</span>
                <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-400" /> Cancel anytime</span>
              </div>
            </div>

            {/* Right: Dashboard mockup */}
            <div className="hidden lg:block relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10">
                <img
                  src="https://d2xsxph8kpxj0f.cloudfront.net/310519663464819175/TxoyTEEFMfksnn9C3wscL4/proposai-hero-mockup-kkcGr82Cyrcnnx2bcQXuB5.webp"
                  alt="ProposAI dashboard showing a professional HVAC proposal"
                  className="w-full h-auto"
                />
              </div>
              {/* Floating badge */}
              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-xl p-3 flex items-center gap-3 border border-border">
                <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">Proposal Opened</p>
                  <p className="text-xs text-muted-foreground">Client viewed 2 min ago</p>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-xl p-3 flex items-center gap-3 border border-border">
                <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">Generated in 47s</p>
                  <p className="text-xs text-muted-foreground">HVAC proposal ready</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Social proof bar ── */}
      <section className="bg-white border-b border-border py-6">
        <div className="container">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            <p className="text-sm text-muted-foreground font-medium">Trusted by trade contractors across</p>
            {TRADES.map(({ icon: Icon, label, color }) => (
              <div key={label} className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm ${color}`}>
                <Icon className="w-4 h-4" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-16 bg-slate-50">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map(({ value, label, icon: Icon }) => (
              <div key={label} className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <p className="text-3xl md:text-4xl font-bold text-foreground mb-1">{value}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="container">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-50 text-blue-700 border-blue-100">How It Works</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">From job site to proposal in 3 steps</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">No learning curve. No complicated setup. Just describe the job and let the AI do the work.</p>
          </div>

          {/* Workflow illustration */}
          <div className="rounded-2xl overflow-hidden shadow-xl border border-border mb-16 max-w-4xl mx-auto">
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663464819175/TxoyTEEFMfksnn9C3wscL4/proposai-workflow-illustration-VdcYGhAQZ5Ed4m6EXiEKZu.webp"
              alt="ProposAI 3-step workflow: describe job, AI generates proposal, send to client"
              className="w-full h-auto"
            />
          </div>

          {/* Step cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {WORKFLOW_STEPS.map(({ step, title, desc, icon: Icon, color, bg }) => (
              <div key={step} className="relative text-center">
                {/* Connector line */}
                <div className="hidden md:block absolute top-8 left-[calc(50%+2.5rem)] w-[calc(100%-5rem)] h-px bg-border" />
                <div className={`w-16 h-16 ${bg} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm relative z-10`}>
                  <Icon className={`w-8 h-8 ${color}`} />
                </div>
                <div className="inline-block bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full mb-3">
                  Step {step}
                </div>
                <h3 className="font-bold text-foreground text-lg mb-2">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button size="lg" onClick={handleCTA} className="px-8 h-12 bg-primary hover:bg-primary/90">
              Try It Free Now <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* ── Before vs After ── */}
      <section className="py-24 bg-slate-900">
        <div className="container">
          <div className="text-center mb-14">
            <Badge className="mb-4 bg-white/10 text-white border-white/20">The Difference</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">The old way vs. the ProposAI way</h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">Every hour you spend writing proposals is an hour you're not on the job site.</p>
          </div>
          <div className="max-w-3xl mx-auto overflow-hidden rounded-2xl border border-white/10">
            <div className="grid grid-cols-3 bg-white/5 border-b border-white/10">
              <div className="p-4 text-sm font-semibold text-slate-400 uppercase tracking-wide">Feature</div>
              <div className="p-4 text-sm font-semibold text-red-400 uppercase tracking-wide text-center">Manual / Old Way</div>
              <div className="p-4 text-sm font-semibold text-green-400 uppercase tracking-wide text-center">ProposAI</div>
            </div>
            {COMPARISON.map(({ feature, manual, proposai }, i) => (
              <div key={feature} className={`grid grid-cols-3 border-b border-white/5 ${i % 2 === 0 ? "bg-white/5" : "bg-transparent"}`}>
                <div className="p-4 text-sm text-slate-300 font-medium">{feature}</div>
                <div className="p-4 text-sm text-red-400 text-center flex items-center justify-center gap-1">
                  <span className="text-red-500 font-bold">✗</span> {manual}
                </div>
                <div className="p-4 text-sm text-green-400 text-center flex items-center justify-center gap-1">
                  <span className="text-green-500 font-bold">✓</span> {proposai}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 bg-background">
        <div className="container">
          <div className="text-center mb-14">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Features</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Everything you need to close more jobs</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">One tool that handles the entire proposal process — from AI generation to client delivery and tracking.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="group bg-card border border-border rounded-2xl p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-foreground mb-2">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="py-24 bg-slate-50">
        <div className="container">
          <div className="text-center mb-14">
            <Badge className="mb-4 bg-yellow-50 text-yellow-700 border-yellow-100">Reviews</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Contractors love ProposAI</h2>
            <p className="text-muted-foreground text-lg">Real results from real trade contractors.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ name, trade, quote, stars, avatar, avatarColor }) => (
              <div key={name} className="bg-white border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-foreground text-sm leading-relaxed mb-5 italic">"{quote}"</p>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 ${avatarColor} rounded-full flex items-center justify-center text-white text-xs font-bold`}>
                    {avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">{name}</p>
                    <p className="text-xs text-muted-foreground">{trade}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Trust badges */}
          <div className="mt-12 flex flex-wrap justify-center gap-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Award className="w-5 h-5 text-yellow-500" />
              <span>4.9/5 average rating</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="w-5 h-5 text-blue-500" />
              <span>Used by contractors in 30+ states</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BarChart3 className="w-5 h-5 text-green-500" />
              <span>65% average close rate improvement</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 bg-background">
        <div className="container">
          <div className="text-center mb-14">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Pricing</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Simple, transparent pricing</h2>
            <p className="text-muted-foreground text-lg">One winning proposal pays for the tool 10x over.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {PLANS.map(({ name, price, period, proposals, features, cta, highlight, badge }) => (
              <div key={name} className={`relative rounded-2xl border p-7 flex flex-col transition-all ${highlight ? "border-primary bg-primary text-white shadow-2xl shadow-primary/20 scale-105" : "border-border bg-card hover:shadow-lg"}`}>
                {badge && (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full ${highlight ? "bg-white text-primary" : "bg-primary text-white"}`}>
                    {badge}
                  </div>
                )}
                <div className="mb-6">
                  <p className={`text-sm font-semibold mb-1 ${highlight ? "text-white/80" : "text-muted-foreground"}`}>{name}</p>
                  <div className="flex items-end gap-1">
                    <span className={`text-5xl font-bold tracking-tight ${highlight ? "text-white" : "text-foreground"}`}>{price}</span>
                    <span className={`text-sm mb-2 ${highlight ? "text-white/70" : "text-muted-foreground"}`}>{period}</span>
                  </div>
                  <p className={`text-sm mt-1 font-medium ${highlight ? "text-white/80" : "text-muted-foreground"}`}>{proposals}</p>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm">
                      <CheckCircle className={`w-4 h-4 flex-shrink-0 ${highlight ? "text-white" : "text-primary"}`} />
                      <span className={highlight ? "text-white" : "text-foreground"}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={handleCTA}
                  variant={highlight ? "secondary" : "default"}
                  className={`w-full h-11 font-semibold ${highlight ? "bg-white text-primary hover:bg-white/90" : ""}`}
                >
                  {cta} <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            ))}
          </div>
          {/* Guarantee badge */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-10">
            <img
              src={GUARANTEE_BADGE_URL}
              alt="14-day value guarantee"
              className="w-24 h-24 object-contain"
            />
            <div className="text-center sm:text-left">
              <p className="font-bold text-foreground text-lg">14-Day Value Guarantee</p>
              <p className="text-muted-foreground text-sm max-w-xs">Use ProposAI for 14 days and win just one extra job — the tool pays for itself many times over. We're that confident.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── AI Model Comparison ── */}
      <section className="py-24 bg-white">
        <div className="container">
          <div className="text-center mb-14">
            <Badge className="mb-4 bg-orange-50 text-orange-700 border-orange-100">Choose Your AI</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Pick the AI that fits your market</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">ProposAI supports multiple AI models. Writing proposals in Chinese? There's a model for that. Need the most polished English? There's one for that too.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {[
              { flag: "🌐", name: "Gemini 2.5 Flash", provider: "Google", badge: "Default", badgeColor: "bg-blue-100 text-blue-700", desc: "Fast and capable. The best all-around choice for English proposals.", tags: ["English", "Fast", "Reliable"] },
              { flag: "🇨🇳", name: "DeepSeek V3", provider: "DeepSeek", badge: "Best for Chinese", badgeColor: "bg-red-100 text-red-700", desc: "Writes fluent, native-sounding Chinese proposals. Ideal for contractors in China or serving Chinese clients.", tags: ["Chinese", "Mandarin", "Bilingual"] },
              { flag: "🇨🇳", name: "DeepSeek R1", provider: "DeepSeek", badge: "Reasoning", badgeColor: "bg-orange-100 text-orange-700", desc: "Thinks step-by-step before writing. Best for complex, technical jobs that need careful scoping.", tags: ["Chinese", "Technical", "Complex"] },
              { flag: "🇺🇸", name: "GPT-4o", provider: "OpenAI", badge: "Premium", badgeColor: "bg-green-100 text-green-700", desc: "OpenAI's flagship. Persuasive, detailed English proposals with a professional tone that wins jobs.", tags: ["English", "Premium", "Persuasive"] },
              { flag: "🇺🇸", name: "Claude 3.7 Sonnet", provider: "Anthropic", badge: "Best Writing", badgeColor: "bg-purple-100 text-purple-700", desc: "The most polished, human-like writing of any model. Proposals that read like they were written by a copywriter.", tags: ["English", "Best prose", "Human-like"] },
              { flag: "🇨🇳", name: "Qwen Max", provider: "Alibaba", badge: "Chinese Alt", badgeColor: "bg-yellow-100 text-yellow-700", desc: "Alibaba's top model. Strong Chinese language support for contractors working in the Chinese market.", tags: ["Chinese", "Alibaba", "Simplified"] },
            ].map(({ flag, name, provider, badge, badgeColor, desc, tags }) => (
              <div key={name} className="bg-slate-50 border border-border rounded-2xl p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{flag}</span>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{name}</p>
                      <p className="text-xs text-muted-foreground">{provider}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${badgeColor}`}>{badge}</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">{desc}</p>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map(t => (
                    <span key={t} className="text-xs bg-white border border-border text-muted-foreground px-2 py-0.5 rounded-full">{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-8">Switch models anytime in Settings — no extra cost, no re-setup required.</p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-24 bg-slate-50">
        <div className="container max-w-3xl">
          <div className="text-center mb-14">
            <Badge className="mb-4 bg-slate-100 text-slate-700 border-slate-200">FAQ</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Frequently asked questions</h2>
            <p className="text-muted-foreground text-lg">Everything you need to know before getting started.</p>
          </div>
          <div className="space-y-3">
            {FAQS.map(({ q, a }) => (
              <FAQItem key={q} q={q} a={a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 relative overflow-hidden bg-slate-900">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(ellipse at 50% 100%, oklch(0.62 0.19 38) 0%, transparent 60%)" }} />
        <div className="relative container text-center max-w-2xl">
          <div className="w-16 h-16 bg-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Zap className="w-8 h-8 text-orange-400" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to win more jobs?</h2>
          <p className="text-slate-300 text-lg mb-8 leading-relaxed">
            Join contractors who generate professional proposals in seconds, not hours. Start free — no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" onClick={handleCTA} className="text-base px-10 h-12 bg-orange-500 hover:bg-orange-600 border-0 shadow-lg shadow-orange-500/30">
              Start Free Today <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base h-12 px-8 border-white/20 text-white hover:bg-white/10 bg-transparent">
              <a href="#pricing">View Pricing</a>
            </Button>
          </div>
          <p className="text-slate-500 text-sm mt-5">3 free proposals every month. Upgrade when you're ready.</p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
