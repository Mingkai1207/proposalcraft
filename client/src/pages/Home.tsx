import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import Footer from "@/components/Footer";
import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { trackWalkthroughStep, trackCopyToClipboard, trackPdfDownload, trackCtaClick } from "@/lib/analytics";
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
    title: "AI-Powered in Minutes",
    desc: "Fill in a guided form, review an AI-compiled summary, then let ProposAI write a complete, professional proposal — with analytic charts included.",
    color: "bg-orange-50 text-orange-600",
  },
  {
    icon: FileText,
    title: "PDF, Word & Google Doc",
    desc: "Every proposal is exported as a polished PDF (free for all), plus Word and Google Doc for Starter and Pro users.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: Layers,
    title: "Your Own Templates",
    desc: "Upload a past proposal or save any generated proposal as a template. ProposAI will follow its exact structure for every new job.",
    color: "bg-purple-50 text-purple-600",
  },
  {
    icon: Sparkles,
    title: "Revise with AI",
    desc: "Not happy with a section? Describe the change and ProposAI rewrites the proposal and regenerates all your documents instantly.",
    color: "bg-green-50 text-green-600",
  },
  {
    icon: Shield,
    title: "Profile Auto-Fill",
    desc: "Save your business details once — name, license, phone, logo — and ProposAI fills them into every proposal automatically.",
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

const TRADE_SAMPLE_PDFS: Record<string, string> = {
  HVAC: "https://d2xsxph8kpxj0f.cloudfront.net/310519663464819175/TxoyTEEFMfksnn9C3wscL4/sample_proposal_hvac_1b529b86.pdf",
  Plumbing: "https://d2xsxph8kpxj0f.cloudfront.net/310519663464819175/TxoyTEEFMfksnn9C3wscL4/sample_proposal_plumbing_da05dcab.pdf",
  Electrical: "https://d2xsxph8kpxj0f.cloudfront.net/310519663464819175/TxoyTEEFMfksnn9C3wscL4/sample_proposal_electrical_4dd05396.pdf",
  Roofing: "https://d2xsxph8kpxj0f.cloudfront.net/310519663464819175/TxoyTEEFMfksnn9C3wscL4/sample_proposal_roofing_f517591e.pdf",
};

const SAMPLE_PDF_URL = TRADE_SAMPLE_PDFS.HVAC;

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
      "Guided form with profile auto-fill",
      "AI summary review before generation",
      "PDF download",
      "Save & upload templates",
    ],
    cta: "Get Started Free",
    highlight: false,
    badge: null,
  },
  {
    name: "Starter",
    planId: "starter",
    price: "$5.99",
    period: "/month",
    proposals: "20 proposals/month",
    features: [
      "Everything in Free — no watermark",
      "Word (.docx) & Google Doc export",
      "Revise with AI chatbot",
      "Custom logo & branding",
      "Multi-language (EN, ZH, ES, FR)",
      "Template-based generation",
    ],
    cta: "Start Starter Plan",
    highlight: false,
    badge: "Most Popular",
  },
  {
    name: "Pro",
    planId: "pro",
    price: "$9.99",
    period: "/month",
    proposals: "Unlimited proposals",
    features: [
      "Everything in Starter",
      "Unlimited proposal generation",
      "Bulk export all proposals (ZIP)",
      "Analytics: win rate & revenue",
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
    a: "None at all. Fill in a guided form, review the AI-compiled summary, and ProposAI generates a complete professional proposal with charts. No writing or formatting skills needed.",
  },
  {
    q: "What file formats does ProposAI export?",
    a: "All users get a polished PDF. Starter and Pro users also get a Word (.docx) file and a Google Doc, all generated automatically in one step.",
  },
  {
    q: "Can I use my own proposal format?",
    a: "Yes. Upload any past proposal or save a generated one as a template. ProposAI will follow its exact structure and format when writing new proposals.",
  },
  {
    q: "Can I edit the proposal after it's generated?",
    a: "Yes. Starter and Pro users can use the \"Revise with AI\" chatbot to describe any changes. ProposAI rewrites the relevant sections and regenerates all your documents instantly.",
  },
  {
    q: "Can I add my own logo and business info?",
    a: "Yes. Save your business name, logo, license number, and phone once in your profile. ProposAI auto-fills this information into every proposal you generate.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. No long-term contracts. Cancel from your account settings at any time. Free tier access remains after cancellation.",
  },
];

const COMPARISON = [
  { feature: "Time to write a proposal", manual: "1–3 hours", proposai: "A few minutes" },
  { feature: "Professional formatting", manual: "Inconsistent", proposai: "Always polished" },
  { feature: "Export formats", manual: "Manual Word/PDF", proposai: "PDF, Word & Google Doc" },
  { feature: "Charts & visuals", manual: "DIY in Excel", proposai: "Auto-generated by AI" },
  { feature: "Reusable templates", manual: "Copy-paste old docs", proposai: "Save any proposal as template" },
  { feature: "Revisions", manual: "Rewrite from scratch", proposai: "Describe change, AI rewrites" },
  { feature: "Cost", manual: "Your time = $$$", proposai: "From $0/month" },
];


// Fixed illustration data — John Smith HVAC proposal (non-editable)
const DEMO_PDF_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663464819175/TxoyTEEFMfksnn9C3wscL4/pasted_file_1SBXzL_HVAC_Replacement_Proposal_JohnSmith_edb68410.pdf";
const DEMO_DATA = {
  trade: "HVAC",
  clientName: "Mr. John Smith",
  address: "123 Main St.",
  estimatedCost: "8,500",
  jobScope: "Full HVAC system replacement — 4-ton Carrier unit (16 SEER), 92.1% AFUE furnace, ecobee smart thermostat, EPA-certified installation, 5-day project",
  total: "$8,500.00",
  generatedIn: "47s",
  validUntil: "Jul 10, 2024",
  date: "June 10, 2024",
  projectStart: "June 17, 2024",
};
const DEMO_TYPEWRITER_LINES = [
  "HVAC System Replacement Proposal",
  "Prepared for: Mr. John Smith",
  "────────────────────────────────",
  "Scope of Work:",
  "• Remove existing outdoor condensing unit & furnace",
  "• Install Carrier 4-ton 16 SEER condenser",
  "• Install Carrier furnace 92.1% AFUE",
  "• Install ecobee smart thermostat",
  "• Fabricate & install copper refrigerant line set",
  "• Triple evacuation + system charge (R-410A)",
  "• Pull permit & final commissioning",
  "────────────────────────────────",
  "Total: $8,500.00",
  "Project Start: June 17, 2024",
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
  const [aiLines, setAiLines] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationDone, setGenerationDone] = useState(false);
  const aiRef = useRef<HTMLDivElement>(null);
  const lineIndexRef = useRef(0);
  const charIndexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const typeNextChar = () => {
    const li = lineIndexRef.current;
    const ci = charIndexRef.current;
    if (li >= DEMO_TYPEWRITER_LINES.length) {
      setIsGenerating(false);
      setGenerationDone(true);
      trackWalkthroughStep("ai_generation_complete", { trade: DEMO_DATA.trade });
      return;
    }
    const line = DEMO_TYPEWRITER_LINES[li];
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

  const handleGenerate = () => {
    setActiveStep(1);
    setIsGenerating(true);
    setAiLines([]);
    setGenerationDone(false);
    lineIndexRef.current = 0;
    charIndexRef.current = 0;
    trackWalkthroughStep("ai_generation_start", { trade: DEMO_DATA.trade });
    typeNextChar();
  };

  const handleSkipAnimation = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsGenerating(false);
    setGenerationDone(true);
    trackWalkthroughStep("ai_generation_complete", { trade: DEMO_DATA.trade, skipped: true });
  };

  const handleViewPDF = () => {
    setActiveStep(2);
    trackWalkthroughStep("pdf_view", { trade: DEMO_DATA.trade });
  };

  useEffect(() => {
    if (aiRef.current) {
      aiRef.current.scrollTop = aiRef.current.scrollHeight;
    }
  }, [aiLines]);

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

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

        {/* ── Step 0: Fixed job details display ── */}
        {activeStep === 0 && (
          <div className="grid lg:grid-cols-2 min-h-[520px]">
            {/* Left: read-only job details */}
            <div className="p-8 lg:p-10 flex flex-col">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-foreground mb-1">Sample job details</h3>
                <p className="text-sm text-muted-foreground">A real HVAC replacement job — click Generate to see the AI in action.</p>
              </div>
              <div className="space-y-3 flex-1">
                {/* Trade badge */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Trade Type</p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold shadow-sm">
                    <Wrench className="w-4 h-4" />
                    {DEMO_DATA.trade}
                  </div>
                </div>
                {/* Read-only fields */}
                {[
                  { label: "Client Name", value: DEMO_DATA.clientName, icon: Building2 },
                  { label: "Job Site Address", value: DEMO_DATA.address, icon: MapPin },
                  { label: "Estimated Cost", value: `$${DEMO_DATA.estimatedCost}`, icon: DollarSign },
                ].map(({ label, value, icon: FieldIcon }) => (
                  <div key={label}>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{label}</p>
                    <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-border bg-slate-50 text-sm text-foreground">
                      <FieldIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span>{value}</span>
                    </div>
                  </div>
                ))}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Job Scope</p>
                  <div className="px-3 py-2.5 rounded-lg border border-border bg-slate-50 text-sm text-foreground leading-relaxed">
                    {DEMO_DATA.jobScope}
                  </div>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-border">
                <Button
                  onClick={handleGenerate}
                  size="lg"
                  className="w-full h-12 bg-primary hover:bg-primary/90 font-semibold text-base shadow-md shadow-primary/20 animate-pulse hover:animate-none transition-all"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate Proposal with AI
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-3">Watch the AI write your proposal in real-time →</p>
              </div>
            </div>

            {/* Right: animated mock proposal preview */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 border-l border-white/10 p-6 lg:p-8 flex flex-col justify-center relative overflow-hidden">
              {/* Background grid */}
              <div className="absolute inset-0 opacity-5" style={{backgroundImage: 'linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)', backgroundSize: '24px 24px'}} />
              {/* Badge */}
              <div className="relative z-10">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-green-400 text-xs font-semibold mb-4">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  Sample Output Preview
                </div>
                {/* Mock proposal card */}
                <div className="bg-white rounded-2xl shadow-2xl shadow-black/40 overflow-hidden">
                  {/* Header */}
                  <div className="bg-primary px-5 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-bold text-sm">HVAC Replacement Proposal</p>
                        <p className="text-primary-foreground/70 text-xs mt-0.5">Mr. John Smith · 123 Main St</p>
                      </div>
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                        <Wrench className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </div>
                  {/* Cost breakdown */}
                  <div className="px-5 py-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Cost Breakdown</p>
                    {[
                      { label: "Equipment & Materials", amount: "$5,200", pct: 61 },
                      { label: "Labor & Installation", amount: "$2,100", pct: 25 },
                      { label: "Permits & Inspection", amount: "$1,200", pct: 14 },
                    ].map(({ label, amount, pct }) => (
                      <div key={label} className="mb-2.5">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-slate-600">{label}</span>
                          <span className="text-xs font-bold text-slate-800">{amount}</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-1000"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Total Estimate</span>
                      <span className="text-base font-extrabold text-primary">$8,500</span>
                    </div>
                  </div>
                  {/* Footer badges */}
                  <div className="px-5 pb-4 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"><FileText className="w-3 h-3" /> PDF</span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium"><FileCheck className="w-3 h-3" /> Word</span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium"><CheckCircle className="w-3 h-3" /> Charts</span>
                  </div>
                </div>
                {/* Time badge */}
                <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                  <Timer className="w-3.5 h-3.5 text-orange-400" />
                  <span>Generated in <span className="text-orange-400 font-semibold">47 seconds</span> · Ready to send</span>
                </div>
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
                  { label: "Trade", value: DEMO_DATA.trade, icon: Wrench },
                  { label: "Client", value: DEMO_DATA.clientName, icon: Building2 },
                  { label: "Address", value: DEMO_DATA.address, icon: MapPin },
                  { label: "Estimated Cost", value: `$${DEMO_DATA.estimatedCost}`, icon: DollarSign },
                ].map(({ label, value, icon: FieldIcon }) => (
                  <div key={label} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-border">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FieldIcon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="text-sm font-semibold text-foreground">{value}</p>
                    </div>
                  </div>
                ))}
                <div className="p-3 bg-slate-50 rounded-xl border border-border">
                  <p className="text-xs text-muted-foreground mb-1">Scope</p>
                  <p className="text-sm text-foreground leading-relaxed">{DEMO_DATA.jobScope}</p>
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
              {isGenerating && (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={handleSkipAnimation}
                    className="text-xs text-slate-400 hover:text-slate-300 underline transition-colors"
                  >
                    Skip animation
                  </button>
                </div>
              )}
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
                <h3 className="text-xl font-bold text-foreground mb-1">{DEMO_DATA.trade} Proposal</h3>
                <p className="text-sm text-muted-foreground">{DEMO_DATA.clientName} · {DEMO_DATA.address}</p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="p-3 bg-slate-50 rounded-xl border border-border">
                  <p className="text-xs text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold text-foreground">{DEMO_DATA.total}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-slate-50 rounded-xl border border-border">
                    <p className="text-xs text-muted-foreground">Generated in</p>
                    <p className="text-lg font-bold text-foreground">{DEMO_DATA.generatedIn}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-border">
                    <p className="text-xs text-muted-foreground">Proposal date</p>
                    <p className="text-sm font-bold text-foreground">Jun 10, 2024</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 flex-1">
                <a
                  href={DEMO_PDF_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full h-11 bg-primary text-white rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 shadow-md shadow-primary/20"
                  aria-label="Open sample proposal PDF in new tab"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Full PDF Sample
                </a>
                <a
                  href={DEMO_PDF_URL}
                  download="ProposAI-Sample-HVAC-Proposal.pdf"
                  onClick={() => trackPdfDownload(DEMO_DATA.trade)}
                  className="flex items-center justify-center gap-2 w-full h-11 bg-white border border-border text-foreground rounded-lg font-semibold text-sm hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  aria-label="Download sample proposal PDF"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </a>
                <button
                  onClick={() => {
                    trackCtaClick("get_started");
                    onCTA();
                  }}
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
                  ProposAI-HVAC-JohnSmith-Proposal.pdf
                </div>
                <a
                  href={DEMO_PDF_URL}
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
                  src={`${DEMO_PDF_URL}#view=FitH`}
                  title="Sample HVAC proposal generated by ProposAI for Mr. John Smith"
                  className="absolute inset-0 w-full h-full"
                  aria-label="Sample proposal PDF preview"
                />
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

  // SEO: set page title and meta keywords for homepage
  useEffect(() => {
    document.title = "ProposAI — AI Proposals for Trade Contractors";
    let meta = document.querySelector('meta[name="keywords"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "keywords";
      document.head.appendChild(meta);
    }
    meta.content = "AI proposal generator, contractor proposals, HVAC proposal, plumbing proposal, electrical proposal, roofing proposal, job estimate software, trade contractor tools";
    return () => {
      document.title = "ProposAI";
    };
  }, []);
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

            <div className="hidden lg:flex relative items-center justify-center">
              {/* Ambient glow */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-80 h-80 bg-orange-500/20 rounded-full blur-3xl" />
                <div className="absolute w-64 h-64 bg-blue-500/10 rounded-full blur-3xl translate-x-16 -translate-y-8" />
              </div>
              {/* Main proposal card */}
              <div className="relative z-10 w-full max-w-sm">
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl shadow-black/40 border border-white/20 overflow-hidden">
                  {/* Card header */}
                  <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-5 py-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center">
                          <Wrench className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div>
                          <p className="text-white font-bold text-xs">ProposAI</p>
                          <p className="text-slate-400 text-xs">Proposal Generated</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 rounded-full">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-green-400 text-xs font-medium">Ready</span>
                      </div>
                    </div>
                    <div className="bg-white/10 rounded-xl px-4 py-3">
                      <p className="text-white font-bold text-sm">HVAC System Replacement</p>
                      <p className="text-slate-300 text-xs mt-0.5">Mr. John Smith · 123 Main St, Austin TX</p>
                    </div>
                  </div>
                  {/* Cost breakdown */}
                  <div className="px-5 py-4 bg-white">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Cost Breakdown</p>
                    {[
                      { label: "Equipment & Materials", amount: "$5,200", pct: 61, color: "bg-blue-500" },
                      { label: "Labor & Installation", amount: "$2,100", pct: 25, color: "bg-orange-500" },
                      { label: "Permits & Inspection", amount: "$1,200", pct: 14, color: "bg-slate-400" },
                    ].map(({ label, amount, pct, color }) => (
                      <div key={label} className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-slate-600">{label}</span>
                          <span className="text-xs font-bold text-slate-800">{amount}</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    ))}
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-700">Total Estimate</span>
                      <span className="text-xl font-extrabold text-primary">$8,500</span>
                    </div>
                  </div>
                  {/* Footer */}
                  <div className="px-5 pb-4 bg-white flex items-center justify-between">
                    <div className="flex gap-1.5">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">PDF</span>
                      <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs font-medium">Word</span>
                      <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs font-medium">Charts</span>
                    </div>
                    <span className="text-xs text-slate-400">Jun 10, 2024</span>
                  </div>
                </div>
                {/* Floating badge: generated time */}
                <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-xl px-3 py-2.5 flex items-center gap-2.5 border border-border">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Zap className="w-4 h-4 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Generated in 47s</p>
                    <p className="text-xs text-muted-foreground">HVAC proposal ready</p>
                  </div>
                </div>
                {/* Floating badge: client viewed */}
                <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-xl px-3 py-2.5 flex items-center gap-2.5 border border-border">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Proposal Opened</p>
                    <p className="text-xs text-muted-foreground">Client viewed 2 min ago</p>
                  </div>
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
            <Badge className="mb-4 bg-purple-50 text-purple-700 border-purple-100">Powered by Anthropic</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Best-in-class AI for every plan</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">ProposAI runs on Anthropic's Claude — the AI model trusted by professionals for its polished writing, careful reasoning, and persuasive tone.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {[
              {
                flag: "🇺🇸",
                name: "Claude Sonnet 4.6",
                provider: "Anthropic",
                badge: "All Plans — Free",
                badgeColor: "bg-blue-100 text-blue-700",
                desc: "Fast, capable, and available to every user. Writes polished, professional proposals with excellent structure and persuasive language. Perfect for daily use.",
                tags: ["All plans", "Fast", "Professional"],
                highlight: false,
              },
              {
                flag: "🇺🇸",
                name: "Claude Opus 4.6",
                provider: "Anthropic",
                badge: "Starter & Pro",
                badgeColor: "bg-purple-100 text-purple-700",
                desc: "Anthropic's most powerful model. Deeply reasoned, highly persuasive proposals that stand out from the competition. Ideal for complex, high-value jobs where winning matters most.",
                tags: ["Paid plans", "Maximum quality", "Complex jobs"],
                highlight: true,
              },
            ].map(({ flag, name, provider, badge, badgeColor, desc, tags, highlight }) => (
              <div key={name} className={`relative border rounded-2xl p-6 hover:shadow-md transition-shadow ${
                highlight ? "bg-purple-50 border-purple-200 shadow-sm" : "bg-slate-50 border-border"
              }`}>
                {highlight && (
                  <div className="absolute -top-3 left-6 text-xs font-bold px-3 py-1 rounded-full bg-purple-600 text-white">
                    Premium Quality
                  </div>
                )}
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
                    <span key={t} className={`text-xs border px-2 py-0.5 rounded-full ${
                      highlight ? "bg-purple-100 border-purple-200 text-purple-700" : "bg-white border-border text-muted-foreground"
                    }`}>{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-8">Switch models anytime in Settings. Claude Opus 4.6 unlocks automatically when you upgrade.</p>
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
