import React from "react";
import { trpc } from "@/lib/trpc";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Zap, LayoutTemplate } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { TEMPLATE_DEFS } from "../../../shared/templateDefs";

interface TemplateQuickCreateProps {
  form: any;
  setForm: (form: any) => void;
}

const TRADE_LABELS: Record<string, string> = {
  hvac: "HVAC", plumbing: "Plumbing", electrical: "Electrical",
  roofing: "Roofing", general: "General", painting: "Painting",
  flooring: "Flooring", landscaping: "Landscaping", carpentry: "Carpentry",
  concrete: "Concrete", masonry: "Masonry", insulation: "Insulation",
  drywall: "Drywall", windows: "Windows & Doors", solar: "Solar",
};

const STYLE_LABELS: Record<string, string> = {
  modern: "Modern", classic: "Classic", minimal: "Minimal",
};

export function TemplateQuickCreate({ form, setForm }: TemplateQuickCreateProps) {
  const { data: savedTemplates } = trpc.templates.list.useQuery();
  const [selectedTemplate, setSelectedTemplate] = React.useState<string>("");
  const [, navigate] = useLocation();

  const handleLoadTemplate = (value: string) => {
    if (value === "__browse__") {
      navigate("/templates/pick");
      return;
    }

    // Check if it's a built-in template (prefixed with "builtin:")
    if (value.startsWith("builtin:")) {
      const templateId = value.replace("builtin:", "");
      const template = TEMPLATE_DEFS.find(t => t.id === templateId);
      if (!template) return;

      // Pre-fill the form with template defaults
      setForm({
        ...form,
        title: `${TRADE_LABELS[template.trade] || template.trade} Proposal`,
        tradeType: template.trade,
        // Set a helpful job scope placeholder based on the template's sections
        jobScope: template.sections.map(s => `${s.title}: [describe ${s.title.toLowerCase()} here]`).join("\n"),
      });

      toast.success(`Loaded "${template.name}" template — fill in the details below`);
      setSelectedTemplate("");
      return;
    }

    // User-saved template
    const template = savedTemplates?.find(t => t.id === parseInt(value));
    if (!template) return;

    setForm({
      ...form,
      title: template.name || form.title,
      tradeType: template.tradeType,
      clientName: template.clientName || form.clientName,
      clientAddress: template.clientAddress || form.clientAddress,
      jobScope: template.jobScope || form.jobScope,
      materials: template.materials || form.materials,
      laborCost: template.laborCost || form.laborCost,
      materialsCost: template.materialsCost || form.materialsCost,
      totalCost: template.totalCost || form.totalCost,
      expiryDays: template.expiryDays || 30,
    });

    toast.success(`Loaded template: ${template.name}`);
    setSelectedTemplate("");
  };

  const hasUserTemplates = savedTemplates && savedTemplates.length > 0;

  return (
    <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
          <LayoutTemplate className="w-4 h-4 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-blue-900">Start from a Template</p>
          <p className="text-xs text-blue-700 mt-0.5 mb-3">
            Choose a built-in template to pre-fill your proposal structure, or{" "}
            <button
              onClick={() => navigate("/templates/pick")}
              className="underline font-medium hover:text-blue-900"
            >
              browse the full template library
            </button>
            {" "}for a guided experience.
          </p>
          <Select value={selectedTemplate} onValueChange={handleLoadTemplate}>
            <SelectTrigger className="w-full bg-white border-blue-200 text-sm">
              <SelectValue placeholder="Choose a template to pre-fill..." />
            </SelectTrigger>
            <SelectContent>
              {/* Built-in templates grouped by trade */}
              <SelectItem value="__browse__" className="font-semibold text-blue-700">
                🗂 Browse Full Template Library →
              </SelectItem>
              <SelectSeparator />
              {TEMPLATE_DEFS.map(template => (
                <SelectItem key={template.id} value={`builtin:${template.id}`}>
                  {TRADE_LABELS[template.trade] || template.trade} — {template.name} ({STYLE_LABELS[template.style] || template.style})
                </SelectItem>
              ))}
              {/* User-saved templates */}
              {hasUserTemplates && (
                <>
                  <SelectSeparator />
                  {savedTemplates!.map(template => (
                    <SelectItem key={`saved-${template.id}`} value={template.id.toString()}>
                      ⭐ {template.name} ({TRADE_LABELS[template.tradeType] || template.tradeType})
                    </SelectItem>
                  ))}
                </>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>
    </Card>
  );
}
