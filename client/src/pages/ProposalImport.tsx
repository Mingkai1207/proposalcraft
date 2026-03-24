import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Upload, FileText, CheckCircle, AlertCircle, Loader } from "lucide-react";
import { toast } from "sonner";

export default function ProposalImport() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [files, setFiles] = useState<File[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);

  const importMutation = trpc.import.importProposals.useMutation({
    onSuccess: (result: any) => {
      toast.success(`Successfully imported ${result.templatesCreated} templates and extracted data!`);
      setTimeout(() => navigate("/dashboard"), 2000);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to import proposals");
      setIsExtracting(false);
    },
  });

  if (authLoading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (!isAuthenticated) {
    navigate("/");
    return null;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleImport = async () => {
    if (files.length === 0) {
      toast.error("Please select at least one file");
      return;
    }

    setIsExtracting(true);

    // Convert files to base64 for transmission
    const fileData = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        type: file.type,
        content: await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        }),
      }))
    );

    importMutation.mutate({ files: fileData as any });
    setIsExtracting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Import Your Proposals</h1>
          <p className="text-lg text-muted-foreground">
            Upload past proposals and let AI extract key information to jumpstart your account.
          </p>
        </div>

        <div className="space-y-6">
          {/* Upload Area */}
          <Card className="p-8 border-2 border-dashed hover:border-primary/50 transition-colors">
            <label className="flex flex-col items-center justify-center cursor-pointer">
              <Upload className="w-12 h-12 text-muted-foreground mb-3" />
              <span className="text-lg font-semibold text-foreground mb-1">
                Drop files here or click to select
              </span>
              <span className="text-sm text-muted-foreground">
                Supports PDF, Word (.docx), and text files
              </span>
              <input
                type="file"
                multiple
                accept=".pdf,.docx,.txt,.doc"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </Card>

          {/* Selected Files */}
          {files.length > 0 && (
            <Card className="p-6">
              <h3 className="font-semibold text-foreground mb-4">Selected Files ({files.length})</h3>
              <div className="space-y-2">
                {files.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm text-foreground flex-1">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* What We Extract */}
          <Card className="p-6 bg-blue-50 border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-3">What We'll Extract</h3>
            <div className="grid grid-cols-2 gap-3 text-sm text-blue-800">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Client names & contact info</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Project scope & details</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Pricing & cost breakdown</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Trade type identification</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Timeline & milestones</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Reusable templates</span>
              </div>
            </div>
          </Card>

          {/* Import Button */}
          <Button
            onClick={handleImport}
            disabled={files.length === 0 || isExtracting || importMutation.isPending}
            className="w-full h-12 text-base"
          >
            {isExtracting || importMutation.isPending ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Extracting data... (this may take a minute)
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Import {files.length > 0 ? `${files.length} File${files.length !== 1 ? "s" : ""}` : "Proposals"}
              </>
            )}
          </Button>

          {/* Info */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold mb-1">Privacy & Security</p>
                <p>
                  Your files are processed securely and used only to extract data for your account. We don't store the original files.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
