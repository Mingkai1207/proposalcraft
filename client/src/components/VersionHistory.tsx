import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Clock, RotateCcw, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export function VersionHistory({ proposalId }: { proposalId: number }) {
  const [selectedVersion, setSelectedVersion] = useState<any>(null);
  const utils = trpc.useUtils();

  const { data: versions, isLoading, refetch } = trpc.versions.listVersions.useQuery({ proposalId });
  const restoreMutation = trpc.versions.restoreVersion.useMutation({
    onSuccess: () => {
      toast.success("Version restored successfully");
      refetch();
      // Invalidate the parent proposal so the detail page refreshes with restored content
      utils.proposals.get.invalidate({ id: proposalId });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to restore version");
    },
  });

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading versions...</div>;
  if (!versions || versions.length === 0) {
    return <div className="text-sm text-muted-foreground">No version history yet</div>;
  }

  const handleRestore = (versionId: number) => {
    if (confirm("Restore this version? Current changes will be overwritten.")) {
      restoreMutation.mutate({ proposalId, versionId });
      setSelectedVersion(null); // close the view modal if open
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        {versions.map((version) => (
          <Card key={version.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Version {version.versionNumber}</span>
                  <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(version.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{version.title}</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  {version.clientName && <div>Client: {version.clientName}</div>}
                  {version.totalCost && <div>Cost: {version.totalCost}</div>}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedVersion(version)}
                  className="gap-1"
                >
                  <Eye className="w-4 h-4" />
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRestore(version.id)}
                  disabled={restoreMutation.isPending}
                  className="gap-1"
                >
                  <RotateCcw className="w-4 h-4" />
                  Restore
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* View Version Modal */}
      <Dialog open={!!selectedVersion} onOpenChange={(open) => !open && setSelectedVersion(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Version {selectedVersion?.versionNumber} Details</DialogTitle>
          </DialogHeader>
          {selectedVersion && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <p className="text-sm text-muted-foreground">{selectedVersion.title}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Created</label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedVersion.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Client Name</label>
                  <p className="text-sm text-muted-foreground">{selectedVersion.clientName || "—"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Client Email</label>
                  <p className="text-sm text-muted-foreground">{selectedVersion.clientEmail || "—"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Total Cost</label>
                  <p className="text-sm text-muted-foreground">{selectedVersion.totalCost || "—"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Labor Cost</label>
                  <p className="text-sm text-muted-foreground">{selectedVersion.laborCost || "—"}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Job Scope</label>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedVersion.jobScope || "—"}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Materials</label>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedVersion.materials || "—"}</p>
              </div>
              <Button
                onClick={() => handleRestore(selectedVersion.id)}
                disabled={restoreMutation.isPending}
                className="w-full gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Restore This Version
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
