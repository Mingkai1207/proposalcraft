import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Zap, FileText, Wrench, Droplets, Bolt, Home as HomeIcon, HardHat, Globe, Paintbrush, Layers, Leaf, Hammer, Building2, Wind, Square, Sun, Grid3x3 } from "lucide-react";
import { TemplateQuickCreate } from "@/components/TemplateQuickCreate";

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

const LANGUAGE_OPTIONS = [
  { value: "english", label: "English", flag: "🇺🇸" },
  { value: "chinese", label: "Chinese (中文)", flag: "🇨🇳" },
  { value: "spanish", label: "Spanish (Español)", flag: "🇪🇸" },
  { value: "french", label: "French (Français)", flag: "🇫🇷" },
  { value: "auto", label: "Auto (match job description)", flag: "🌐" },
];

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
  language: string;
  expiryDays: number;
};

export default function NewProposal() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>({
    title: "", tradeType: "", clientName: "", clientEmail: "",
    clientAddress: "", jobScope: "", materials: "",
    laborCost: "", materialsCost: "", totalCost: "",
    language: "english",
    expiryDays: 30,
  });

  const MODEL_LABELS: Record<string, string> = {
    "gemini-2.5-flash": "Gemini 2.5 Flash",
    "deepseek-v3": "DeepSeek V3",
    "deepseek-r1": "DeepSeek R1",
    "gpt-4o": "GPT-4o",
    "gpt-4o-mini": "GPT-4o Mini",
    "claude-3-7-sonnet-20250219": "Claude 3.7 Sonnet",
    "qwen-max": "Qwen Max",
  };

  const generateMutation = trpc.proposals.generate.useMutation({
    onSuccess: (data) => {
      if (data) {
        if (data.modelDowngraded) {
          const usedLabel = MODEL_LABELS[data.modelUsed] || data.modelUsed;
          toast.warning(
            `Your selected model requires a higher plan. Used ${usedLabel} instead. Upgrade to unlock premium models.`,
            { duration: 6000 }
          );
        } else {
          toast.success("Proposal generated successfully!");
        }
        navigate(`/proposals/${data.id}`);
      }
    },
    onError: (e) => toast.error(e.message),
  });

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>;
  }
  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  const update = (field: keyof FormData, value: string | number) => setForm(f => ({ ...f, [field]: value }));

  const handleGenerate = () => {
    if (!form.title || !form.tradeType || !form.jobScope) {
      toast.error("Please fill in all required fields");
      return;
    }
    generateMutation.mutate({
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
      language: form.language || undefined,
      expiryDays: form.expiryDays,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="border-b border-border bg-white px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate("/dashboard")} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary rounded flex items-center justify-center">
            <FileText className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-semibold text-foreground">New Proposal</span>
        </div>
        {/* Step indicator */}
        <div className="ml-auto flex items-center gap-2">
          {[1, 2, 3].map(s => (
            <div key={s} className={`flex items-center gap-1.5 text-xs font-medium ${s === step ? "text-primary" : s < step ? "text-muted-foreground" : "text-muted-foreground/40"}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${s === step ? "bg-primary text-white" : s < step ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                {s}
              </div>
              <span className="hidden sm:inline">{s === 1 ? "Trade & Client" : s === 2 ? "Job Details" : "Pricing"}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Step 1: Trade & Client */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-1">Select Trade & Client Info</h2>
              <p className="text-muted-foreground text-sm">Choose your trade type and enter client details.</p>
            </div>

            <TemplateQuickCreate form={form} setForm={setForm} />

            <div>
              <Label className="text-sm font-medium mb-2 block">Proposal Title <span className="text-destructive">*</span></Label>
              <Input
                placeholder="e.g., HVAC System Replacement - 123 Main St"
                value={form.title}
                onChange={e => update("title", e.target.value)}
              />
            </div>

            <div>
              <Label className="text-sm font-medium mb-3 block">Trade Type <span className="text-destructive">*</span></Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TRADE_OPTIONS.map(({ value, label, icon: Icon, desc }) => (
                  <button
                    key={value}
                    onClick={() => update("tradeType", value)}
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                      form.tradeType === value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40 bg-card"
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${form.tradeType === value ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Client Name</Label>
                <Input placeholder="John Smith" value={form.clientName} onChange={e => update("clientName", e.target.value)} />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Client Email</Label>
                <Input type="email" placeholder="john@example.com" value={form.clientEmail} onChange={e => update("clientEmail", e.target.value)} />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Property Address</Label>
              <Input placeholder="123 Main St, City, State" value={form.clientAddress} onChange={e => update("clientAddress", e.target.value)} />
            </div>

            <Button
              onClick={() => {
                if (!form.title || !form.tradeType) { toast.error("Please fill in the required fields"); return; }
                setStep(2);
              }}
              className="w-full"
            >
              Continue <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Step 2: Job Details */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-1">Describe the Job</h2>
              <p className="text-muted-foreground text-sm">The more detail you provide, the better the AI proposal will be.</p>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Scope of Work <span className="text-destructive">*</span></Label>
              <Textarea
                placeholder="Describe the work to be done in detail. e.g., Replace existing 3-ton HVAC unit with new Carrier 16 SEER system. Install new refrigerant lines, disconnect old unit, and test new system. Include thermostat upgrade."
                value={form.jobScope}
                onChange={e => update("jobScope", e.target.value)}
                rows={5}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">Be specific - mention equipment models, square footage, or any special conditions.</p>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Materials & Equipment</Label>
              <Textarea
                placeholder="List key materials and equipment. e.g., Carrier 24ACC336A003 3-ton AC unit, 50ft copper refrigerant lines, Honeywell T6 Pro thermostat"
                value={form.materials}
                onChange={e => update("materials", e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" /> Proposal Language
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {LANGUAGE_OPTIONS.map(({ value, label, flag }) => (
                  <button
                    key={value}
                    onClick={() => update("language", value)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 text-sm transition-all ${
                      form.language === value
                        ? "border-primary bg-primary/5 text-foreground font-medium"
                        : "border-border hover:border-primary/40 text-muted-foreground"
                    }`}
                  >
                    <span>{flag}</span>
                    <span className="truncate">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button
                onClick={() => {
                  if (!form.jobScope || form.jobScope.length < 10) { toast.error("Please describe the job scope"); return; }
                  setStep(3);
                }}
                className="flex-1"
              >
                Continue <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Pricing */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-1">Pricing (Optional)</h2>
              <p className="text-muted-foreground text-sm">Add pricing details to include in the proposal. You can skip this and add it later.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Labor Cost ($)</Label>
                <Input type="number" placeholder="1500" value={form.laborCost} onChange={e => update("laborCost", e.target.value)} />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Materials Cost ($)</Label>
                <Input type="number" placeholder="2500" value={form.materialsCost} onChange={e => update("materialsCost", e.target.value)} />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Total Investment ($)</Label>
                <Input type="number" placeholder="4000" value={form.totalCost} onChange={e => update("totalCost", e.target.value)} />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Proposal Expiry</Label>
              <Select value={form.expiryDays.toString()} onValueChange={(val) => update("expiryDays", parseInt(val))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days (recommended)</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="999">Never expires</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">Clients can accept or decline the proposal until this date. After expiry, the proposal becomes inactive.</p>
            </div>

            {/* Summary */}
            <div className="bg-muted/30 rounded-xl p-5 border border-border">
              <h3 className="font-semibold text-sm text-foreground mb-3">Proposal Summary</h3>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Title:</span><span className="text-foreground font-medium">{form.title}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Trade:</span><span className="text-foreground">{TRADE_OPTIONS.find(t => t.value === form.tradeType)?.label}</span></div>
                {form.clientName && <div className="flex justify-between"><span className="text-muted-foreground">Client:</span><span className="text-foreground">{form.clientName}</span></div>}
                {form.totalCost && <div className="flex justify-between"><span className="text-muted-foreground">Total:</span><span className="text-foreground font-semibold">${form.totalCost}</span></div>}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={generateMutation.isPending}
                className="flex-1 gap-2"
              >
                {generateMutation.isPending ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" /> Generate Proposal
                  </>
                )}
              </Button>
            </div>
            {generateMutation.isPending && (
              <p className="text-center text-sm text-muted-foreground animate-pulse">
                AI is writing your professional proposal...
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
