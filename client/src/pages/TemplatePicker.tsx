import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle, Zap, BarChart2, FileText, Clock } from "lucide-react";
import { TEMPLATE_DEFS, TEMPLATE_TRADES, type ProposalTemplateDef, type StyleVariant } from "../../../shared/templateDefs";

const TRADE_LABELS: Record<string, string> = {
  hvac: "HVAC", plumbing: "Plumbing", electrical: "Electrical",
  roofing: "Roofing", general: "General", painting: "Painting",
  flooring: "Flooring", landscaping: "Landscaping", carpentry: "Carpentry",
  concrete: "Concrete", masonry: "Masonry", insulation: "Insulation",
  drywall: "Drywall", windows: "Windows & Doors", solar: "Solar",
};

const STYLE_COLORS: Record<StyleVariant, { bg: string; text: string; border: string }> = {
  modern: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  classic: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  minimal: { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" },
};

function TemplateCard({ template, selected, onSelect }: {
  template: ProposalTemplateDef;
  selected: boolean;
  onSelect: () => void;
}) {
  const styleColor = STYLE_COLORS[template.style];
  const vizCount = template.visualizations.length;
  const fieldCount = template.inputFields.length;
  const sectionCount = template.sections.length;

  return (
    <button
      onClick={onSelect}
      className={`relative w-full text-left rounded-2xl border-2 transition-all duration-200 overflow-hidden group
        ${selected
          ? "border-primary shadow-lg shadow-primary/10 scale-[1.01]"
          : "border-border hover:border-primary/40 hover:shadow-md"
        }`}
    >
      {/* Template header preview */}
      <div
        className="h-20 flex items-end px-5 pb-3"
        style={{ background: `linear-gradient(135deg, ${template.accentColor} 0%, ${template.accentColor}cc 100%)` }}
      >
        <div className="flex items-center justify-between w-full">
          <div>
            <div className="text-white/80 text-xs font-medium uppercase tracking-wider">{TRADE_LABELS[template.trade]}</div>
            <div className="text-white font-bold text-sm">{template.name}</div>
          </div>
          {selected && (
            <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center shadow">
              <CheckCircle className="w-4 h-4 text-primary" />
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 bg-card">
        <p className="text-sm text-muted-foreground leading-snug mb-3">{template.description}</p>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" />
            {sectionCount} sections
          </span>
          <span className="flex items-center gap-1">
            <BarChart2 className="w-3.5 h-3.5" />
            {vizCount} charts
          </span>
          <span className="flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" />
            {fieldCount} fields
          </span>
        </div>

        {/* Style badge */}
        <div className="mt-3">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${styleColor.bg} ${styleColor.text} ${styleColor.border}`}>
            {template.style.charAt(0).toUpperCase() + template.style.slice(1)}
          </span>
        </div>
      </div>
    </button>
  );
}

export default function TemplatePicker() {
  const [, navigate] = useLocation();
  const [selectedTrade, setSelectedTrade] = useState<string>("all");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const tradesWithTemplates = TEMPLATE_TRADES;
  const filteredTemplates = selectedTrade === "all"
    ? TEMPLATE_DEFS
    : TEMPLATE_DEFS.filter(t => t.trade === selectedTrade);

  const selected = TEMPLATE_DEFS.find(t => t.id === selectedTemplate);

  function handleContinue() {
    if (!selectedTemplate) return;
    navigate(`/proposals/from-template?template=${selectedTemplate}`);
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="gap-1">
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </Button>
            <div className="h-5 w-px bg-border" />
            <div>
              <h1 className="font-bold text-foreground">Choose a Template</h1>
              <p className="text-xs text-muted-foreground">Pick a style, fill in your details — AI does the rest</p>
            </div>
          </div>
          <Button
            onClick={handleContinue}
            disabled={!selectedTemplate}
            className="gap-2"
          >
            <Zap className="w-4 h-4" />
            {selectedTemplate ? `Use ${selected?.name.split("—")[1]?.trim() || "Template"}` : "Select a Template"}
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* How it works */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { step: "1", icon: FileText, title: "Pick a template", desc: "Choose your trade and visual style" },
            { step: "2", icon: Zap, title: "Fill in your details", desc: "Client info, scope, costs — just the key facts" },
            { step: "3", icon: BarChart2, title: "AI builds the proposal", desc: "Polished content + charts, ready to export as PDF, Word, or Google Doc" },
          ].map(({ step, icon: Icon, title, desc }) => (
            <div key={step} className="flex items-start gap-3 p-4 rounded-xl bg-muted/40 border border-border">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm flex-shrink-0">{step}</div>
              <div>
                <div className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5" /> {title}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Trade filter tabs */}
        <div className="flex items-center gap-2 flex-wrap mb-6">
          <button
            onClick={() => setSelectedTrade("all")}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors
              ${selectedTrade === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
          >
            All Trades
          </button>
          {tradesWithTemplates.map(trade => (
            <button
              key={trade}
              onClick={() => setSelectedTrade(trade)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                ${selectedTrade === trade ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
            >
              {TRADE_LABELS[trade] || trade}
            </button>
          ))}
        </div>

        {/* Template grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              selected={selectedTemplate === template.id}
              onSelect={() => setSelectedTemplate(template.id)}
            />
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No templates for this trade yet</p>
            <p className="text-sm mt-1">More templates coming soon. Try "General Contracting" for now.</p>
          </div>
        )}

        {/* Bottom CTA */}
        {selectedTemplate && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20">
            <div className="bg-card border border-border rounded-2xl shadow-xl px-6 py-4 flex items-center gap-4">
              <div>
                <div className="font-semibold text-foreground text-sm">{selected?.name}</div>
                <div className="text-xs text-muted-foreground">{selected?.sections.length} sections · {selected?.visualizations.length} charts</div>
              </div>
              <Button onClick={handleContinue} className="gap-2 whitespace-nowrap">
                <Zap className="w-4 h-4" /> Use This Template
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
