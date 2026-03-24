import React from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Zap } from "lucide-react";
import { toast } from "sonner";

interface TemplateQuickCreateProps {
  form: any;
  setForm: (form: any) => void;
}

export function TemplateQuickCreate({ form, setForm }: TemplateQuickCreateProps) {
  const { data: templates, isLoading } = trpc.templates.list.useQuery();
  const [selectedTemplate, setSelectedTemplate] = React.useState<string>("");

  const handleLoadTemplate = (templateId: string) => {
    const template = templates?.find(t => t.id === parseInt(templateId));
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

  if (!templates || templates.length === 0) {
    return null;
  }

  return (
    <Card className="p-4 bg-blue-50 border-blue-200">
      <div className="flex items-center gap-3">
        <Zap className="w-5 h-5 text-blue-600" />
        <div className="flex-1">
          <p className="font-medium text-sm text-blue-900">Quick Start from Template</p>
          <p className="text-xs text-blue-700 mt-0.5">Load a saved template to auto-fill your proposal</p>
        </div>
        <Select value={selectedTemplate} onValueChange={handleLoadTemplate}>
          <SelectTrigger className="w-48 bg-white">
            <SelectValue placeholder="Select a template..." />
          </SelectTrigger>
          <SelectContent>
            {templates.map(template => (
              <SelectItem key={template.id} value={template.id.toString()}>
                {template.name} ({template.tradeType})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </Card>
  );
}
