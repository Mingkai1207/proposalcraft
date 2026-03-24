import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, Sparkles, FileText, BarChart2, Zap } from "lucide-react";
import { TEMPLATE_STYLES, type TemplateStyle } from "../../../shared/templateDefs";

export default function TemplatePicker() {
  const [, navigate] = useLocation();
  const [selected, setSelected] = useState<TemplateStyle | null>(null);

  function handleContinue() {
    if (!selected) return;
    navigate(`/proposals/from-template?style=${selected.id}`);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="gap-1">
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </Button>
            <div className="h-5 w-px bg-gray-200" />
            <div>
              <h1 className="font-bold text-gray-900">Choose a Visual Style</h1>
              <p className="text-xs text-gray-500">Pick the look that best represents your business</p>
            </div>
          </div>
          <Button onClick={handleContinue} disabled={!selected} className="gap-2">
            <Sparkles className="w-4 h-4" />
            {selected ? `Continue with ${selected.name}` : "Select a Style"}
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* How it works */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { step: "1", icon: FileText, title: "Pick a visual style", desc: "Choose the presentation that fits your brand" },
            { step: "2", icon: Zap, title: "Fill in project details", desc: "Client info, scope, costs — just the key facts" },
            { step: "3", icon: BarChart2, title: "AI builds the proposal", desc: "Polished content + charts, ready to export as PDF, Word, or Google Doc" },
          ].map(({ step, icon: Icon, title, desc }) => (
            <div key={step} className="flex items-start gap-3 p-4 rounded-xl bg-white border">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">{step}</div>
              <div>
                <div className="font-semibold text-sm text-gray-900 flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5" /> {title}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Style grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {TEMPLATE_STYLES.map((style) => {
            const isSelected = selected?.id === style.id;
            return (
              <button
                key={style.id}
                onClick={() => setSelected(style)}
                className={`group relative text-left rounded-2xl border-2 overflow-hidden transition-all shadow-sm hover:shadow-lg ${
                  isSelected
                    ? "border-blue-600 ring-2 ring-blue-200 shadow-lg"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                {/* Preview gradient */}
                <div className="h-36 w-full relative" style={{ background: style.previewGradient }}>
                  {/* Mock document lines */}
                  <div className="p-5 flex flex-col gap-2 opacity-40">
                    <div className="h-3 bg-white rounded w-3/5" />
                    <div className="h-2 bg-white rounded w-2/5" />
                    <div className="mt-3 h-2 bg-white rounded w-4/5" />
                    <div className="h-2 bg-white rounded w-3/4" />
                    <div className="h-2 bg-white rounded w-1/2" />
                  </div>
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center shadow">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="bg-white p-5">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-bold text-gray-900 text-base">{style.name}</h3>
                    <Badge
                      className="text-xs shrink-0 ml-2 border-0"
                      style={{ background: style.badgeColor, color: "#fff" }}
                    >
                      {style.badge}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 italic mb-2">{style.tagline}</p>
                  <p className="text-xs text-gray-600 leading-relaxed">{style.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom CTA */}
        {selected && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20">
            <div className="bg-white border shadow-xl rounded-2xl px-6 py-4 flex items-center gap-4">
              <div>
                <div className="font-semibold text-gray-900 text-sm">{selected.name}</div>
                <div className="text-xs text-gray-500">{selected.tagline}</div>
              </div>
              <Button onClick={handleContinue} className="gap-2 whitespace-nowrap">
                <Sparkles className="w-4 h-4" /> Use This Style
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
