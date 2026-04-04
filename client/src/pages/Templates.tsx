import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Trash2,
  Edit2,
  Plus,
  Upload,
  FileText,
  Sparkles,
  ArrowRight,
  Clock,
  BookTemplate,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

const ALL_TRADE_TYPES = [
  "hvac", "plumbing", "electrical", "roofing", "general",
  "painting", "flooring", "landscaping", "carpentry", "concrete",
  "masonry", "insulation", "drywall", "windows", "solar",
] as const;

const TRADE_LABELS: Record<string, string> = {
  hvac: "HVAC", plumbing: "Plumbing", electrical: "Electrical",
  roofing: "Roofing", general: "General Contracting", painting: "Painting",
  flooring: "Flooring", landscaping: "Landscaping", carpentry: "Carpentry",
  concrete: "Concrete", masonry: "Masonry", insulation: "Insulation",
  drywall: "Drywall", windows: "Windows & Doors", solar: "Solar",
};

// ── Upload Template Dialog ────────────────────────────────────────────────────
function UploadTemplateDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [tradeType, setTradeType] = useState("general");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [extractedContent, setExtractedContent] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);

  const uploadMutation = trpc.templates.uploadTemplate.useMutation({
    onSuccess: () => {
      toast.success("Template uploaded successfully!");
      setOpen(false);
      setName(""); setTradeType("general"); setDescription(""); setFile(null); setExtractedContent("");
      onSuccess();
    },
    onError: (err) => toast.error(err.message || "Failed to upload template"),
  });

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      toast.error("File exceeds 10MB limit. Please use a smaller file.");
      e.target.value = "";
      return;
    }
    setFile(f);
    setIsExtracting(true);

    // Extract text content from the file
    try {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        // For plain text and basic extraction — strip binary chars
        const cleaned = text.replace(/[^\x20-\x7E\n\r\t]/g, " ").replace(/\s{3,}/g, "\n\n").trim();
        setExtractedContent(cleaned.slice(0, 50000)); // cap at 50k chars
        setIsExtracting(false);
      };
      reader.onerror = () => {
        toast.error("Could not read file. Please paste the content manually.");
        setIsExtracting(false);
      };
      // Read as text for .txt and .md; for .docx/.pdf we read as binary and strip
      if (f.type === "text/plain" || f.name.endsWith(".md") || f.name.endsWith(".txt")) {
        reader.readAsText(f);
      } else {
        reader.readAsBinaryString(f);
      }
    } catch {
      setIsExtracting(false);
      toast.error("Could not read file");
    }
  }

  function handleSubmit() {
    if (!name.trim()) { toast.error("Please enter a template name"); return; }
    if (!extractedContent.trim()) { toast.error("Please upload a file or paste the template content"); return; }
    uploadMutation.mutate({ name, tradeType, description, content: extractedContent });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="w-4 h-4" /> Upload Template
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" /> Upload a Template Document
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-sm text-primary">
            Upload an existing proposal or template document. ProposAI will use its structure and format when generating new proposals.
          </div>

          <div className="space-y-1.5">
            <Label>Template Name <span className="text-destructive">*</span></Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Standard HVAC Replacement Proposal" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Trade Type</Label>
              <Select value={tradeType} onValueChange={setTradeType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ALL_TRADE_TYPES.map(t => (
                    <SelectItem key={t} value={t}>{TRADE_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Description (optional)</Label>
              <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description..." />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Upload File</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
              <input
                type="file"
                accept=".txt,.md,.doc,.docx,.pdf"
                onChange={handleFileChange}
                className="hidden"
                id="template-file-upload"
              />
              <label htmlFor="template-file-upload" className="cursor-pointer">
                {isExtracting ? (
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" /> Extracting content...
                  </div>
                ) : file ? (
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <CheckCircle2 className="w-4 h-4" /> {file.name} — content extracted
                  </div>
                ) : (
                  <div className="text-muted-foreground">
                    <Upload className="w-6 h-6 mx-auto mb-1" />
                    <div className="text-sm">Click to upload .txt, .md, .doc, .docx, or .pdf</div>
                    <div className="text-xs mt-1">Or paste content below</div>
                  </div>
                )}
              </label>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              For best results, use .txt or .md files. For .docx/.pdf, you may need to paste the content manually below.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Template Content <span className="text-destructive">*</span></Label>
            <Textarea
              value={extractedContent}
              onChange={e => setExtractedContent(e.target.value)}
              rows={10}
              placeholder="Paste or edit your template content here. This is what ProposAI will use as the structural reference..."
              className="font-mono text-sm resize-none"
            />
            <p className="text-xs text-muted-foreground">{extractedContent.length.toLocaleString()} characters</p>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={uploadMutation.isPending}
            className="w-full gap-2"
          >
            {uploadMutation.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Saving Template...</>
            ) : (
              <><Upload className="w-4 h-4" /> Save Template</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Edit Template Dialog ──────────────────────────────────────────────────────
function EditTemplateDialog({ template, onSuccess }: { template: any; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(template.name);
  const [description, setDescription] = useState(template.description || "");
  const [content, setContent] = useState(template.content);

  const updateMutation = trpc.templates.update.useMutation({
    onSuccess: () => {
      toast.success("Template updated");
      setOpen(false);
      onSuccess();
    },
    onError: (err) => toast.error(err.message || "Failed to update template"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
          <Edit2 className="w-3.5 h-3.5" /> Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Template</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional description..." />
          </div>
          <div className="space-y-1.5">
            <Label>Content</Label>
            <Textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={12}
              className="font-mono text-sm resize-none"
            />
          </div>
          <Button
            onClick={() => updateMutation.mutate({ id: template.id, name, description, content })}
            disabled={updateMutation.isPending}
            className="w-full"
          >
            {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function Templates() {
  const [, navigate] = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { data: templates, isLoading, isError: templatesError, refetch } = trpc.templates.list.useQuery(
    undefined, { enabled: isAuthenticated }
  );
  const deleteMutation = trpc.templates.delete.useMutation({
    onSuccess: () => { toast.success("Template deleted"); refetch(); },
    onError: () => toast.error("Failed to delete template"),
  });

  // Redirect to login if not authenticated (useEffect avoids setState-during-render warning)
  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate("/login");
  }, [authLoading, isAuthenticated]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const savedTemplates = templates?.filter(t => t.sourceType === "saved_from_proposal") || [];
  const uploadedTemplates = templates?.filter(t => t.sourceType === "uploaded") || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <FileText className="w-6 h-6 text-primary" />
                My Templates
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Save proposals as reusable templates, or upload your own. ProposAI will follow the template's structure when generating new proposals.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <UploadTemplateDialog onSuccess={refetch} />
              <Button onClick={() => navigate("/proposals/from-template")} className="gap-2">
                <Sparkles className="w-4 h-4" /> <span className="hidden sm:inline">New from Template</span><span className="sm:hidden">New</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading templates...
          </div>
        ) : templatesError ? (
          <div className="text-center py-16 space-y-4">
            <p className="text-destructive text-sm">Failed to load templates.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
          </div>
        ) : !templates || templates.length === 0 ? (
          // Empty state
          <div className="text-center py-16 space-y-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">No templates yet</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Templates let you generate proposals that follow a specific structure and format.
                Upload an existing proposal or save one of your generated proposals as a template.
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <UploadTemplateDialog onSuccess={refetch} />
              <Button variant="outline" onClick={() => navigate("/proposals/new")}>
                Create a Proposal First
              </Button>
            </div>

            {/* How it works */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mt-8 text-left">
              {[
                { icon: Upload, title: "1. Add a Template", desc: "Upload an existing proposal or save one you've already generated." },
                { icon: FileText, title: "2. Fill Project Info", desc: "Enter the new client and job details. No style questions needed." },
                { icon: Sparkles, title: "3. ProposAI Generates", desc: "ProposAI writes a new proposal that follows your template's exact structure." },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="p-4 rounded-xl border border-border bg-card text-center">
                  <Icon className="w-6 h-6 text-primary mx-auto mb-2" />
                  <div className="font-semibold text-sm text-foreground mb-1">{title}</div>
                  <div className="text-xs text-muted-foreground">{desc}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Uploaded templates */}
            {uploadedTemplates.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4 text-muted-foreground" />
                  <h2 className="font-semibold text-foreground">Uploaded Templates</h2>
                  <Badge variant="secondary">{uploadedTemplates.length}</Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {uploadedTemplates.map(t => (
                    <TemplateCard
                      key={t.id}
                      template={t}
                      onDelete={() => deleteMutation.mutate({ id: t.id })}
                      onRefresh={refetch}
                      onUse={() => navigate(`/proposals/from-template?templateId=${t.id}`)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Saved from proposals */}
            {savedTemplates.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                  <h2 className="font-semibold text-foreground">Saved from Proposals</h2>
                  <Badge variant="secondary">{savedTemplates.length}</Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {savedTemplates.map(t => (
                    <TemplateCard
                      key={t.id}
                      template={t}
                      onDelete={() => deleteMutation.mutate({ id: t.id })}
                      onRefresh={refetch}
                      onUse={() => navigate(`/proposals/from-template?templateId=${t.id}`)}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Template Card ─────────────────────────────────────────────────────────────
function TemplateCard({
  template,
  onDelete,
  onRefresh,
  onUse,
}: {
  template: any;
  onDelete: () => void;
  onRefresh: () => void;
  onUse: () => void;
}) {
  const createdAt = new Date(template.createdAt).toLocaleDateString();

  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-semibold truncate">{template.name}</CardTitle>
            {template.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{template.description}</p>
            )}
          </div>
          <Badge variant="outline" className="text-xs flex-shrink-0">
            {TRADE_LABELS[template.tradeType] || template.tradeType}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-3">
        {/* Content preview */}
        <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground font-mono line-clamp-4 flex-1">
          {template.content.slice(0, 300)}{template.content.length > 300 ? "..." : ""}
        </div>

        {/* Meta */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>Added {createdAt}</span>
          <span className="ml-auto">{(template.content.length / 1000).toFixed(1)}k chars</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1 border-t border-border">
          <Button onClick={onUse} size="sm" className="flex-1 gap-1.5 text-xs">
            <Sparkles className="w-3.5 h-3.5" /> Use Template
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
          <EditTemplateDialog template={template} onSuccess={onRefresh} />
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs text-destructive hover:text-destructive"
            onClick={() => {
              if (confirm(`Delete "${template.name}"? This cannot be undone.`)) onDelete();
            }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default Templates;
