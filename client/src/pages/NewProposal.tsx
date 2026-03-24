import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SuggestInput, SuggestTextarea } from "@/components/ui/suggest-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import {
  ArrowLeft, ArrowRight, FileText, Wrench, Droplets, Bolt, Home as HomeIcon,
  HardHat, Paintbrush, Layers, Leaf, Hammer, Building2, Wind, Square, Sun,
  Grid3x3, CheckCircle2, Loader2, Sparkles, Edit3, Clock, Eye,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Streamdown } from "streamdown";

// ─── Constants ────────────────────────────────────────────────────────────────

const TRADE_OPTIONS = [
  { value: "hvac", label: "HVAC", icon: Wrench, desc: "Heating, ventilation & air conditioning" },
  { value: "plumbing", label: "Plumbing", icon: Droplets, desc: "Pipes, fixtures & water systems" },
  { value: "electrical", label: "Electrical", icon: Bolt, desc: "Wiring, panels & electrical systems" },
  { value: "roofing", label: "Roofing", icon: HomeIcon, desc: "Roof installation, repair & replacement" },
  { value: "painting", label: "Painting", icon: Paintbrush, desc: "Interior & exterior painting" },
  { value: "flooring", label: "Flooring", icon: Layers, desc: "Hardwood, tile, carpet & vinyl" },
  { value: "landscaping", label: "Landscaping", icon: Leaf, desc: "Lawn care, grading & outdoor design" },
  { value: "carpentry", label: "Carpentry", icon: Hammer, desc: "Custom woodwork & trim" },
  { value: "concrete", label: "Concrete", icon: Building2, desc: "Foundations, driveways & slabs" },
  { value: "masonry", label: "Masonry", icon: Grid3x3, desc: "Brick, stone & block work" },
  { value: "insulation", label: "Insulation", icon: Wind, desc: "Spray foam, batt & blown-in" },
  { value: "drywall", label: "Drywall", icon: Square, desc: "Hanging, taping & finishing" },
  { value: "windows", label: "Windows & Doors", icon: Square, desc: "Installation & replacement" },
  { value: "solar", label: "Solar", icon: Sun, desc: "Solar panel installation & battery storage" },
  { value: "general", label: "General Contracting", icon: HardHat, desc: "General construction & renovation" },
];



const PAYMENT_TERMS = [
  "50% upfront, 50% on completion",
  "33% upfront, 33% at midpoint, 34% on completion",
  "100% on completion",
  "Net-30 after completion",
  "Weekly progress billing",
];

// ─── Types ────────────────────────────────────────────────────────────────────

type FormData = {
  title: string;
  tradeType: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  jobScope: string;
  materials: string;
  laborCost: string;
  materialsCost: string;
  totalCost: string;
  estimatedDays: string;
  startDate: string;
  paymentTerms: string;
  specialNotes: string;
  expiryDays: number;
};

// ─── Step indicator ───────────────────────────────────────────────────────────

const STEPS = [
  { label: "Project Info" },
  { label: "Job Details" },
  { label: "Review Summary" },
];

function StepIndicator({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-1">
      {STEPS.map((s, i) => {
        const n = i + 1;
        const done = n < step;
        const active = n === step;
        return (
          <div key={n} className="flex items-center gap-1">
            <div className={`flex items-center gap-1.5 text-xs font-medium ${active ? "text-primary" : done ? "text-muted-foreground" : "text-muted-foreground/40"}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${active ? "bg-primary text-white" : done ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                {done ? <CheckCircle2 className="w-3 h-3" /> : n}
              </div>
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`w-6 h-px ${n < step ? "bg-primary/40" : "bg-border"}`} />}
          </div>
        );
      })}
    </div>
  );
}

// ─── Waiting screen ───────────────────────────────────────────────────────────

const GENERATION_STEPS = [
  { icon: "📋", label: "Analyzing your project details", duration: 3000 },
  { icon: "🔍", label: "Researching trade-specific requirements", duration: 4000 },
  { icon: "✍️", label: "Writing executive summary", duration: 5000 },
  { icon: "📐", label: "Detailing scope of work", duration: 5000 },
  { icon: "🛠️", label: "Listing materials & equipment", duration: 4000 },
  { icon: "📅", label: "Building project timeline", duration: 3000 },
  { icon: "💰", label: "Calculating investment summary", duration: 3000 },
  { icon: "📊", label: "Generating analytic charts", duration: 5000 },
  { icon: "📄", label: "Formatting PDF document", duration: 4000 },
  { icon: "✅", label: "Finalizing your proposal", duration: 2000 },
];

function WaitingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let stepIndex = 0;
    let timeoutId: ReturnType<typeof setTimeout>;

    function advance() {
      if (stepIndex >= GENERATION_STEPS.length) return;
      setCurrentStep(stepIndex);
      const duration = GENERATION_STEPS[stepIndex].duration;
      timeoutId = setTimeout(() => {
        setCompletedSteps(prev => [...prev, stepIndex]);
        stepIndex++;
        advance();
      }, duration);
    }

    advance();

    const interval = setInterval(() => setElapsed(e => e + 1), 1000);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(interval);
    };
  }, []);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const timeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 mb-4">
            <Sparkles className="w-8 h-8 text-primary animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Crafting Your Proposal</h2>
          <p className="text-slate-400 text-sm">ProposAI is writing a professional, detailed proposal for you. This typically takes 30–90 seconds.</p>
        </div>

        {/* Steps */}
        <div className="space-y-2 mb-8">
          {GENERATION_STEPS.map((step, i) => {
            const isDone = completedSteps.includes(i);
            const isActive = currentStep === i && !isDone;
            return (
              <div
                key={i}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-500 ${
                  isDone ? "bg-primary/10 border border-primary/20" :
                  isActive ? "bg-white/10 border border-white/20" :
                  "opacity-30"
                }`}
              >
                <span className="text-lg w-6 text-center">{step.icon}</span>
                <span className={`text-sm flex-1 ${isDone ? "text-primary" : isActive ? "text-white" : "text-slate-500"}`}>
                  {step.label}
                </span>
                {isDone && <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />}
                {isActive && <Loader2 className="w-4 h-4 text-white animate-spin flex-shrink-0" />}
              </div>
            );
          })}
        </div>

        {/* Timer */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-slate-400 text-sm">
            <Clock className="w-4 h-4" />
            <span>Elapsed: {timeStr}</span>
          </div>
          <p className="text-slate-500 text-xs mt-2">Please keep this page open while your proposal is being generated.</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function NewProposal() {
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [summaryText, setSummaryText] = useState("");
  const [summaryMode, setSummaryMode] = useState<"preview" | "edit">("preview");
  const [proposalId, setProposalId] = useState<number | null>(null);

  const [form, setForm] = useState<FormData>({
    title: "",
    tradeType: "",
    clientName: "",
    clientEmail: "",
    clientAddress: "",
    jobScope: "",
    materials: "",
    laborCost: "",
    materialsCost: "",
    totalCost: "",
    estimatedDays: "",
    startDate: "",
    paymentTerms: "50% upfront, 50% on completion",
    specialNotes: "",
    expiryDays: 30,

  });

  // Auto-fill profile data
  const { data: profile } = trpc.profile.get.useQuery(undefined, { enabled: isAuthenticated });

  useEffect(() => {
    if (profile && !form.clientEmail) {
      // Pre-fill nothing from profile into client fields — those are for the client, not the contractor
      // But we can use profile data in the summary generation
    }
  }, [profile]);

  const compileMutation = trpc.proposals.compileSummary.useMutation({
    onSuccess: (data) => {
      setSummaryText(data.summaryContent);
      setProposalId(data.proposalId);
      setStep(3);
    },
    onError: (e) => toast.error(e.message),
  });

  const generateMutation = trpc.proposals.generateFromSummary.useMutation({
    onSuccess: (data) => {
      setIsGenerating(false);
      toast.success("Proposal generated successfully!");
      navigate(`/proposals/${data.proposalId}`);
    },
    onError: (e) => {
      setIsGenerating(false);
      toast.error(e.message);
    },
  });

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }
  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  // Show waiting screen during generation
  if (isGenerating) {
    return <WaitingScreen />;
  }

  const update = (field: keyof FormData, value: string | number) =>
    setForm(f => ({ ...f, [field]: value }));

  const handleCompileSummary = () => {
    if (!form.title || !form.tradeType) {
      toast.error("Please fill in the project title and trade type");
      return;
    }
    if (!form.jobScope || form.jobScope.length < 10) {
      toast.error("Please describe the job scope (at least 10 characters)");
      return;
    }
    compileMutation.mutate({
      title: form.title,
      tradeType: form.tradeType as any,
      clientName: form.clientName || undefined,
      clientEmail: form.clientEmail || undefined,
      clientAddress: form.clientAddress || undefined,
      jobScope: form.jobScope,
      materials: form.materials || undefined,
      laborCost: form.laborCost || undefined,
      materialsCost: form.materialsCost || undefined,
      totalCost: form.totalCost || undefined,
      estimatedDays: form.estimatedDays || undefined,
      startDate: form.startDate || undefined,
      paymentTerms: form.paymentTerms || undefined,
      specialNotes: form.specialNotes || undefined,
      expiryDays: form.expiryDays,

    });
  };

  const handleGenerate = () => {
    if (!proposalId || !summaryText) {
      toast.error("Please review the summary first");
      return;
    }
    setIsGenerating(true);
    generateMutation.mutate({
      proposalId,
      approvedSummary: summaryText,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="border-b border-border bg-white px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
        <button onClick={() => step > 1 ? setStep(s => s - 1) : navigate("/dashboard")} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary rounded flex items-center justify-center">
            <FileText className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-semibold text-foreground">New Proposal</span>
        </div>
        <div className="ml-auto">
          <StepIndicator step={step} />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">

        {/* ── Step 1: Project Info ── */}
        {step === 1 && (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-1">Project Information</h2>
              <p className="text-muted-foreground text-sm">Tell us about the project and your client.</p>
            </div>

            {/* Trade type */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Trade Type <span className="text-destructive">*</span></Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {TRADE_OPTIONS.map(({ value, label, icon: Icon, desc }) => (
                  <button
                    key={value}
                    onClick={() => update("tradeType", value)}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                      form.tradeType === value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40 bg-card"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${form.tradeType === value ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Project title */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Proposal Title <span className="text-destructive">*</span></Label>
              <SuggestInput
                placeholder="e.g., HVAC System Replacement – 123 Main St"
                value={form.title}
                onChange={e => update("title", e.target.value)}
              />
            </div>

            {/* Client info */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Client Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Client Name</Label>
                  <SuggestInput placeholder="John Smith" value={form.clientName} onChange={e => update("clientName", e.target.value)} />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">Client Email</Label>
                  <SuggestInput type="email" placeholder="john@example.com" value={form.clientEmail} onChange={e => update("clientEmail", e.target.value)} />
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Property / Job Address</Label>
                <SuggestInput placeholder="123 Main St, City, State 90210" value={form.clientAddress} onChange={e => update("clientAddress", e.target.value)} />
              </div>
            </div>



            <Button
              onClick={() => {
                if (!form.title || !form.tradeType) {
                  toast.error("Please fill in the project title and trade type");
                  return;
                }
                setStep(2);
              }}
              className="w-full"
            >
              Continue <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {/* ── Step 2: Job Details + Pricing ── */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-1">Job Details & Pricing</h2>
              <p className="text-muted-foreground text-sm">The more detail you provide, the better the AI proposal will be.</p>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Scope of Work <span className="text-destructive">*</span></Label>
              <SuggestTextarea
                placeholder="Describe the work to be done in detail. e.g., Replace existing 3-ton HVAC unit with new Carrier 16 SEER system. Install new refrigerant lines, disconnect old unit, and test new system. Include thermostat upgrade."
                value={form.jobScope}
                onChange={e => update("jobScope", e.target.value)}
                rows={5}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">Be specific — mention equipment models, square footage, or any special conditions.</p>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Materials & Equipment</Label>
              <SuggestTextarea
                placeholder="List key materials and equipment. e.g., Carrier 24ACC336A003 3-ton AC unit, 50ft copper refrigerant lines, Honeywell T6 Pro thermostat"
                value={form.materials}
                onChange={e => update("materials", e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Pricing */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Pricing</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Labor Cost ($)</Label>
                  <SuggestInput type="number" placeholder="1500" value={form.laborCost} onChange={e => update("laborCost", e.target.value)} />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">Materials Cost ($)</Label>
                  <SuggestInput type="number" placeholder="2500" value={form.materialsCost} onChange={e => update("materialsCost", e.target.value)} />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">Total Cost ($) <span className="text-destructive">*</span></Label>
                  <SuggestInput type="number" placeholder="4000" value={form.totalCost} onChange={e => update("totalCost", e.target.value)} />
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Estimated Duration (days) <span className="text-destructive">*</span></Label>
                <SuggestInput type="number" placeholder="5" value={form.estimatedDays} onChange={e => update("estimatedDays", e.target.value)} />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Proposed Start Date</Label>
                <Input type="date" value={form.startDate} onChange={e => update("startDate", e.target.value)} />
              </div>
            </div>

            {/* Payment terms */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Payment Terms</Label>
              <Select value={form.paymentTerms} onValueChange={val => update("paymentTerms", val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_TERMS.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Special notes */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Special Notes / Additional Requirements</Label>
              <SuggestTextarea
                placeholder="Permit requirements, access restrictions, client preferences, warranty terms..."
                value={form.specialNotes}
                onChange={e => update("specialNotes", e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button
                onClick={handleCompileSummary}
                disabled={compileMutation.isPending}
                className="flex-1 gap-2"
              >
                {compileMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Compiling Summary...</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Compile Summary</>
                )}
              </Button>
            </div>
            {compileMutation.isPending && (
              <p className="text-center text-sm text-muted-foreground animate-pulse">
                AI is organizing your project details into a structured summary...
              </p>
            )}
          </div>
        )}

        {/* ── Step 3: Review & Edit Summary ── */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-1">Review Your Project Summary</h2>
              <p className="text-muted-foreground text-sm">
                ProposAI has compiled your project details into a structured summary. Review it carefully and make any edits before generating the full proposal.
              </p>
            </div>

            {/* Summary info banner */}
            <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
              <Edit3 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-800">Edit before generating</p>
                <p className="text-xs text-blue-600 mt-0.5">This summary will be sent to ProposAI to write your full proposal. Make sure all details are accurate — especially costs, dates, and client information.</p>
              </div>
            </div>

            {/* Preview / Edit toggle */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium">Project Summary</Label>
                <div className="flex rounded-lg border border-border overflow-hidden text-xs">
                  <button
                    type="button"
                    onClick={() => setSummaryMode("preview")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors ${
                      summaryMode === "preview"
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <Eye className="w-3 h-3" /> Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => setSummaryMode("edit")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors ${
                      summaryMode === "edit"
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <Edit3 className="w-3 h-3" /> Edit
                  </button>
                </div>
              </div>

              {summaryMode === "preview" ? (
                <div className="min-h-[20rem] rounded-xl border border-border bg-card p-5 prose prose-sm max-w-none text-foreground">
                  <Streamdown>{summaryText}</Streamdown>
                </div>
              ) : (
                <Textarea
                  value={summaryText}
                  onChange={e => setSummaryText(e.target.value)}
                  rows={20}
                  className="font-mono text-sm resize-none"
                  placeholder="Your project summary will appear here..."
                />
              )}
            </div>



            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={generateMutation.isPending || !summaryText}
                className="flex-1 gap-2 bg-gradient-to-r from-primary to-primary/80"
              >
                <Sparkles className="w-4 h-4" /> Generate Full Proposal
              </Button>
            </div>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Generation typically takes 30–90 seconds. ProposAI will write a complete, professional proposal with analytic charts.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
