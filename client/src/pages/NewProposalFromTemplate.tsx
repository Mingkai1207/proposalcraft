import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  FileText,
  CheckCircle2,
  Sparkles,
  Clock,
  Zap,
  Edit3,
  RefreshCw,
} from "lucide-react";

const ALL_TRADE_TYPES = [
  "hvac", "plumbing", "electrical", "roofing", "general",
  "painting", "flooring", "landscaping", "carpentry", "concrete",
  "masonry", "insulation", "drywall", "windows", "solar",
] as const;
type TradeType = typeof ALL_TRADE_TYPES[number];

const TRADE_LABELS: Record<string, string> = {
  hvac: "HVAC", plumbing: "Plumbing", electrical: "Electrical",
  roofing: "Roofing", general: "General Contracting", painting: "Painting",
  flooring: "Flooring", landscaping: "Landscaping", carpentry: "Carpentry",
  concrete: "Concrete", masonry: "Masonry", insulation: "Insulation",
  drywall: "Drywall", windows: "Windows & Doors", solar: "Solar",
};

// ── Waiting screen stages ─────────────────────────────────────────────────────
const GENERATION_STAGES = [
  { label: "Analyzing your template structure", icon: FileText, duration: 4000 },
  { label: "Incorporating your project details", icon: Edit3, duration: 5000 },
  { label: "Writing professional proposal content", icon: Sparkles, duration: 12000 },
  { label: "Generating charts and visualizations", icon: Zap, duration: 8000 },
  { label: "Exporting PDF and documents", icon: CheckCircle2, duration: 5000 },
];

function WaitingScreen({ templateName }: { templateName: string }) {
  const [currentStage, setCurrentStage] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let total = 0;
    for (let i = 0; i < GENERATION_STAGES.length - 1; i++) {
      total += GENERATION_STAGES[i].duration;
      if (elapsed * 1000 < total) {
        setCurrentStage(i);
        return;
      }
    }
    setCurrentStage(GENERATION_STAGES.length - 1);
  }, [elapsed]);

  const estimatedTotal = Math.round(GENERATION_STAGES.reduce((s, g) => s + g.duration, 0) / 1000);
  const remaining = Math.max(0, estimatedTotal - elapsed);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center space-y-8">
        {/* Animated icon */}
        <div className="relative inline-flex">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-primary animate-pulse" />
          </div>
          <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Generating Your Proposal</h2>
          <p className="text-muted-foreground">
            Using <span className="font-semibold text-foreground">"{templateName}"</span> as the template
          </p>
        </div>

        {/* Progress stages */}
        <div className="space-y-3 text-left">
          {GENERATION_STAGES.map((stage, i) => {
            const StageIcon = stage.icon;
            const isDone = i < currentStage;
            const isActive = i === currentStage;
            return (
              <div
                key={i}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-500 ${
                  isActive ? "bg-primary/10 border border-primary/20" :
                  isDone ? "opacity-60" : "opacity-30"
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isDone ? "bg-green-500/20" : isActive ? "bg-primary/20" : "bg-muted"
                }`}>
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : isActive ? (
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  ) : (
                    <StageIcon className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <span className={`text-sm font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Timer */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>
            {remaining > 0
              ? `About ${remaining} seconds remaining`
              : "Almost done, finalizing your documents..."}
          </span>
        </div>

        <p className="text-xs text-muted-foreground">
          ProposAI is crafting a detailed proposal that follows your template's structure and format.
        </p>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function NewProposalFromTemplate() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const templateIdParam = params.get("templateId");
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  // Step: "form" | "summary" | "generating" | "done"
  const [step, setStep] = useState<"form" | "summary" | "generating" | "done">("form");
  const [proposalId, setProposalId] = useState<number | null>(null);
  const [summaryContent, setSummaryContent] = useState("");

  // Form state
  const [title, setTitle] = useState("");
  const [tradeType, setTradeType] = useState<TradeType>("general");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [jobScope, setJobScope] = useState("");
  const [totalCost, setTotalCost] = useState("");
  const [estimatedDays, setEstimatedDays] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(
    templateIdParam ? parseInt(templateIdParam, 10) : null
  );

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [isAuthenticated, authLoading]);

  // Auto-fill from user profile
  const { data: profile } = trpc.profile.get.useQuery(undefined, { enabled: isAuthenticated });
  useEffect(() => {
    if (profile) {
      // Auto-fill trade type from profile if available
      if ((profile as any).tradeType && ALL_TRADE_TYPES.includes((profile as any).tradeType as TradeType)) {
        setTradeType((profile as any).tradeType as TradeType);
      }
    }
  }, [profile]);

  // Fetch templates list
  const { data: templates, isLoading: templatesLoading } = trpc.templates.list.useQuery(
    undefined, { enabled: isAuthenticated }
  );

  // Step 1: compile summary
  const compileSummaryMutation = trpc.proposals.compileSummary.useMutation({
    onSuccess: (data) => {
      setProposalId(data.proposalId);
      setSummaryContent(data.summaryContent);
      setStep("summary");
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to compile summary");
    },
  });

  // Step 3: generate from template
  const generateMutation = trpc.proposals.generateFromTemplate.useMutation({
    onSuccess: (data) => {
      setStep("done");
      setTimeout(() => navigate(`/proposals/${data.proposalId}`), 1500);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to generate proposal");
      setStep("summary");
    },
  });

  function handleCompileSummary() {
    if (!title.trim()) { toast.error("Please enter a proposal title"); return; }
    if (!jobScope.trim()) { toast.error("Please describe the job scope"); return; }
    if (!selectedTemplateId) { toast.error("Please select a template"); return; }

    compileSummaryMutation.mutate({
      title,
      tradeType,
      clientName,
      clientEmail,
      clientAddress,
      jobScope,
      totalCost,
      estimatedDays,
      expiryDays: 30,
      // No style preferences for template-based flow
    });
  }

  function handleGenerate() {
    if (!selectedTemplateId) { toast.error("No template selected"); return; }
    setStep("generating");
    generateMutation.mutate({
      templateId: selectedTemplateId,
      approvedSummary: summaryContent,
      title,
      tradeType,
      clientName,
      clientEmail,
      clientAddress,
      jobScope,
      totalCost,
      estimatedDays,
      expiryDays: 30,
    });
  }

  const selectedTemplate = templates?.find(t => t.id === selectedTemplateId);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (step === "generating") {
    return <WaitingScreen templateName={selectedTemplate?.name || "Your Template"} />;
  }

  if (step === "done") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
          <h2 className="text-2xl font-bold">Proposal Ready!</h2>
          <p className="text-muted-foreground">Redirecting to your proposal...</p>
        </div>
      </div>
    );
  }

  // ── Step 2: Summary Review ──────────────────────────────────────────────────
  if (step === "summary") {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b bg-card sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => setStep("form")} className="gap-1">
                <ArrowLeft className="w-4 h-4" /> Back to Form
              </Button>
              <div className="h-5 w-px bg-border" />
              <div>
                <h1 className="font-bold text-foreground">Review Summary</h1>
                <p className="text-xs text-muted-foreground">Step 2 of 3 — Edit if needed, then generate</p>
              </div>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3].map(n => (
                <div key={n} className={`w-2 h-2 rounded-full ${n <= 2 ? "bg-primary" : "bg-muted"}`} />
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5 text-primary" />
                AI-Compiled Project Summary
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Review the summary below. You can edit it directly before generating your proposal.
                The more accurate this summary, the better your proposal will be.
              </p>
            </CardHeader>
            <CardContent>
              <Textarea
                value={summaryContent}
                onChange={e => setSummaryContent(e.target.value)}
                rows={20}
                className="font-mono text-sm resize-none"
              />
            </CardContent>
          </Card>

          {selectedTemplate && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="font-medium">Template:</span>
                  <span className="text-muted-foreground">{selectedTemplate.name}</span>
                  <Badge variant="outline" className="ml-auto text-xs">{TRADE_LABELS[selectedTemplate.tradeType] || selectedTemplate.tradeType}</Badge>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep("form")} className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Edit Form
            </Button>
            <Button
              onClick={handleGenerate}
              className="flex-1 gap-2 text-base"
              size="lg"
            >
              <Sparkles className="w-5 h-5" />
              Generate Proposal from Template
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            ProposAI will follow your template's structure and incorporate all the information above.
            This typically takes 30–60 seconds.
          </p>
        </div>
      </div>
    );
  }

  // ── Step 1: Form ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/templates")} className="gap-1">
              <ArrowLeft className="w-4 h-4" /> My Templates
            </Button>
            <div className="h-5 w-px bg-border" />
            <div>
              <h1 className="font-bold text-foreground">New Proposal from Template</h1>
              <p className="text-xs text-muted-foreground">Step 1 of 3 — Project information</p>
            </div>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map(n => (
              <div key={n} className={`w-2 h-2 rounded-full ${n === 1 ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Template selector */}
        <div className="space-y-2">
          <Label className="text-base font-semibold">
            Select Template <span className="text-destructive">*</span>
          </Label>
          <p className="text-sm text-muted-foreground">
            Choose a saved template. ProposAI will follow its structure when writing your new proposal.
          </p>
          {templatesLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading templates...
            </div>
          ) : !templates || templates.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="pt-6 text-center space-y-3">
                <FileText className="w-8 h-8 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">No templates yet.</p>
                <Button variant="outline" size="sm" onClick={() => navigate("/templates")}>
                  Go to My Templates
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {templates.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTemplateId(t.id)}
                  className={`text-left p-4 rounded-xl border transition-all ${
                    selectedTemplateId === t.id
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border hover:border-primary/40 hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium text-sm text-foreground">{t.name}</div>
                      {t.description && (
                        <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{t.description}</div>
                      )}
                    </div>
                    <Badge variant="secondary" className="text-xs flex-shrink-0">
                      {TRADE_LABELS[t.tradeType] || t.tradeType}
                    </Badge>
                  </div>
                  {selectedTemplateId === t.id && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-primary font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Selected
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Proposal title */}
        <div className="space-y-2">
          <Label className="text-base font-semibold">
            Proposal Title <span className="text-destructive">*</span>
          </Label>
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Roof Replacement — Johnson Residence"
            className="text-base"
          />
        </div>

        {/* Trade type */}
        <div className="space-y-2">
          <Label className="text-base font-semibold">Trade Type</Label>
          <Select value={tradeType} onValueChange={v => setTradeType(v as TradeType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ALL_TRADE_TYPES.map(t => (
                <SelectItem key={t} value={t}>{TRADE_LABELS[t]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Client information */}
        <div className="space-y-4">
          <h2 className="font-semibold text-foreground border-b pb-2">Client Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Client Name</Label>
              <Input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Jane Smith" />
            </div>
            <div className="space-y-1.5">
              <Label>Client Email</Label>
              <Input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="jane@example.com" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Property Address</Label>
            <Input value={clientAddress} onChange={e => setClientAddress(e.target.value)} placeholder="123 Main St, City, State 12345" />
          </div>
        </div>

        {/* Project details */}
        <div className="space-y-4">
          <h2 className="font-semibold text-foreground border-b pb-2">Project Details</h2>
          <div className="space-y-1.5">
            <Label>
              Job Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              value={jobScope}
              onChange={e => setJobScope(e.target.value)}
              placeholder="Describe the work to be done in detail. Include scope, materials, special requirements..."
              rows={5}
              className="resize-none"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Estimated Duration (days)</Label>
              <Input
                type="number"
                value={estimatedDays}
                onChange={e => setEstimatedDays(e.target.value)}
                placeholder="e.g. 5"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Total Cost ($)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  type="number"
                  value={totalCost}
                  onChange={e => setTotalCost(e.target.value)}
                  placeholder="e.g. 12500"
                  className="pl-7"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <Button
          onClick={handleCompileSummary}
          disabled={compileSummaryMutation.isPending || !selectedTemplateId}
          size="lg"
          className="w-full gap-2 text-base"
        >
          {compileSummaryMutation.isPending ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Compiling Summary...</>
          ) : (
            <><RefreshCw className="w-5 h-5" /> Compile Summary & Review<ArrowRight className="w-4 h-4" /></>
          )}
        </Button>

        {compileSummaryMutation.isPending && (
          <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 text-sm text-primary">
            <div className="font-medium mb-1">Compiling your project summary...</div>
            <div className="text-primary/70">
              AI is organizing your information into a structured summary for review. This takes about 5–10 seconds.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
