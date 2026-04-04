import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/RichTextEditor";
import { toast } from "sonner";
import { Download, Save, Eye, ArrowLeft, AlertCircle } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

interface ProposalEditorProps {
  proposalId: number;
}

export default function ProposalEditor({ proposalId }: ProposalEditorProps) {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [content, setContent] = useState("");
  const [savedContent, setSavedContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const isDirty = content !== savedContent;

  const { data: proposal, isLoading, isError: proposalError, refetch } = trpc.proposals.get.useQuery(
    { id: proposalId },
    { enabled: isAuthenticated }
  );

  const updateMutation = trpc.proposals.update.useMutation({
    onSuccess: () => {
      toast.success("Proposal saved successfully");
      setSavedContent(content);
      setIsSaving(false);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to save proposal");
      setIsSaving(false);
    },
  });

  const exportPdfMutation = trpc.proposals.exportPdf.useMutation({
    onSuccess: (data) => {
      const link = document.createElement("a");
      link.href = data.url; link.download = data.fileName;
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      toast.success("PDF downloaded!");
    },
    onError: (err) => toast.error(err.message || "Failed to export PDF"),
  });



  useEffect(() => {
    if (proposal?.generatedContent) {
      setContent(proposal.generatedContent);
      setSavedContent(proposal.generatedContent);
    }
  }, [proposal]);

  // Warn the user if they try to close/reload with unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = "/";
    return null;
  }

  if (proposalError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">Failed to load proposal</p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => refetch()}>Retry</Button>
            <Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
          </div>
        </div>
      </div>
    );
  }
  if (!proposal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Proposal not found</p>
          <Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    setIsSaving(true);
    await updateMutation.mutateAsync({
      id: proposalId,
      generatedContent: content,
    });
  };

  const handleExportPdf = () => {
    exportPdfMutation.mutate({ id: proposalId });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">{proposal.title}</h1>
              <p className="text-sm text-muted-foreground">
                Client: {proposal.clientName || "N/A"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={isPreviewMode ? "default" : "outline"}
              size="sm"
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className="gap-2"
            >
              <Eye className="w-4 h-4" />
              {isPreviewMode ? "Edit" : "Preview"}
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !isDirty}
              size="sm"
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Saving..." : isDirty ? "Save*" : "Saved"}
            </Button>
            <Button
              onClick={handleExportPdf}
              disabled={!proposal || exportPdfMutation.isPending}
              size="sm"
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              {exportPdfMutation.isPending ? "Generating..." : "Export PDF"}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {isPreviewMode ? (
          // Preview Mode — use sandboxed iframe to avoid XSS from raw HTML content
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <iframe
              srcDoc={content}
              title="Proposal Preview"
              className="w-full border-0"
              style={{ height: "600px" }}
              sandbox=""
            />
          </div>
        ) : (
          // Edit Mode
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                💡 <strong>Tip:</strong> Edit your proposal freely using the formatting tools. 
                Click "Preview" to see how it will look, then "Export PDF" to download the final version.
              </p>
            </div>
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="Edit your proposal here..."
            />
          </div>
        )}
      </div>
    </div>
  );
}
