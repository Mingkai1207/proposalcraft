import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Zap, Loader2, FileText, BarChart2, CheckCircle } from "lucide-react";
import { getTemplateById, type ProposalTemplateDef, type TemplateField } from "../../../shared/templateDefs";

function FieldInput({ field, value, onChange }: {
  field: TemplateField;
  value: string;
  onChange: (v: string) => void;
}) {
  if (field.type === "select" && field.options) {
    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={`Select ${field.label.toLowerCase()}...`} />
        </SelectTrigger>
        <SelectContent>
          {field.options.map(opt => (
            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
  if (field.type === "textarea" || field.type === "multiline_list") {
    return (
      <Textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={field.placeholder}
        rows={4}
        className="resize-none"
      />
    );
  }
  return (
    <Input
      type={field.type === "number" || field.type === "currency" ? "number" : "text"}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={field.placeholder}
    />
  );
}

export default function NewProposalFromTemplate() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const templateId = params.get("template") || "";
  const [, navigate] = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const template = getTemplateById(templateId);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [proposalTitle, setProposalTitle] = useState("");
  const [language, setLanguage] = useState("english");

  // Redirect if no valid template
  useEffect(() => {
    if (!template && !authLoading) {
      navigate("/proposals/template");
    }
  }, [template, authLoading]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [isAuthenticated, authLoading]);

  const generateMutation = trpc.proposals.generateFromTemplate.useMutation({
    onSuccess: (data) => {
      toast.success("Proposal generated! Redirecting to preview...");
      navigate(`/proposals/${data.id}`);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to generate proposal");
    },
  });

  function updateField(id: string, value: string) {
    setFormValues(prev => ({ ...prev, [id]: value }));
  }

  function handleSubmit() {
    if (!template) return;
    if (!proposalTitle.trim()) {
      toast.error("Please enter a proposal title");
      return;
    }
    const requiredFields = template.inputFields.filter(f => f.required);
    const missing = requiredFields.filter(f => !formValues[f.id]?.trim());
    if (missing.length > 0) {
      toast.error(`Please fill in: ${missing.map(f => f.label).join(", ")}`);
      return;
    }
    generateMutation.mutate({
      templateId: template.id,
      title: proposalTitle,
      language,
      fields: formValues,
    });
  }

  if (authLoading || !template) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Group fields: client info first, then trade-specific, then costs
  const clientFieldIds = ["clientName", "clientAddress", "clientEmail"];
  const costFieldIds = ["laborCost", "materialsCost", "totalCost"];
  const clientFields = template.inputFields.filter(f => clientFieldIds.includes(f.id));
  const costFields = template.inputFields.filter(f => costFieldIds.includes(f.id));
  const tradeFields = template.inputFields.filter(f => !clientFieldIds.includes(f.id) && !costFieldIds.includes(f.id));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/proposals/template")} className="gap-1">
              <ArrowLeft className="w-4 h-4" /> Templates
            </Button>
            <div className="h-5 w-px bg-border" />
            <div>
              <h1 className="font-bold text-foreground">{template.name}</h1>
              <p className="text-xs text-muted-foreground">
                {template.sections.length} sections · {template.visualizations.length} charts · AI-filled
              </p>
            </div>
          </div>
          {/* Template accent preview */}
          <div
            className="w-8 h-8 rounded-lg"
            style={{ background: template.accentColor }}
          />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2 space-y-8">
          {/* Proposal title */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">Proposal Title <span className="text-destructive">*</span></Label>
            <Input
              value={proposalTitle}
              onChange={e => setProposalTitle(e.target.value)}
              placeholder={`e.g. HVAC Replacement — Smith Residence`}
              className="text-base"
            />
          </div>

          {/* Client info */}
          <div className="space-y-4">
            <h2 className="font-semibold text-foreground border-b pb-2">Client Information</h2>
            {clientFields.map(field => (
              <div key={field.id} className="space-y-1.5">
                <Label>
                  {field.label}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                </Label>
                {field.hint && <p className="text-xs text-muted-foreground">{field.hint}</p>}
                <FieldInput field={field} value={formValues[field.id] || ""} onChange={v => updateField(field.id, v)} />
              </div>
            ))}
          </div>

          {/* Trade-specific fields */}
          <div className="space-y-4">
            <h2 className="font-semibold text-foreground border-b pb-2">Project Details</h2>
            {tradeFields.map(field => (
              <div key={field.id} className="space-y-1.5">
                <Label>
                  {field.label}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                </Label>
                {field.hint && <p className="text-xs text-muted-foreground">{field.hint}</p>}
                <FieldInput field={field} value={formValues[field.id] || ""} onChange={v => updateField(field.id, v)} />
              </div>
            ))}
          </div>

          {/* Cost fields */}
          {costFields.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-foreground border-b pb-2">Pricing</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {costFields.map(field => (
                  <div key={field.id} className="space-y-1.5">
                    <Label>{field.label}</Label>
                    {field.hint && <p className="text-xs text-muted-foreground">{field.hint}</p>}
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                      <Input
                        type="number"
                        value={formValues[field.id] || ""}
                        onChange={e => updateField(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        className="pl-7"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Language */}
          <div className="space-y-2">
            <Label>Output Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="english">🇺🇸 English</SelectItem>
                <SelectItem value="chinese">🇨🇳 Chinese (中文)</SelectItem>
                <SelectItem value="spanish">🇪🇸 Spanish</SelectItem>
                <SelectItem value="french">🇫🇷 French</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={generateMutation.isPending}
            size="lg"
            className="w-full gap-2 text-base"
          >
            {generateMutation.isPending ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Generating Proposal...</>
            ) : (
              <><Zap className="w-5 h-5" /> Generate Proposal with AI</>
            )}
          </Button>

          {generateMutation.isPending && (
            <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 text-sm text-primary">
              <div className="font-medium mb-1">AI is building your proposal...</div>
              <div className="text-primary/70">Filling {template.sections.filter(s => s.type === "ai_filled").length} sections with professional content and generating {template.visualizations.length} data visualizations. This takes about 15–30 seconds.</div>
            </div>
          )}
        </div>

        {/* Sidebar: template preview */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border overflow-hidden sticky top-24">
            {/* Template header */}
            <div
              className="p-4"
              style={{ background: `linear-gradient(135deg, ${template.accentColor} 0%, ${template.accentColor}cc 100%)` }}
            >
              <div className="text-white/80 text-xs font-medium uppercase tracking-wider mb-1">{template.name}</div>
              <div className="text-white text-sm">{template.description}</div>
            </div>

            {/* Sections list */}
            <div className="p-4 bg-card space-y-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">What's included</div>
              {template.sections.map(section => (
                <div key={section.id} className="flex items-center gap-2 text-sm">
                  {section.type === "visualization" ? (
                    <BarChart2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  ) : section.type === "ai_filled" ? (
                    <Zap className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                  ) : (
                    <FileText className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  )}
                  <span className="text-foreground">{section.title}</span>
                  {section.type === "ai_filled" && (
                    <span className="text-xs text-muted-foreground ml-auto">AI</span>
                  )}
                  {section.type === "visualization" && (
                    <span className="text-xs text-primary ml-auto">Chart</span>
                  )}
                </div>
              ))}
            </div>

            {/* Export formats */}
            <div className="px-4 pb-4 bg-card border-t border-border pt-3">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Export formats</div>
              <div className="flex gap-2">
                {["PDF", "Word", "Google Doc"].map(fmt => (
                  <span key={fmt} className="px-2 py-1 rounded bg-muted text-xs font-medium text-muted-foreground">{fmt}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
