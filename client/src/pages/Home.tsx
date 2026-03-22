import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import {
  Zap, FileText, Mail, Eye, Shield, Star,
  CheckCircle, ArrowRight, Wrench, Droplets,
  Bolt, Home as HomeIcon, ChevronRight
} from "lucide-react";

const FEATURES = [
  { icon: Zap, title: "AI-Powered in 60 Seconds", desc: "Describe the job and our AI writes a complete, professional proposal instantly - no templates to fill, no hours wasted." },
  { icon: FileText, title: "Branded PDF Output", desc: "Every proposal is a polished PDF with your logo, business info, and custom terms. Looks like you hired a copywriter." },
  { icon: Mail, title: "Send Directly to Clients", desc: "Email proposals to homeowners and GCs right from the platform. No copy-pasting into Gmail." },
  { icon: Eye, title: "Read Receipt Tracking", desc: "Know the moment your client opens your proposal. Follow up at exactly the right time." },
  { icon: Shield, title: "Trade-Specific Templates", desc: "Pre-built templates for HVAC, plumbing, electrical, and roofing - trained on real contractor language." },
  { icon: Star, title: "Win More Jobs", desc: "Contractors who respond faster win more work. ProposalCraft AI gets you there first." },
];

const TRADES = [
  { icon: Wrench, label: "HVAC", color: "bg-blue-50 text-blue-700" },
  { icon: Droplets, label: "Plumbing", color: "bg-cyan-50 text-cyan-700" },
  { icon: Bolt, label: "Electrical", color: "bg-yellow-50 text-yellow-700" },
  { icon: HomeIcon, label: "Roofing", color: "bg-orange-50 text-orange-700" },
];

const TESTIMONIALS = [
  { name: "Mike R.", trade: "HVAC Contractor", quote: "I used to spend 2 hours on a proposal. Now it takes 90 seconds and looks better than anything I ever wrote myself.", stars: 5 },
  { name: "Sandra T.", trade: "Electrician", quote: "Sent a proposal while still in the client's driveway. They called me back before I got home. Closed the job.", stars: 5 },
  { name: "Dave K.", trade: "Plumber", quote: "My close rate went from maybe 40% to over 65% in the first month. The proposals just look so professional.", stars: 5 },
];

const PLANS = [
  { name: "Free", price: "$0", period: "/month", proposals: "3 proposals/month", features: ["AI proposal generation", "PDF download", "Basic templates"], cta: "Get Started Free", highlight: false },
  { name: "Starter", price: "$29", period: "/month", proposals: "20 proposals/month", features: ["Everything in Free", "Email delivery", "Proposal tracking", "Custom branding"], cta: "Start Starter", highlight: false },
  { name: "Pro", price: "$59", period: "/month", proposals: "Unlimited proposals", features: ["Everything in Starter", "Priority AI generation", "Advanced analytics", "Phone support"], cta: "Go Pro", highlight: true },
];

export default function Home() {
  const { user, isAuthenticated } = useAuth();
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
      {/* Navigation */}
      <nav className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg text-foreground">ProposalCraft AI</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
            <a href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Reviews</a>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Button onClick={() => navigate("/dashboard")} size="sm">
                Dashboard <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => { window.location.href = getLoginUrl(); }}>
                  Sign In
                </Button>
                <Button size="sm" onClick={handleCTA}>
                  Get Started Free
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 30% 50%, oklch(0.62 0.19 38) 0%, transparent 60%)" }} />
        <div className="relative container py-24 md:py-32">
          <div className="max-w-3xl">
            <Badge className="mb-6 bg-primary/20 text-primary border-primary/30 hover:bg-primary/20">
              <Zap className="w-3 h-3 mr-1" /> AI-Powered Proposals in 60 Seconds
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-6">
              Win More Jobs.<br />
              <span className="text-primary">Write Proposals</span><br />
              in 60 Seconds.
            </h1>
            <p className="text-lg md:text-xl text-slate-300 mb-8 max-w-2xl">
              ProposalCraft AI generates professional, branded proposals for HVAC, plumbing, electrical, and roofing contractors. Stop losing jobs to contractors who respond faster.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" onClick={handleCTA} className="text-base px-8 py-6">
                Start Free - No Credit Card <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button size="lg" variant="outline" className="text-base px-8 py-6 border-white/20 text-white hover:bg-white/10 bg-transparent">
                See How It Works
              </Button>
            </div>
            <p className="text-slate-400 text-sm mt-4">3 free proposals/month. No credit card required.</p>
          </div>
        </div>
      </section>

      {/* Trade badges */}
      <section className="border-b border-border bg-white py-8">
        <div className="container">
          <p className="text-center text-sm text-muted-foreground mb-6 font-medium uppercase tracking-wide">Built for every trade</p>
          <div className="flex flex-wrap justify-center gap-4">
            {TRADES.map(({ icon: Icon, label, color }) => (
              <div key={label} className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm ${color}`}>
                <Icon className="w-4 h-4" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-background">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Everything you need to close more jobs</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">One tool that handles the entire proposal process - from AI generation to client delivery and tracking.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-slate-50">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Contractors love ProposalCraft AI</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ name, trade, quote, stars }) => (
              <div key={name} className="bg-white border border-border rounded-xl p-6 shadow-sm">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-foreground text-sm leading-relaxed mb-4 italic">"{quote}"</p>
                <div>
                  <p className="font-semibold text-sm text-foreground">{name}</p>
                  <p className="text-xs text-muted-foreground">{trade}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-background">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Simple, transparent pricing</h2>
            <p className="text-muted-foreground text-lg">One winning proposal pays for the tool 10x over.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {PLANS.map(({ name, price, period, proposals, features, cta, highlight }) => (
              <div key={name} className={`rounded-xl border p-6 flex flex-col ${highlight ? "border-primary bg-primary text-white shadow-lg scale-105" : "border-border bg-card"}`}>
                <div className="mb-6">
                  <p className={`text-sm font-medium mb-1 ${highlight ? "text-white/80" : "text-muted-foreground"}`}>{name}</p>
                  <div className="flex items-end gap-1">
                    <span className={`text-4xl font-bold ${highlight ? "text-white" : "text-foreground"}`}>{price}</span>
                    <span className={`text-sm mb-1 ${highlight ? "text-white/70" : "text-muted-foreground"}`}>{period}</span>
                  </div>
                  <p className={`text-sm mt-1 ${highlight ? "text-white/80" : "text-muted-foreground"}`}>{proposals}</p>
                </div>
                <ul className="space-y-2.5 mb-8 flex-1">
                  {features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle className={`w-4 h-4 flex-shrink-0 ${highlight ? "text-white" : "text-primary"}`} />
                      <span className={highlight ? "text-white" : "text-foreground"}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={handleCTA}
                  variant={highlight ? "secondary" : "default"}
                  className={`w-full ${highlight ? "bg-white text-primary hover:bg-white/90" : ""}`}
                >
                  {cta} <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 bg-slate-900">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to win more jobs?</h2>
          <p className="text-slate-300 text-lg mb-8 max-w-xl mx-auto">Join thousands of contractors who generate professional proposals in seconds, not hours.</p>
          <Button size="lg" onClick={handleCTA} className="text-base px-10 py-6">
            Start Free Today <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-white py-8">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <FileText className="w-3 h-3 text-white" />
            </div>
            <span className="font-semibold text-sm text-foreground">ProposalCraft AI</span>
          </div>
          <p className="text-xs text-muted-foreground">(c) 2026 ProposalCraft AI. Built for tradespeople who want to win.</p>
        </div>
      </footer>
    </div>
  );
}
