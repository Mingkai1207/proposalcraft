import { useAuth } from "@/_core/hooks/useAuth";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import Footer from "@/components/Footer";
import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { trackWalkthroughStep, trackPdfDownload, trackCtaClick } from "@/lib/analytics";
import {
  Zap, FileText, Mail, Eye, Shield,
  CheckCircle, ArrowRight, Wrench, Droplets,
  Bolt, ChevronRight, Clock,
  TrendingUp, ChevronDown, ChevronUp,
  Smartphone, BarChart3, Layers, Timer,
  Play, Download, ExternalLink, Sparkles,
  Building2, MapPin, DollarSign,
  FileCheck, Send
} from "lucide-react";

const GUARANTEE_BADGE_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663464819175/TxoyTEEFMfksnn9C3wscL4/proposai-guarantee-badge-iVr29Hp4v4FN5DhPsDtUwF.webp";

const DEMO_PDF_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663464819175/TxoyTEEFMfksnn9C3wscL4/pasted_file_1SBXzL_HVAC_Replacement_Proposal_JohnSmith_edb68410.pdf";

const DEMO_DATA = {
  trade: "HVAC",
  clientName: "Mr. John Smith",
  address: "123 Main St.",
  estimatedCost: "8,500",
  jobScope: "Full HVAC system replacement — 4-ton Carrier unit (16 SEER), 92.1% AFUE furnace, ecobee smart thermostat, EPA-certified installation, 5-day project",
  total: "$8,500.00",
  generatedIn: "47s",
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

type TFunction = (key: string) => string;

function InteractiveWalkthrough({ onCTA, t }: { onCTA: () => void; t: TFunction }) {
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
    { id: 0, label: t("liveDemo.step0Label"), icon: Smartphone },
    { id: 1, label: t("liveDemo.step1Label"), icon: Sparkles },
    { id: 2, label: t("liveDemo.step2Label"), icon: FileCheck },
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
                <h3 className="text-xl font-bold text-foreground mb-1">{t("liveDemo.sampleJobTitle")}</h3>
                <p className="text-sm text-muted-foreground">{t("liveDemo.sampleJobDesc")}</p>
              </div>
              <div className="space-y-3 flex-1">
                {/* Trade badge */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{t("liveDemo.tradeType")}</p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold shadow-sm">
                    <Wrench className="w-4 h-4" />
                    {DEMO_DATA.trade}
                  </div>
                </div>
                {/* Read-only fields */}
                {[
                  { labelKey: "liveDemo.clientName", value: DEMO_DATA.clientName, icon: Building2 },
                  { labelKey: "liveDemo.jobSiteAddress", value: DEMO_DATA.address, icon: MapPin },
                  { labelKey: "liveDemo.estimatedCost", value: `$${DEMO_DATA.estimatedCost}`, icon: DollarSign },
                ].map(({ labelKey, value, icon: FieldIcon }) => (
                  <div key={labelKey}>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{t(labelKey)}</p>
                    <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-border bg-slate-50 text-sm text-foreground">
                      <FieldIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span>{value}</span>
                    </div>
                  </div>
                ))}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{t("liveDemo.jobScope")}</p>
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
                  {t("liveDemo.generateBtn")}
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-3">{t("liveDemo.generateHint")}</p>
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
                  {t("liveDemo.sampleOutputPreview")}
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
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">{t("liveDemo.costBreakdown")}</p>
                    {[
                      { labelKey: "liveDemo.equipment", amount: "$5,200", pct: 61 },
                      { labelKey: "liveDemo.labor", amount: "$2,100", pct: 25 },
                      { labelKey: "liveDemo.permits", amount: "$1,200", pct: 14 },
                    ].map(({ labelKey, amount, pct }) => (
                      <div key={labelKey} className="mb-2.5">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-slate-600">{t(labelKey)}</span>
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
                      <span className="text-xs font-bold text-slate-700">{t("liveDemo.totalEstimate")}</span>
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
                  <span>{t("liveDemo.generatedInSeconds")}</span>
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
                <h3 className="text-xl font-bold text-foreground mb-1">{t("liveDemo.yourJobDetails")}</h3>
                <p className="text-sm text-muted-foreground">{t("liveDemo.sentToAI")}</p>
              </div>
              <div className="space-y-3 flex-1">
                {[
                  { labelKey: "liveDemo.trade", value: DEMO_DATA.trade, icon: Wrench },
                  { labelKey: "liveDemo.client", value: DEMO_DATA.clientName, icon: Building2 },
                  { labelKey: "liveDemo.address", value: DEMO_DATA.address, icon: MapPin },
                  { labelKey: "liveDemo.estimatedCost", value: `$${DEMO_DATA.estimatedCost}`, icon: DollarSign },
                ].map(({ labelKey, value, icon: FieldIcon }) => (
                  <div key={labelKey} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-border">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FieldIcon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t(labelKey)}</p>
                      <p className="text-sm font-semibold text-foreground">{value}</p>
                    </div>
                  </div>
                ))}
                <div className="p-3 bg-slate-50 rounded-xl border border-border">
                  <p className="text-xs text-muted-foreground mb-1">{t("liveDemo.scope")}</p>
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
                  {t("liveDemo.viewGeneratedPDF")}
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
                  <p className="text-sm font-semibold text-white">{t("liveDemo.aiEngineTitle")}</p>
                  <p className="text-xs text-slate-400">
                    {isGenerating ? (
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse" />
                        {t("liveDemo.aiGenerating")}
                      </span>
                    ) : generationDone ? (
                      <span className="flex items-center gap-1.5 text-green-400">
                        <CheckCircle className="w-3 h-3" />
                        {t("liveDemo.aiComplete")}
                      </span>
                    ) : t("liveDemo.aiReady")}
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
                  <span className="text-slate-600">{t("liveDemo.waitingForInput")}</span>
                )}
              </div>
              {isGenerating && (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={handleSkipAnimation}
                    className="text-xs text-slate-400 hover:text-slate-300 underline transition-colors"
                  >
                    {t("liveDemo.skipAnimation")}
                  </button>
                </div>
              )}
              {generationDone && (
                <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <p className="text-xs text-green-400">{t("liveDemo.proposalGeneratedMsg")}</p>
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
                  <span className="text-sm font-semibold text-green-700">{t("liveDemo.proposalReady")}</span>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-1">{DEMO_DATA.trade} Proposal</h3>
                <p className="text-sm text-muted-foreground">{DEMO_DATA.clientName} · {DEMO_DATA.address}</p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="p-3 bg-slate-50 rounded-xl border border-border">
                  <p className="text-xs text-muted-foreground">{t("liveDemo.totalValue")}</p>
                  <p className="text-2xl font-bold text-foreground">{DEMO_DATA.total}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-slate-50 rounded-xl border border-border">
                    <p className="text-xs text-muted-foreground">{t("liveDemo.generatedIn")}</p>
                    <p className="text-lg font-bold text-foreground">{DEMO_DATA.generatedIn}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-border">
                    <p className="text-xs text-muted-foreground">{t("liveDemo.proposalDate")}</p>
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
                  {t("liveDemo.openFullPDF")}
                </a>
                <a
                  href={DEMO_PDF_URL}
                  download="ProposAI-Sample-HVAC-Proposal.pdf"
                  onClick={() => trackPdfDownload(DEMO_DATA.trade)}
                  className="flex items-center justify-center gap-2 w-full h-11 bg-white border border-border text-foreground rounded-lg font-semibold text-sm hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  aria-label="Download sample proposal PDF"
                >
                  <Download className="w-4 h-4" />
                  {t("liveDemo.downloadPDF")}
                </a>
                <button
                  onClick={() => {
                    trackCtaClick("get_started");
                    onCTA();
                  }}
                  className="flex items-center justify-center gap-2 w-full h-11 bg-orange-500 text-white rounded-lg font-semibold text-sm hover:bg-orange-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 shadow-md shadow-orange-500/20"
                >
                  <Send className="w-4 h-4" />
                  {t("liveDemo.createYourOwn")}
                </button>
              </div>

              <div className="mt-6 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                <p className="text-xs text-blue-700 font-semibold mb-1">{t("liveDemo.realSampleTitle")}</p>
                <p className="text-xs text-blue-600">{t("liveDemo.realSampleDesc")}</p>
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
  const { t } = useTranslation();
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
        navigate("/register");
      }
      return;
    }
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    setLoadingPlan(planId);
    checkoutMutation.mutate({ plan: planId as "starter" | "pro" });
  };

  const handleCTA = () => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      navigate("/register");
    }
  };

  const TRADES = [
    { icon: Wrench, label: "HVAC", color: "bg-blue-50 text-blue-700 border border-blue-100" },
    { icon: Droplets, label: t("trades.plumbing"), color: "bg-cyan-50 text-cyan-700 border border-cyan-100" },
    { icon: Bolt, label: t("trades.electrical"), color: "bg-yellow-50 text-yellow-700 border border-yellow-100" },
    { icon: BarChart3, label: t("trades.roofing"), color: "bg-orange-50 text-orange-700 border border-orange-100" },
  ];

  const STATS = [
    { value: "60s", label: t("stats.time"), icon: Timer },
    { value: "65%", label: t("stats.closeRate"), icon: TrendingUp },
    { value: "3+", label: t("stats.hoursSaved"), icon: Clock },
    { value: "4", label: t("stats.trades"), icon: Layers },
  ];

  const FEATURES = [
    { icon: Zap, title: t("features.items.ai.title"), desc: t("features.items.ai.desc"), color: "bg-orange-50 text-orange-600" },
    { icon: FileText, title: t("features.items.pdf.title"), desc: t("features.items.pdf.desc"), color: "bg-blue-50 text-blue-600" },
    { icon: Layers, title: t("features.items.templates.title"), desc: t("features.items.templates.desc"), color: "bg-purple-50 text-purple-600" },
    { icon: Sparkles, title: t("features.items.revise.title"), desc: t("features.items.revise.desc"), color: "bg-green-50 text-green-600" },
    { icon: Shield, title: t("features.items.profile.title"), desc: t("features.items.profile.desc"), color: "bg-indigo-50 text-indigo-600" },
    { icon: TrendingUp, title: t("features.items.win.title"), desc: t("features.items.win.desc"), color: "bg-rose-50 text-rose-600" },
  ];

  const PLANS = [
    {
      name: t("pricing.free.name"),
      planId: "free",
      price: t("pricing.free.price"),
      period: t("pricing.free.period"),
      proposals: t("pricing.free.proposals"),
      features: t("pricing.free.features", { returnObjects: true }) as string[],
      cta: t("pricing.free.cta"),
      highlight: false,
      badge: null,
    },
    {
      name: t("pricing.starter.name"),
      planId: "starter",
      price: t("pricing.starter.price"),
      period: t("pricing.starter.period"),
      proposals: t("pricing.starter.proposals"),
      features: t("pricing.starter.features", { returnObjects: true }) as string[],
      cta: t("pricing.starter.cta"),
      highlight: false,
      badge: t("pricing.starter.badge"),
    },
    {
      name: t("pricing.pro.name"),
      planId: "pro",
      price: t("pricing.pro.price"),
      period: t("pricing.pro.period"),
      proposals: t("pricing.pro.proposals"),
      features: t("pricing.pro.features", { returnObjects: true }) as string[],
      cta: t("pricing.pro.cta"),
      highlight: true,
      badge: t("pricing.pro.badge"),
    },
  ];

  const FAQS = [
    { q: t("faq.items.q1"), a: t("faq.items.a1") },
    { q: t("faq.items.q2"), a: t("faq.items.a2") },
    { q: t("faq.items.q3"), a: t("faq.items.a3") },
    { q: t("faq.items.q4"), a: t("faq.items.a4") },
    { q: t("faq.items.q5"), a: t("faq.items.a5") },
    { q: t("faq.items.q6"), a: t("faq.items.a6") },
  ];

  const COMPARISON = [
    { feature: t("comparison.row1Feature"), manual: t("comparison.row1Manual"), proposai: t("comparison.row1Proposai") },
    { feature: t("comparison.row2Feature"), manual: t("comparison.row2Manual"), proposai: t("comparison.row2Proposai") },
    { feature: t("comparison.row3Feature"), manual: t("comparison.row3Manual"), proposai: t("comparison.row3Proposai") },
    { feature: t("comparison.row4Feature"), manual: t("comparison.row4Manual"), proposai: t("comparison.row4Proposai") },
    { feature: t("comparison.row5Feature"), manual: t("comparison.row5Manual"), proposai: t("comparison.row5Proposai") },
    { feature: t("comparison.row6Feature"), manual: t("comparison.row6Manual"), proposai: t("comparison.row6Proposai") },
    { feature: t("comparison.row7Feature"), manual: t("comparison.row7Manual"), proposai: t("comparison.row7Proposai") },
  ];

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
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">{t("nav.howItWorks")}</a>
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">{t("nav.features")}</a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">{t("nav.pricing")}</a>
            <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">{t("nav.faq")}</a>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            {isAuthenticated ? (
              <Button onClick={() => navigate("/dashboard")} size="sm">
                {t("nav.dashboard")} <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate("/login")} className="hidden sm:flex">
                  {t("nav.signIn")}
                </Button>
                <Button size="sm" onClick={handleCTA} className="shadow-sm">
                  {t("nav.startFree")}
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
                <Zap className="w-3 h-3 mr-1.5" /> {t("hero.badge")}
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.1] mb-6 tracking-tight">
                {t("hero.title1")}<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-300">{t("hero.title2")}</span>
              </h1>
              <p className="text-lg text-slate-300 mb-8 max-w-lg leading-relaxed">
                {t("hero.subtitle")}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <Button size="lg" onClick={handleCTA} className="text-base px-8 h-12 bg-orange-500 hover:bg-orange-600 text-white border-0 shadow-lg shadow-orange-500/30">
                  {t("hero.ctaPrimary")} <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button size="lg" variant="outline" asChild className="text-base h-12 px-6 border-white/20 text-white hover:bg-white/10 bg-transparent">
                  <a href="#walkthrough">{t("hero.ctaSecondary")}</a>
                </Button>
              </div>
              <div className="flex items-center gap-5 text-sm text-slate-400">
                <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-400" /> {t("hero.trust1")}</span>
                <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-400" /> {t("hero.trust2")}</span>
                <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-400" /> {t("hero.trust3")}</span>
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
                          <p className="text-slate-400 text-xs">{t("hero.cardGenerated")}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 px-2 py-1 bg-green-500/20 rounded-full">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-green-400 text-xs font-medium">{t("hero.cardReady")}</span>
                      </div>
                    </div>
                    <div className="bg-white/10 rounded-xl px-4 py-3">
                      <p className="text-white font-bold text-sm">{t("hero.cardTitle")}</p>
                      <p className="text-slate-300 text-xs mt-0.5">{t("hero.cardClient")}</p>
                    </div>
                  </div>
                  {/* Card body */}
                  <div className="px-5 py-4 bg-white">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">{t("hero.cardCostBreakdown")}</p>
                    {[
                      { labelKey: "hero.cardEquipment", amount: "$5,200", pct: 61, color: "bg-blue-500" },
                      { labelKey: "hero.cardLabor", amount: "$2,100", pct: 25, color: "bg-orange-500" },
                      { labelKey: "hero.cardPermits", amount: "$1,200", pct: 14, color: "bg-slate-400" },
                    ].map(({ labelKey, amount, pct, color }) => (
                      <div key={labelKey} className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-slate-600">{t(labelKey)}</span>
                          <span className="text-xs font-bold text-slate-800">{amount}</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    ))}
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-700">{t("hero.cardTotal")}</span>
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
                    <p className="text-xs font-bold text-foreground">{t("hero.cardGeneratedIn")}</p>
                    <p className="text-xs text-muted-foreground">{t("hero.cardProposalReady")}</p>
                  </div>
                </div>
                {/* Floating badge: client viewed */}
                <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-xl px-3 py-2.5 flex items-center gap-2.5 border border-border">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">{t("hero.cardOpened")}</p>
                    <p className="text-xs text-muted-foreground">{t("hero.cardViewedAgo")}</p>
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
            <p className="text-sm text-muted-foreground font-medium">{t("socialProof.builtFor")}</p>
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
              <Play className="w-3 h-3 mr-1.5" /> {t("liveDemo.badge")}
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t("liveDemo.title")}</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t("liveDemo.subtitle")}
            </p>
          </div>
          <InteractiveWalkthrough onCTA={handleCTA} t={t} />
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-24 bg-slate-50">
        <div className="container">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">{t("howItWorks.badge")}</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t("howItWorks.title")}</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{t("howItWorks.subtitle")}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { stepKey: "howItWorks.step1", titleKey: "howItWorks.step1Title", descKey: "howItWorks.step1Desc", icon: Smartphone, color: "text-orange-500", bg: "bg-orange-50" },
              { stepKey: "howItWorks.step2", titleKey: "howItWorks.step2Title", descKey: "howItWorks.step2Desc", icon: Zap, color: "text-blue-500", bg: "bg-blue-50" },
              { stepKey: "howItWorks.step3", titleKey: "howItWorks.step3Title", descKey: "howItWorks.step3Desc", icon: Eye, color: "text-green-500", bg: "bg-green-50" },
            ].map(({ stepKey, titleKey, descKey, icon: Icon, color, bg }, idx) => (
              <div key={stepKey} className="relative text-center">
                {idx < 2 && <div className="hidden md:block absolute top-8 left-[calc(50%+2.5rem)] w-[calc(100%-5rem)] h-px bg-border" />}
                <div className={`w-16 h-16 ${bg} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm relative z-10`}>
                  <Icon className={`w-8 h-8 ${color}`} />
                </div>
                <div className="inline-block bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full mb-3">
                  {t(stepKey)}
                </div>
                <h3 className="font-bold text-foreground text-lg mb-2">{t(titleKey)}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{t(descKey)}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button size="lg" onClick={handleCTA} className="px-8 h-12 bg-primary hover:bg-primary/90">
              {t("howItWorks.tryItFree")} <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* ── Before vs After ── */}
      <section className="py-24 bg-slate-900">
        <div className="container">
          <div className="text-center mb-14">
            <Badge className="mb-4 bg-white/10 text-white border-white/20">{t("comparison.badge")}</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t("comparison.title")}</h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">{t("comparison.subtitle")}</p>
          </div>
          <div className="max-w-3xl mx-auto overflow-hidden rounded-2xl border border-white/10">
            <div className="grid grid-cols-3 bg-white/5 border-b border-white/10">
              <div className="p-4 text-sm font-semibold text-slate-400 uppercase tracking-wide">{t("comparison.colFeature")}</div>
              <div className="p-4 text-sm font-semibold text-red-400 uppercase tracking-wide text-center">{t("comparison.colManual")}</div>
              <div className="p-4 text-sm font-semibold text-green-400 uppercase tracking-wide text-center">{t("comparison.colProposai")}</div>
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
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">{t("features.badge")}</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t("features.title")}</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{t("features.subtitle")}</p>
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
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">{t("pricing.badge")}</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t("pricing.title")}</h2>
            <p className="text-muted-foreground text-lg">{t("pricing.subtitle")}</p>
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
                    {Array.isArray(features) && features.map((f) => (
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
                      <span className="flex items-center gap-2"><span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" /> {t("pricing.redirecting")}</span>
                    ) : (
                      <>{!isAuthenticated && planId !== "free" ? t("pricing.signInAnd") : ""}{cta} <ChevronRight className="w-4 h-4 ml-1" /></>
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
              <p className="font-bold text-foreground text-lg">{t("pricing.guaranteeTitle")}</p>
              <p className="text-muted-foreground text-sm max-w-xs">{t("pricing.guaranteeDesc")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── AI Model Comparison ── */}
      <section className="py-24 bg-white">
        <div className="container">
          <div className="text-center mb-14">
            <Badge className="mb-4 bg-purple-50 text-purple-700 border-purple-100">{t("aiModels.badge")}</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t("aiModels.title")}</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{t("aiModels.subtitle")}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {[
              {
                flag: "🇺🇸",
                name: "Claude Sonnet 4.6",
                provider: "Anthropic",
                badge: t("aiModels.sonnetBadge"),
                badgeColor: "bg-blue-100 text-blue-700",
                desc: t("aiModels.sonnetDesc"),
                tags: t("aiModels.sonnetTags", { returnObjects: true }) as string[],
                highlight: false,
              },
              {
                flag: "🇺🇸",
                name: "Claude Opus 4.6",
                provider: "Anthropic",
                badge: t("aiModels.opusBadge"),
                badgeColor: "bg-purple-100 text-purple-700",
                desc: t("aiModels.opusDesc"),
                tags: t("aiModels.opusTags", { returnObjects: true }) as string[],
                highlight: true,
              },
            ].map(({ flag, name, provider, badge, badgeColor, desc, tags, highlight }) => (
              <div key={name} className={`relative border rounded-2xl p-6 hover:shadow-md transition-shadow ${
                highlight ? "bg-purple-50 border-purple-200 shadow-sm" : "bg-slate-50 border-border"
              }`}>
                {highlight && (
                  <div className="absolute -top-3 left-6 text-xs font-bold px-3 py-1 rounded-full bg-purple-600 text-white">
                    {t("aiModels.opusPremium")}
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
                  {Array.isArray(tags) && tags.map(tag => (
                    <span key={tag} className={`text-xs border px-2 py-0.5 rounded-full ${
                      highlight ? "bg-purple-100 border-purple-200 text-purple-700" : "bg-white border-border text-muted-foreground"
                    }`}>{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-8">{t("aiModels.switchNote")}</p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-24 bg-slate-50">
        <div className="container max-w-3xl">
          <div className="text-center mb-14">
            <Badge className="mb-4 bg-slate-100 text-slate-700 border-slate-200">{t("faq.badge")}</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t("faq.title")}</h2>
            <p className="text-muted-foreground text-lg">{t("faq.subtitle")}</p>
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
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t("cta.title")}</h2>
          <p className="text-slate-300 text-lg mb-8 leading-relaxed">
            {t("cta.subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" onClick={handleCTA} className="text-base px-10 h-12 bg-orange-500 hover:bg-orange-600 border-0 shadow-lg shadow-orange-500/30">
              {t("cta.primary")} <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base h-12 px-8 border-white/20 text-white hover:bg-white/10 bg-transparent">
              <a href="#walkthrough">{t("cta.secondary")}</a>
            </Button>
          </div>
          <p className="text-slate-500 text-sm mt-5">{t("cta.footnote")}</p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
