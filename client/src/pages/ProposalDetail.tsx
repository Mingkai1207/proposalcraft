import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useLocation, useParams } from "wouter";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import { VersionHistory } from "@/components/VersionHistory";
import {
  ArrowLeft, Send, Download, Eye, Clock, CheckCircle,
  Mail, AlertCircle, Edit2, Save, X, Zap, Share2, Loader2, FileText
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";

const STATUS_CONFIG = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-700", icon: Clock },
  sent: { label: "Sent", color: "bg-blue-100 text-blue-700", icon: Mail },
  viewed: { label: "Viewed", color: "bg-green-100 text-green-700", icon: Eye },
  accepted: { label: "Accepted", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
  declined: { label: "Declined", color: "bg-red-100 text-red-700", icon: AlertCircle },
};

export default function ProposalDetail() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const proposalId = parseInt(params.id || "0");

  const [sendOpen, setSendOpen] = useState(false);
  const [sendEmail, setSendEmail] = useState("");
  const [sendName, setSendName] = useState("");
  const [sendMessage, setSendMessage] = useState("");
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");

  const { data: proposal, isLoading, refetch } = trpc.proposals.get.useQuery(
    { id: proposalId },
    { enabled: isAuthenticated && proposalId > 0 }
  );

  const { data: subscription } = trpc.subscription.get.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  const isFreePlan = !subscription || subscription.plan === "free";
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const showUpgradeBanner = isFreePlan && !bannerDismissed && !!proposal;

  const sendMutation = trpc.proposals.send.useMutation({
    onSuccess: () => {
      toast.success("Proposal sent successfully!");
      setSendOpen(false);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.proposals.update.useMutation({
    onSuccess: () => {
      toast.success("Proposal saved");
      setEditing(false);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const shareLinkMutation = trpc.proposals.createShareLink.useMutation({
    onSuccess: (data) => {
      navigator.clipboard.writeText(data.shareUrl);
      toast.success("Share link copied to clipboard!");
    },
    onError: (e) => toast.error(e.message),
  });

  const followUpMutation = trpc.proposals.sendFollowUp.useMutation({
    onSuccess: () => {
      toast.success("Follow-up email sent!");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const saveTemplateMutation = trpc.templates.create.useMutation({
    onSuccess: () => {
      toast.success("Proposal saved as template!");
    },
    onError: (e) => toast.error(e.message),
  });

  // PDF export mutation - calls the professional PDF generation endpoint
  const exportPdfMutation = trpc.proposals.exportPdf.useMutation({
    onSuccess: (data) => {
      const link = document.createElement("a");
      link.href = data.url;
      link.download = data.fileName;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("PDF downloaded successfully!");
    },
    onError: (e) => toast.error(e.message || "Failed to generate PDF. Please try again."),
  });

  // Word export mutation
  const exportWordMutation = trpc.proposals.exportWord.useMutation({
    onSuccess: (data) => {
      const link = document.createElement("a");
      link.href = data.url;
      link.download = data.fileName;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Word document downloaded!");
    },
    onError: (e) => toast.error(e.message || "Failed to generate Word document."),
  });

  // Google Docs export mutation
  const exportGoogleDocsMutation = trpc.proposals.exportGoogleDocs.useMutation({
    onSuccess: (data) => {
      window.open(data.googleDocsViewerUrl, "_blank");
      toast.success("Opening in Google Docs viewer. Click 'Open with Google Docs' to edit.");
    },
    onError: (e) => toast.error(e.message || "Failed to export to Google Docs."),
  });

  if (authLoading || isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>;
  }
  if (!isAuthenticated) { window.location.href = getLoginUrl(); return null; }
  if (!proposal) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Proposal not found</p>
          <Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[proposal.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.draft;
  const StatusIcon = statusCfg.icon;

  const handleSend = () => {
    if (!sendEmail) { toast.error("Please enter client email"); return; }
    sendMutation.mutate({
      id: proposal.id,
      clientEmail: sendEmail,
      clientName: sendName || undefined,
      message: sendMessage || undefined,
    });
  };

  const handleSaveEdit = () => {
    updateMutation.mutate({ id: proposal.id, generatedContent: editContent });
  };

  const handleDownloadPDF = () => {
    if (!proposal) return;
    exportPdfMutation.mutate({ id: proposal.id });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Upgrade banner for free users */}
      {showUpgradeBanner && (
        <div className="bg-orange-50 border-b border-orange-200 px-4 py-2.5 flex items-center gap-3">
          <Zap className="w-4 h-4 text-orange-500 flex-shrink-0" />
          <p className="text-sm text-orange-800 flex-1">
            <strong>Free plan:</strong> This proposal has a ProposAI watermark on the PDF. Upgrade to remove it and unlock email delivery, read tracking, and custom branding.
          </p>
          <button
            onClick={() => navigate("/pricing")}
            className="text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 px-3 py-1 rounded-full transition-colors flex-shrink-0"
          >
            Upgrade
          </button>
          <button onClick={() => setBannerDismissed(true)} className="text-orange-400 hover:text-orange-600 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top bar */}
      <div className="border-b border-border bg-white px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
        <button onClick={() => navigate("/dashboard")} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-foreground truncate">{proposal.title}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${statusCfg.color}`}>
              <StatusIcon className="w-3 h-3" />
              {statusCfg.label}
            </span>
            {proposal.viewedAt && (
              <span className="text-xs text-muted-foreground">
                Viewed {new Date(proposal.viewedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!editing ? (
            <>
              <Button
                variant="outline" size="sm"
                onClick={() => navigate(`/proposals/${proposal.id}/edit`)}
              >
                <Edit2 className="w-4 h-4 mr-1" /> Edit
              </Button>
              {/* Export dropdown */}
              <div className="relative group">
                <Button
                  variant="default"
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={exportPdfMutation.isPending || exportWordMutation.isPending || exportGoogleDocsMutation.isPending}
                >
                  {(exportPdfMutation.isPending || exportWordMutation.isPending || exportGoogleDocsMutation.isPending) ? (
                    <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Generating...</>
                  ) : (
                    <><Download className="w-4 h-4 mr-1" /> Export ▾</>
                  )}
                </Button>
                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-border rounded-lg shadow-lg py-1 z-50 hidden group-hover:block">
                  <button
                    onClick={() => exportPdfMutation.mutate({ id: proposal.id })}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4 text-red-500" /> Download PDF
                  </button>
                  <button
                    onClick={() => exportWordMutation.mutate({ id: proposal.id })}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4 text-blue-500" /> Download Word (.docx)
                  </button>
                  <button
                    onClick={() => exportGoogleDocsMutation.mutate({ id: proposal.id })}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4 text-green-500" /> Open in Google Docs
                  </button>
                </div>
              </div>
              <Button size="sm" onClick={() => {
                setSendEmail(proposal.clientEmail || "");
                setSendName(proposal.clientName || "");
                setSendOpen(true);
              }}>
                <Send className="w-4 h-4 mr-1" /> Send to Client
              </Button>
              <Button variant="outline" size="sm" onClick={() => shareLinkMutation.mutate({ id: proposal.id })} disabled={shareLinkMutation.isPending}>
                <Share2 className="w-4 h-4 mr-1" /> Share Link
              </Button>
              {proposal.sentAt && !proposal.viewedAt && !proposal.followUpSentAt && (
                <Button variant="outline" size="sm" onClick={() => followUpMutation.mutate({ id: proposal.id })} disabled={followUpMutation.isPending}>
                  <Mail className="w-4 h-4 mr-1" /> {followUpMutation.isPending ? "Sending..." : "Send Follow-up"}
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => {
                saveTemplateMutation.mutate({
                  name: proposal.title,
                  tradeType: proposal.tradeType,
                  description: `Template from ${proposal.clientName || "proposal"}`,
                  content: proposal.generatedContent || "",
                  clientName: proposal.clientName,
                  clientAddress: proposal.clientAddress,
                  jobScope: proposal.jobScope,
                  materials: proposal.materials,
                  laborCost: proposal.laborCost,
                  materialsCost: proposal.materialsCost,
                  totalCost: proposal.totalCost,
                  language: "english",
                  expiryDays: proposal.expiryDays || 30,
                });
              }} disabled={saveTemplateMutation.isPending}>
                <Zap className="w-4 h-4 mr-1" /> {saveTemplateMutation.isPending ? "Saving..." : "Save as Template"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
                <X className="w-4 h-4 mr-1" /> Cancel
              </Button>
              <Button size="sm" onClick={handleSaveEdit} disabled={updateMutation.isPending}>
                <Save className="w-4 h-4 mr-1" /> Save Changes
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* PDF Generation Loading Banner */}
        {exportPdfMutation.isPending && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-900">Generating your professional PDF...</p>
              <p className="text-xs text-blue-700 mt-0.5">This may take a few seconds. Your proposal is being formatted with charts, tables, and professional styling.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Proposal content */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="bg-slate-900 px-6 py-4">
                <h2 className="text-white font-semibold">{proposal.title}</h2>
                {proposal.clientName && <p className="text-slate-400 text-sm">Prepared for: {proposal.clientName}</p>}
              </div>
              <div className="p-6">
                {editing ? (
                  <Textarea
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    rows={30}
                    className="font-mono text-sm resize-none"
                  />
                ) : (
                  <div className="prose prose-sm max-w-none text-foreground">
                    <Streamdown>{proposal.generatedContent || "No content generated yet."}</Streamdown>
                  </div>
                )}
              </div>
              {/* Download PDF CTA at bottom of content */}
              {!editing && (
                <div className="px-6 pb-6">
                  <div className="border-t border-border pt-4">
                    <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">Ready to share?</p>
                          <p className="text-xs text-slate-600">Download a professionally formatted PDF with charts and visual elements</p>
                        </div>
                      </div>
                      <Button
                        onClick={handleDownloadPDF}
                        disabled={exportPdfMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {exportPdfMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" /> Generating...
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4 mr-1" /> Download PDF
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar info */}
          <div className="space-y-4">
            {/* Job details */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold text-sm text-foreground mb-3">Job Details</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Trade:</span>
                  <span className="ml-2 text-foreground capitalize">{proposal.tradeType}</span>
                </div>
                {proposal.clientAddress && (
                  <div>
                    <span className="text-muted-foreground">Address:</span>
                    <p className="text-foreground mt-0.5">{proposal.clientAddress}</p>
                  </div>
                )}
                {proposal.totalCost && (
                  <div>
                    <span className="text-muted-foreground">Total:</span>
                    <span className="ml-2 text-foreground font-semibold">${proposal.totalCost}</span>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Created:</span>
                  <span className="ml-2 text-foreground">{new Date(proposal.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Version History */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold text-sm text-foreground mb-3">Version History</h3>
              <VersionHistory proposalId={proposal.id} />
            </div>

            {/* Tracking */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold text-sm text-foreground mb-3">Tracking</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className={`w-2 h-2 rounded-full ${proposal.sentAt ? "bg-blue-500" : "bg-gray-300"}`} />
                  <span className={proposal.sentAt ? "text-foreground" : "text-muted-foreground"}>
                    {proposal.sentAt ? `Sent ${new Date(proposal.sentAt).toLocaleDateString()}` : "Not sent yet"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className={`w-2 h-2 rounded-full ${proposal.viewedAt ? "bg-green-500" : "bg-gray-300"}`} />
                  <span className={proposal.viewedAt ? "text-foreground" : "text-muted-foreground"}>
                    {proposal.viewedAt ? `Viewed ${new Date(proposal.viewedAt).toLocaleDateString()}` : "Not viewed yet"}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick send */}
            {proposal.status === "draft" && (
              <Button className="w-full" onClick={() => {
                setSendEmail(proposal.clientEmail || "");
                setSendName(proposal.clientName || "");
                setSendOpen(true);
              }}>
                <Send className="w-4 h-4 mr-2" /> Send to Client
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Send Dialog */}
      <Dialog open={sendOpen} onOpenChange={setSendOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Proposal to Client</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm font-medium mb-2 block">Client Email <span className="text-destructive">*</span></Label>
              <Input
                type="email"
                placeholder="client@example.com"
                value={sendEmail}
                onChange={e => setSendEmail(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Client Name</Label>
              <Input
                placeholder="John Smith"
                value={sendName}
                onChange={e => setSendName(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Personal Message (optional)</Label>
              <Textarea
                placeholder="Thank you for considering us for your project..."
                value={sendMessage}
                onChange={e => setSendMessage(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              A read receipt will be added so you know when the client opens your proposal.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendOpen(false)}>Cancel</Button>
            <Button onClick={handleSend} disabled={sendMutation.isPending}>
              {sendMutation.isPending ? "Sending..." : <><Send className="w-4 h-4 mr-1" /> Send Proposal</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
