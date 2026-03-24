import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2, Edit2, Plus, Copy } from "lucide-react";
import { toast } from "sonner";

export function Templates() {
  const { data: templates, isLoading, refetch } = trpc.templates.list.useQuery();
  const deleteTemplate = trpc.templates.delete.useMutation();
  const updateTemplate = trpc.templates.update.useMutation();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editContent, setEditContent] = useState("");

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this template?")) {
      try {
        await deleteTemplate.mutateAsync({ id });
        toast.success("Template deleted");
        refetch();
      } catch (error) {
        toast.error("Failed to delete template");
      }
    }
  };

  const handleSaveEdit = async (id: number) => {
    try {
      await updateTemplate.mutateAsync({
        id,
        name: editName,
        description: editDescription,
        content: editContent,
      });
      toast.success("Template updated");
      setEditingId(null);
      refetch();
    } catch (error) {
      toast.error("Failed to update template");
    }
  };

  const handleCopyTemplate = (template: any) => {
    const templateData = JSON.stringify({
      tradeType: template.tradeType,
      jobScope: template.jobScope,
      materials: template.materials,
      laborCost: template.laborCost,
      materialsCost: template.materialsCost,
      totalCost: template.totalCost,
      expiryDays: template.expiryDays,
    });
    navigator.clipboard.writeText(templateData);
    toast.success("Template data copied to clipboard");
  };

  if (isLoading) return <div className="p-8">Loading templates...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Proposal Templates</h1>
        <Button asChild>
          <a href="/new-proposal">
            <Plus className="w-4 h-4 mr-2" />
            Create New Template
          </a>
        </Button>
      </div>

      {!templates || templates.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-500 mb-4">No templates yet. Create your first template by saving a proposal.</p>
          <Button asChild>
            <a href="/new-proposal">Create Proposal</a>
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {templates.map((template) => (
            <Card key={template.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{template.name}</h3>
                  <p className="text-sm text-gray-500">{template.tradeType} • {template.description}</p>
                </div>
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingId(template.id);
                          setEditName(template.name);
                          setEditDescription(template.description || "");
                          setEditContent(template.content);
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Template</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input
                          placeholder="Template name"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                        />
                        <Input
                          placeholder="Description"
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                        />
                        <Textarea
                          placeholder="Template content"
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={6}
                        />
                        <Button
                          onClick={() => handleSaveEdit(template.id)}
                          className="w-full"
                        >
                          Save Changes
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyTemplate(template)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(template.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded text-sm text-gray-600 max-h-40 overflow-y-auto">
                {template.content}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
