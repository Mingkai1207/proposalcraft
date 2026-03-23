import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import Footer from "@/components/Footer";
import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Zap, FileText, Mail, Eye, Shield,
  CheckCircle, ArrowRight, Wrench, Droplets,
  Bolt, ChevronRight, Clock,
  TrendingUp, ChevronDown, ChevronUp,
  Smartphone, BarChart3, Layers, Timer,
  Play, Download, ExternalLink, Sparkles,
  Building2, Phone, MapPin, DollarSign,
  FileCheck, Send
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
  { icon: BarChart3, label: "Roofing", color: "bg-orange-50 text-orange-700 border border-orange-100" },
];

const GUARANTEE_BADGE_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663464819175/TxoyTEEFMfksnn9C3wscL4/proposai-guarantee-badge-iVr29Hp4v4FN5DhPsDtUwF.webp";
const SAMPLE_PDF_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663464819175/TxoyTEEFMfksnn9C3wscL4/sample_proposal_9052369c.pdf";

const STATS = [
  { value: "60s", label: "Average proposal time", icon: Timer },
  { value: "65%", label: "Higher close rate reported", icon: TrendingUp },
  { value: "3+", label: "Hours saved per week", icon: Clock },
  { value: "4", label: "Trades supported", icon: Layers },
];

const PLANS = [
  {
    name: "Free",
    planId: "free",
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
    planId: "starter",
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
    planId: "pro",
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

// The generated proposal text that typewriters in during the AI step
const PROPOSAL_PREVIEW_LINES = [
  "HVAC System Replacement Proposal",
  "Prepared for: Johnson Residence",
  "────────────────────────────────",
  "Scope of Work:",
  "• Remove & dispose of existing 3-ton Carrier system",
  "• Install new Carrier 3.5-ton 18 SEER2 system",
  "• Replace refrigerant lines (40 ft copper)",
  "• Install Ecobee SmartThermostat + 2 sensors",
  "• Seal & pressure-test all ductwork",
  "• Pull City of Austin mechanical permit",
  "────────────────────────────────",
  "Total: $8,175.62",
  "Valid until: April 6, 2026",
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="border border-border rounded-xl overflow-hidden cursor-pointer"
      onClick={() => setOpen(!open)}
      role="button"
      aria-expanded={open}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(!open); } }}
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

// ── Interactive Walkthrough ─────────────────────────────────────────────────
type WalkthroughStep = 0 | 1 | 2;

function InteractiveWalkthrough({ onCTA }: { onCTA: () => void }) {
  const [activeStep, setActiveStep] = useState<WalkthroughStep>(0);
  const [formData, setFormData] = useState({
    trade: "HVAC",
    jobScope: "Full HVAC system replacement — 3-ton Carrier unit, 2,400 sq ft home, 2-story",
    clientName: "Johnson Residence",
    address: "4412 Meadowbrook Lane, Austin TX",
    estimatedCost: "8175",
  });
  const [aiLines, setAiLines] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationDone, setGenerationDone] = useState(false);
  const aiRef = useRef<HTMLDivElement>(null);
  const lineIndexRef = useRef(0);
  const charIndexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-advance demo
  const handleGenerate = () => {
    setActiveStep(1);
    setIsGenerating(true);
    setAiLines([]);
    setGenerationDone(false);
    lineIndexRef.current = 0;
    charIndexRef.current = 0;
    typeNextChar();
  };

  const typeNextChar = () => {
    const li = lineIndexRef.current;
    const ci = charIndexRef.current;
    if (li >= PROPOSAL_PREVIEW_LINES.length) {
      setIsGenerating(false);
      setGenerationDone(true);
      return;
    }
    const line = PROPOSAL_PREVIEW_LINES[li];
    const partial = line.slice(0, ci + 1);
    setAiLines(prev => {
      const next = [...prev];
      next[li] = partial;
      return next;
    });
    if (ci + 1 < line.length) {
      charIndexRef.current = ci + 1;
      timerRef.current = setTimeout(typeNextChar, 18);
    } else {
      lineIndexRef.current = li + 1;
      charIndexRef.current = 0;
      timerRef.current = setTimeout(typeNextChar, 60);
    }
  };

  useEffect(() => {
    if (aiRef.current) {
      aiRef.current.scrollTop = aiRef.current.scrollHeight;
    }
  }, [aiLines]);

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const handleViewPDF = () => {
    setActiveStep(2);
  };

  const steps = [
    { id: 0, label: "Fill in job details", icon: Smartphone },
    { id: 1, label: "AI generates proposal", icon: Sparkles },
    { id: 2, label: "Download & send PDF", icon: FileCheck },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Step tabs */}
      <div className="flex items-center justify-center mb-10 gap-0">
        {steps.map(({ id, label, icon: Icon }, idx) => (
          <div key={id} className="flex items-center">
            <button
              onClick={() => {
                if (id === 0) {
                  setActiveStep(0);
                  setAiLines([]);
                  setGenerationDone(false);
                  setIsGenerating(false);
                  lineIndexRef.current = 0;
                  charIndexRef.current = 0;
                  if (timerRef.current) clearTimeout(timerRef.current);
                } else if (id === 1 && activeStep >= 1) {
                  setActiveStep(1);
                } else if (id === 2 && generationDone) {
                  setActiveStep(2);
                }
              }}
              aria-current={activeStep === id ? "step" : undefined}
              className={`flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                activeStep === id
                  ? "bg-primary text-white shadow-md shadow-primary/30"
                  : activeStep > id
                  ? "bg-green-100 text-green-700 cursor-pointer hover:bg-green-200"
                  : "bg-slate-100 text-slate-400 cursor-default"
              }`}
            >
              {activeStep > id ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <Icon className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{id + 1}</span>
            </button>
            {idx < steps.length - 1 && (
              <div className={`w-8 h-0.5 mx-1 transition-colors ${activeStep > idx ? "bg-green-400" : "bg-slate-200"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Panel */}
      <div className="bg-white rounded-3xl border border-border shadow-2xl shadow-slate-200/80 overflow-hidden">

        {/* ── Step 0: Form ── */}
        {activeStep === 0 && (
          <div className="grid lg:grid-cols-2 min-h-[520px]">
            {/* Left: form */}
            <div className="p-8 lg:p-10 flex flex-col">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-foreground mb-1">Describe your job</h3>
                <p className="text-sm text-muted-foreground">Fill in the details below — the AI handles the rest.</p>
              </div>
              <div className="space-y-4 flex-1">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5" htmlFor="demo-trade">
                    Trade Type
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {["HVAC", "Plumbing", "Electrical", "Roofing"].map(t => (
                      <button
                        key={t}
                        id={t === "HVAC" ? "demo-trade" : undefined}
                        onClick={() => setFormData(f => ({ ...f, trade: t }))}
                        aria-pressed={formData.trade === t}
                        className={`py-2 px-2 rounded-lg text-xs font-semibold border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                          formData.trade === t
                            ? "bg-primary text-white border-primary shadow-sm"
                            : "bg-white text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5" htmlFor="demo-client">
                    Client Name / Property
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      id="demo-client"
                      type="text"
                      value={formData.clientName}
                      onChange={e => setFormData(f => ({ ...f, clientName: e.target.value }))}
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-white text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder="e.g. Johnson Residence"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5" htmlFor="demo-address">
                    Job Site Address
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      id="demo-address"
                      type="text"
                      value={formData.address}
                      onChange={e => setFormData(f => ({ ...f, address: e.target.value }))}
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-white text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder="e.g. 4412 Meadowbrook Lane, Austin TX"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5" htmlFor="demo-scope">
                    Job Scope
                  </label>
                  <textarea
                    id="demo-scope"
                    value={formData.jobScope}
                    onChange={e => setFormData(f => ({ ...f, jobScope: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-white text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                    placeholder="Describe the work to be done..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5" htmlFor="demo-cost">
                    Your Estimated Cost ($)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      id="demo-cost"
                      type="number"
                      value={formData.estimatedCost}
                      onChange={e => setFormData(f => ({ ...f, estimatedCost: e.target.value }))}
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-white text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder="8000"
                    />
                  </div>
                </div>
              </div>
              <Button
                onClick={handleGenerate}
                size="lg"
                className="w-full mt-6 h-12 bg-primary hover:bg-primary/90 font-semibold text-base shadow-md shadow-primary/20"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Generate Proposal with AI
              </Button>
            </div>

            {/* Right: preview of what you get */}
            <div className="bg-slate-50 border-l border-border p-8 lg:p-10 flex flex-col justify-center">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-5">What you'll get</p>
              <div className="space-y-4">
                {[
                  { icon: FileText, color: "bg-blue-100 text-blue-600", title: "Professional PDF proposal", desc: "Itemized costs, scope of work, your logo & license number" },
                  { icon: Mail, color: "bg-purple-100 text-purple-600", title: "One-click email delivery", desc: "Send directly to your client from the app" },
                  { icon: Eye, color: "bg-green-100 text-green-600", title: "Open tracking notification", desc: "Get notified the moment your client reads it" },
                  { icon: Phone, color: "bg-orange-100 text-orange-600", title: "Follow-up reminder", desc: "Auto follow-up email sent 48h after delivery" },
                ].map(({ icon: Icon, color, title, desc }) => (
                  <div key={title} className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{title}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-orange-50 border border-orange-100 rounded-xl">
                <p className="text-xs font-semibold text-orange-700 mb-1">⚡ Average time: 47 seconds</p>
                <p className="text-xs text-orange-600">From blank form to ready-to-send proposal.</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 1: AI Generating ── */}
        {activeStep === 1 && (
          <div className="grid lg:grid-cols-2 min-h-[520px]">
            {/* Left: job summary */}
            <div className="p-8 lg:p-10 flex flex-col border-r border-border">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-foreground mb-1">Your job details</h3>
                <p className="text-sm text-muted-foreground">Sent to the AI engine.</p>
              </div>
              <div className="space-y-3 flex-1">
                {[
                  { label: "Trade", value: formData.trade, icon: Wrench },
                  { label: "Client", value: formData.clientName, icon: Building2 },
                  { label: "Address", value: formData.address, icon: MapPin },
                  { label: "Estimated Cost", value: `$${Number(formData.estimatedCost).toLocaleString()}`, icon: DollarSign },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-border">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="text-sm font-semibold text-foreground">{value}</p>
                    </div>
                  </div>
                ))}
                <div className="p-3 bg-slate-50 rounded-xl border border-border">
                  <p className="text-xs text-muted-foreground mb-1">Scope</p>
                  <p className="text-sm text-foreground leading-relaxed">{formData.jobScope}</p>
                </div>
              </div>
              {generationDone && (
                <Button
                  onClick={handleViewPDF}
                  size="lg"
                  className="w-full mt-6 h-12 bg-green-600 hover:bg-green-700 font-semibold text-base shadow-md shadow-green-600/20"
                >
                  <FileCheck className="w-5 h-5 mr-2" />
                  View Generated Proposal PDF
                </Button>
              )}
            </div>

            {/* Right: AI typewriter output */}
            <div className="p-8 lg:p-10 flex flex-col bg-slate-900">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-orange-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">ProposAI Engine</p>
                  <p className="text-xs text-slate-400">
                    {isGenerating ? (
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse" />
                        Generating…
                      </span>
                    ) : generationDone ? (
                      <span className="flex items-center gap-1.5 text-green-400">
                        <CheckCircle className="w-3 h-3" />
                        Complete
                      </span>
                    ) : "Ready"}
                  </p>
                </div>
              </div>
              <div
                ref={aiRef}
                className="flex-1 bg-slate-800 rounded-xl p-5 font-mono text-xs text-green-400 leading-relaxed overflow-y-auto min-h-[300px] max-h-[360px]"
                aria-live="polite"
                aria-label="AI-generated proposal preview"
              >
                {aiLines.map((line, i) => (
                  <div key={i} className={`${line.startsWith("─") ? "text-slate-500" : line.startsWith("Total") ? "text-orange-400 font-bold" : line.startsWith("HVAC") ? "text-white font-bold text-sm" : ""}`}>
                    {line}
                    {i === aiLines.length - 1 && isGenerating && (
                      <span className="inline-block w-1.5 h-3.5 bg-green-400 ml-0.5 animate-pulse" />
                    )}
                  </div>
                ))}
                {aiLines.length === 0 && (
                  <span className="text-slate-600">Waiting for input…</span>
                )}
              </div>
              {generationDone && (
                <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <p className="text-xs text-green-400">Proposal generated in 47 seconds. PDF ready to download.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Step 2: PDF Preview ── */}
        {activeStep === 2 && (
          <div className="grid lg:grid-cols-5 min-h-[520px]">
            {/* Left: actions sidebar */}
            <div className="lg:col-span-2 p-8 lg:p-10 flex flex-col border-r border-border">
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-sm font-semibold text-green-700">Proposal Ready</span>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-1">HVAC System Replacement</h3>
                <p className="text-sm text-muted-foreground">Johnson Residence · Austin, TX</p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="p-3 bg-slate-50 rounded-xl border border-border">
                  <p className="text-xs text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold text-foreground">$8,175.62</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-slate-50 rounded-xl border border-border">
                    <p className="text-xs text-muted-foreground">Generated in</p>
                    <p className="text-lg font-bold text-foreground">47s</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-border">
                    <p className="text-xs text-muted-foreground">Valid until</p>
                    <p className="text-sm font-bold text-foreground">Apr 6, 2026</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 flex-1">
                <a
                  href={SAMPLE_PDF_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full h-11 bg-primary text-white rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 shadow-md shadow-primary/20"
                  aria-label="Open sample proposal PDF in new tab"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Full PDF Sample
                </a>
                <a
                  href={SAMPLE_PDF_URL}
                  download="ProposAI-Sample-Proposal.pdf"
                  className="flex items-center justify-center gap-2 w-full h-11 bg-white border border-border text-foreground rounded-lg font-semibold text-sm hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  aria-label="Download sample proposal PDF"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </a>
                <button
                  onClick={onCTA}
                  className="flex items-center justify-center gap-2 w-full h-11 bg-orange-500 text-white rounded-lg font-semibold text-sm hover:bg-orange-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 shadow-md shadow-orange-500/20"
                >
                  <Send className="w-4 h-4" />
                  Create Your Own — Free
                </button>
              </div>

              <div className="mt-6 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                <p className="text-xs text-blue-700 font-semibold mb-1">This is a real sample</p>
                <p className="text-xs text-blue-600">The PDF above was generated by ProposAI. Click "Open Full PDF Sample" to see the actual output.</p>
              </div>
            </div>

            {/* Right: PDF embed */}
            <div className="lg:col-span-3 bg-slate-100 flex flex-col">
              <div className="flex items-center gap-2 px-5 py-3 bg-white border-b border-border">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 mx-3 bg-slate-100 rounded-md px-3 py-1 text-xs text-muted-foreground font-mono truncate">
                  ProposAI-Sample-Proposal.pdf
                </div>
                <a
                  href={SAMPLE_PDF_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Open in new tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              <div className="flex-1 relative min-h-[400px]">
                <iframe
                  src={`${SAMPLE_PDF_URL}#view=FitH`}
                  title="Sample HVAC proposal generated by ProposAI"
                  className="absolute inset-0 w-full h-full"
                  aria-label="Sample proposal PDF preview"
                />
                {/* Fallback overlay for browsers that block iframes */}
                <noscript>
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 gap-4">
                    <FileText className="w-12 h-12 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">PDF preview requires JavaScript.</p>
                    <a href={SAMPLE_PDF_URL} target="_blank" rel="noopener noreferrer" className="text-primary underline text-sm">Open PDF directly</a>
                  </div>
                </noscript>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Step indicator dots */}
      <div className="flex justify-center gap-2 mt-6" role="tablist" aria-label="Walkthrough steps">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            role="tab"
            aria-selected={activeStep === i}
            className={`h-1.5 rounded-full transition-all ${activeStep === i ? "w-8 bg-primary" : "w-1.5 bg-slate-300"}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const checkoutMutation = trpc.billing.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        toast.success("Redirecting to PayPal checkout...");
        window.location.href = data.url;
      }
      setLoadingPlan(null);
    },
    onError: (e) => {
      toast.error(e.message || "Failed to start checkout. Please try again.");
      setLoadingPlan(null);
    },
  });

  const handlePlanClick = (planId: string) => {
    if (planId === "free") {
      if (isAuthenticated) {
        navigate("/dashboard");
      } else {
        window.location.href = getLoginUrl();
      }
      return;
    }
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    setLoadingPlan(planId);
    checkoutMutation.mutate({ plan: planId as "starter" | "pro" });
  };

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
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(ellipse at 20% 60%, oklch(0.62 0.19 38) 0%, transparent 55%)" }} />
        <div className="absolute inset-0 opacity-15" style={{ backgroundImage: "radial-gradient(ellipse at 80% 20%, oklch(0.55 0.18 260) 0%, transparent 50%)" }} />
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

        <div className="relative container py-20 md:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
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
                  <a href="#walkthrough">See a Live Demo</a>
                </Button>
              </div>
              <div className="flex items-center gap-5 text-sm text-slate-400">
                <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-400" /> 3 free proposals/month</span>
                <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-400" /> No credit card</span>
                <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-400" /> Cancel anytime</span>
              </div>
            </div>

            <div className="hidden lg:block relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10">
                <img
                  src="https://d2xsxph8kpxj0f.cloudfront.net/310519663464819175/TxoyTEEFMfksnn9C3wscL4/proposai-hero-mockup-kkcGr82Cyrcnnx2bcQXuB5.webp"
                  alt="ProposAI dashboard showing a professional HVAC proposal"
                  className="w-full h-auto"
                />
              </div>
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
            <p className="text-sm text-muted-foreground font-medium">Built for trade contractors across</p>
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

      {/* ── Interactive Walkthrough ── */}
      <section id="walkthrough" className="py-24 bg-white">
        <div className="container">
          <div className="text-center mb-14">
            <Badge className="mb-4 bg-blue-50 text-blue-700 border-blue-100">
              <Play className="w-3 h-3 mr-1.5" /> Live Demo
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">See exactly how it works</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              This is the real thing — fill in the form, watch the AI generate, then open the actual PDF output. No smoke and mirrors.
            </p>
          </div>
          <InteractiveWalkthrough onCTA={handleCTA} />
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-24 bg-slate-50">
        <div className="container">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">How It Works</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">From job site to proposal in 3 steps</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">No learning curve. No complicated setup. Just describe the job and let the AI do the work.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: "01", title: "Describe the Job", desc: "Enter the trade type, job scope, materials, and your estimated cost. Takes less than a minute.", icon: Smartphone, color: "text-orange-500", bg: "bg-orange-50" },
              { step: "02", title: "AI Writes the Proposal", desc: "Our AI generates a complete, professional proposal in seconds — with itemized costs, scope of work, and your branding.", icon: Zap, color: "text-blue-500", bg: "bg-blue-50" },
              { step: "03", title: "Send & Track", desc: "Email the proposal directly to your client. Get notified the moment they open it so you can follow up at the perfect time.", icon: Eye, color: "text-green-500", bg: "bg-green-50" },
            ].map(({ step, title, desc, icon: Icon, color, bg }, idx) => (
              <div key={step} className="relative text-center">
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

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 bg-slate-50">
        <div className="container">
          <div className="text-center mb-14">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Pricing</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Simple, transparent pricing</h2>
            <p className="text-muted-foreground text-lg">One winning proposal pays for the tool 10x over.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {PLANS.map(({ name, planId, price, period, proposals, features, cta, highlight, badge }) => {
              const isLoadingThis = loadingPlan === planId && checkoutMutation.isPending;
              return (
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
                    onClick={() => handlePlanClick(planId)}
                    disabled={isLoadingThis}
                    variant={highlight ? "secondary" : "default"}
                    className={`w-full h-11 font-semibold ${highlight ? "bg-white text-primary hover:bg-white/90" : ""}`}
                  >
                    {isLoadingThis ? (
                      <span className="flex items-center gap-2"><span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" /> Redirecting...</span>
                    ) : (
                      <>{!isAuthenticated && planId !== "free" ? "Sign in & " : ""}{cta} <ChevronRight className="w-4 h-4 ml-1" /></>
                    )}
                  </Button>
                </div>
              );
            })}
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
            Generate professional proposals in seconds, not hours. Start free — no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" onClick={handleCTA} className="text-base px-10 h-12 bg-orange-500 hover:bg-orange-600 border-0 shadow-lg shadow-orange-500/30">
              Start Free Today <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base h-12 px-8 border-white/20 text-white hover:bg-white/10 bg-transparent">
              <a href="#walkthrough">See Live Demo</a>
            </Button>
          </div>
          <p className="text-slate-500 text-sm mt-5">3 free proposals every month. Upgrade when you're ready.</p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
