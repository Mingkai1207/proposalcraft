import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SuggestInput, SuggestTextarea } from "@/components/ui/suggest-input";
import { Badge } from "@/components/ui/badge";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import { VersionHistory } from "@/components/VersionHistory";
import {
  ArrowLeft, Send, Download, Eye, Clock, CheckCircle,
  Mail, AlertCircle, Edit2, Save, X, Zap, Share2, Loader2,
  FileText, Lock, MessageSquare, FileDown, Globe,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle
} from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { AIChatBox } from "@/components/AIChatBox";
import type { Message } from "@/components/AIChatBox";

/**
 * Sanitize HTML proposal CSS to fix common print issues from older generations.
 * Removes CSS rules that prevent multi-page printing in Chrome/Safari.
 */
function sanitizeProposalHtml(html: string): string {
  return html
    // Remove break-inside: avoid-page on section-level elements (the main culprit)
    .replace(/break-inside\s*:\s*avoid-page\s*;/gi, "/* break-inside: avoid-page removed */")
    .replace(/page-break-inside\s*:\s*avoid\s*;/gi, "/* page-break-inside: avoid removed */")
    // Remove unsupported CSS Paged Media running elements
    .replace(/position\s*:\s*running\([^)]*\)\s*;/gi, "")
    .replace(/@top-right\s*\{[^}]*\}/gi, "")
    .replace(/@bottom-left\s*\{[^}]*\}/gi, "")
    // Remove height/overflow constraints on body/html that truncate content
    .replace(/(body|html)\s*\{([^}]*)(height\s*:\s*100vh\s*;)([^}]*)\}/gi,
      (_m, tag, before, _h, after) => `${tag} {${before}${after}}`)
    .replace(/(body|html)\s*\{([^}]*)(overflow\s*:\s*hidden\s*;)([^}]*)\}/gi,
      (_m, tag, before, _o, after) => `${tag} {${before}${after}}`);
}

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
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // AI revision chat state
  const [reviseOpen, setReviseOpen] = useState(false);
  const [reviseMessages, setReviseMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I can revise this proposal for you. Describe what you'd like to change — for example:\n\n- \"Make the scope of work more detailed\"\n- \"Change payment terms to net-30\"\n- \"Add a safety precautions section\"\n- \"Make the tone more formal and authoritative\""
    }
  ]);

  const { data: proposal, isLoading, isError: proposalError, refetch } = trpc.proposals.get.useQuery(
    { id: proposalId },
    { enabled: isAuthenticated && proposalId > 0 }
  );

  const { data: subscription } = trpc.subscription.get.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const plan = subscription?.plan ?? "free";
  const isFreePlan = false; // TEMP: all features free during promotional period
  const isPaidPlan = true; // TEMP: treat all users as paid
  const showUpgradeBanner = false; // TEMP: hide upgrade banner

  // ── Mutations ──────────────────────────────────────────────────────────────

  const sendMutation = trpc.proposals.send.useMutation({
    onSuccess: () => { toast.success("Proposal sent!"); setSendOpen(false); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.proposals.update.useMutation({
    onSuccess: () => { toast.success("Proposal saved"); setEditing(false); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const shareLinkMutation = trpc.proposals.createShareLink.useMutation({
    onSuccess: async (data) => {
      try {
        await navigator.clipboard.writeText(data.shareUrl);
        toast.success("Share link copied!");
      } catch {
        // Clipboard API unavailable — show URL so user can copy manually
        window.prompt("Copy share link:", data.shareUrl);
      }
    },
    onError: (e) => toast.error(e.message),
  });

  const followUpMutation = trpc.proposals.sendFollowUp.useMutation({
    onSuccess: () => { toast.success("Follow-up sent!"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const saveTemplateMutation = trpc.templates.saveAsTemplate.useMutation({
    onSuccess: () => toast.success("Saved as template! View it in My Templates."),
    onError: (e) => toast.error(e.message),
  });

  // On-demand PDF export (fallback if no pre-generated URL)
  const utils = trpc.useUtils();
  const exportPdfMutation = trpc.proposals.exportPdf.useMutation({
    onSuccess: (data) => {
      const link = document.createElement("a");
      link.href = data.url; link.download = data.fileName;
      link.target = "_blank"; link.rel = "noopener noreferrer";
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      toast.success("PDF downloaded!");
      // Refresh proposal data so pdfUrl is available for future downloads
      utils.proposals.get.invalidate({ id: proposalId });
    },
    onError: (e) => toast.error(e.message || "Failed to generate PDF."),
  });

  // On-demand Word export (fallback)
  const exportWordMutation = trpc.proposals.exportWord.useMutation({
    onSuccess: (data) => {
      const link = document.createElement("a");
      link.href = data.url; link.download = data.fileName;
      link.target = "_blank"; link.rel = "noopener noreferrer";
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      toast.success("Word document downloaded!");
    },
    onError: (e) => toast.error(e.message || "Failed to generate Word document."),
  });

  // On-demand Google Docs export (fallback)
  const exportGoogleDocsMutation = trpc.proposals.exportGoogleDocs.useMutation({
    onSuccess: (data) => {
      window.open(data.googleDocsViewerUrl, "_blank");
      toast.success("Opening in Google Docs viewer.");
    },
    onError: (e) => toast.error(e.message || "Failed to export to Google Docs."),
  });

  // AI revision mutation
  const refineMutation = trpc.proposals.refineProposal.useMutation({
    onSuccess: () => {
      setReviseMessages(prev => [...prev, {
        role: "assistant",
        content: "Done! I've updated the proposal. You can see the changes in the content panel. Export the updated documents when you're ready."
      }]);
      refetch();
    },
    onError: (e) => {
      setReviseMessages(prev => [...prev, {
        role: "assistant",
        content: `Sorry, I couldn't apply that change: ${e.message}`
      }]);
    },
  });

  // Redirect to login if not authenticated (useEffect avoids setState-during-render warning)
  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate(`/login?return=${encodeURIComponent(window.location.pathname)}`);
  }, [authLoading, isAuthenticated]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleReviseMessage = (message: string) => {
    if (!proposal) return;
    setReviseMessages(prev => [...prev, { role: "user", content: message }]);
    refineMutation.mutate({ id: proposal.id, message });
  };

  const handleDownloadPDF = () => {
    if (!proposal) return;

    // If a server-generated PDF already exists, download it directly
    if (proposal.pdfUrl) {
      const link = document.createElement("a");
      link.href = proposal.pdfUrl;
      link.download = `proposal-${proposal.id}.pdf`;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      toast.success("PDF downloaded!");
      return;
    }

    // No PDF yet — generate one server-side via Puppeteer
    exportPdfMutation.mutate({ id: proposal.id });
  };

  const handleDownloadWord = () => {
    if (!proposal) return;
    if (proposal.wordUrl) {
      const link = document.createElement("a");
      link.href = proposal.wordUrl;
      link.download = `proposal-${proposal.id}.docx`;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      toast.success("Word document downloaded!");
    } else {
      exportWordMutation.mutate({ id: proposal.id });
    }
  };

  const handleOpenGoogleDocs = () => {
    if (!proposal) return;
    if (proposal.googleDocUrl) {
      window.open(proposal.googleDocUrl, "_blank");
    } else {
      exportGoogleDocsMutation.mutate({ id: proposal.id });
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (authLoading || isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }
  if (!isAuthenticated) return null;
  if (proposalError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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

  return (
    <div className="min-h-screen bg-background">
      {/* Upgrade banner hidden during promotional period */}

      {/* Top bar */}
      <div className="border-b border-border bg-white px-4 py-3 flex items-center gap-3 sticky top-0 z-10 flex-wrap">
        <button onClick={() => navigate("/dashboard")} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-foreground truncate text-sm">{proposal.title}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${statusCfg.color}`}>
              <StatusIcon className="w-3 h-3" />
              {statusCfg.label}
            </span>
            {proposal.viewedAt && (
              <span className="text-xs text-muted-foreground">Viewed {new Date(proposal.viewedAt).toLocaleDateString()}</span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5">
          {!editing ? (
            <>
              {/* Primary: always visible */}
              <Button
                variant="default"
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={exportPdfMutation.isPending}
                onClick={handleDownloadPDF}
              >
                {exportPdfMutation.isPending ? (
                  <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> PDF...</>
                ) : (
                  <><FileDown className="w-3.5 h-3.5 mr-1" /> PDF</>
                )}
              </Button>

              <Button size="sm" onClick={() => { setSendEmail(proposal.clientEmail || ""); setSendName(proposal.clientName || ""); setSendOpen(true); }}>
                <Send className="w-3.5 h-3.5 mr-1" /> Send
              </Button>

              {/* Secondary: visible on md+, collapsed in dropdown on mobile */}
              <div className="hidden md:flex items-center gap-1.5">
                <Button variant="outline" size="sm" onClick={() => { setEditContent(proposal.generatedContent || ""); setEditing(true); }}>
                  <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
                </Button>
                {isPaidPlan ? (
                  <Button variant="outline" size="sm" className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100" onClick={() => setReviseOpen(true)}>
                    <MessageSquare className="w-3.5 h-3.5 mr-1" /> Revise
                  </Button>
                ) : null}
                {isPaidPlan ? (
                  <Button variant="outline" size="sm" disabled={exportWordMutation.isPending} onClick={handleDownloadWord}>
                    {exportWordMutation.isPending ? <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Word...</> : <><FileText className="w-3.5 h-3.5 mr-1" /> Word</>}
                  </Button>
                ) : null}
                {isPaidPlan ? (
                  <Button variant="outline" size="sm" disabled={exportGoogleDocsMutation.isPending} onClick={handleOpenGoogleDocs}>
                    {exportGoogleDocsMutation.isPending ? <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Docs...</> : <><Globe className="w-3.5 h-3.5 mr-1" /> Docs</>}
                  </Button>
                ) : null}
                <Button variant="outline" size="sm" onClick={() => shareLinkMutation.mutate({ id: proposal.id })} disabled={shareLinkMutation.isPending}>
                  <Share2 className="w-3.5 h-3.5 mr-1" /> Share
                </Button>
              </div>

              {/* Overflow dropdown — mobile only */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="md:hidden" aria-label="More actions">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem onClick={() => { setEditContent(proposal.generatedContent || ""); setEditing(true); }}>
                    <Edit2 className="w-3.5 h-3.5 mr-2" /> Edit
                  </DropdownMenuItem>
                  {isPaidPlan && (
                    <DropdownMenuItem onClick={() => setReviseOpen(true)}>
                      <MessageSquare className="w-3.5 h-3.5 mr-2" /> Revise with AI
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  {isPaidPlan && (
                    <DropdownMenuItem onClick={handleDownloadWord} disabled={exportWordMutation.isPending}>
                      <FileText className="w-3.5 h-3.5 mr-2" /> {exportWordMutation.isPending ? "Generating..." : "Word"}
                    </DropdownMenuItem>
                  )}
                  {isPaidPlan && (
                    <DropdownMenuItem onClick={handleOpenGoogleDocs} disabled={exportGoogleDocsMutation.isPending}>
                      <Globe className="w-3.5 h-3.5 mr-2" /> Google Docs
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => shareLinkMutation.mutate({ id: proposal.id })} disabled={shareLinkMutation.isPending}>
                    <Share2 className="w-3.5 h-3.5 mr-2" /> Share Link
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => setEditing(false)}><X className="w-3.5 h-3.5 mr-1" /> Cancel</Button>
              <Button size="sm" onClick={() => updateMutation.mutate({ id: proposal.id, generatedContent: editContent })} disabled={updateMutation.isPending}>
                <Save className="w-3.5 h-3.5 mr-1" /> Save
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* PDF generating banner */}
        {exportPdfMutation.isPending && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-900">Generating your professional PDF...</p>
              <p className="text-xs text-blue-700 mt-0.5">This may take a few seconds.</p>
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
                ) : proposal.generatedContent?.trimStart().startsWith("\\documentclass") ? (
                  // LaTeX-based proposals: show the compiled PDF in an embed
                  proposal.pdfUrl ? (
                    <div className="w-full" style={{ minHeight: "1100px" }}>
                      <object
                        data={proposal.pdfUrl + "#toolbar=1&navpanes=0"}
                        type="application/pdf"
                        className="w-full rounded"
                        style={{ height: "1100px" }}
                      >
                        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-3">
                          <p className="text-sm">PDF preview not available in this browser.</p>
                          <a href={proposal.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline text-sm">Open PDF directly</a>
                        </div>
                      </object>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-3">
                      <p className="text-sm">PDF not yet generated. Click \"Download PDF\" below to compile it.</p>
                    </div>
                  )
                ) : proposal.generatedContent?.trimStart().toLowerCase().startsWith("<!doctype") ? (
                  // HTML-based proposals: render in sandboxed iframe
                  <iframe
                    srcDoc={sanitizeProposalHtml(proposal.generatedContent || "")}
                    title="Proposal Preview"
                    className="w-full border-0 rounded"
                    style={{ minHeight: "1100px", height: "auto" }}
                    sandbox="allow-same-origin"
                    onLoad={(e) => {
                      const iframe = e.currentTarget;
                      const resizeIframe = () => {
                        try {
                          const doc = iframe.contentDocument || iframe.contentWindow?.document;
                          if (doc) {
                            const h = doc.documentElement.scrollHeight;
                            if (h > 100) iframe.style.height = h + "px";
                          }
                        } catch {}
                      };
                      resizeIframe();
                      // Re-measure after fonts/images finish loading
                      setTimeout(resizeIframe, 500);
                      setTimeout(resizeIframe, 1500);
                      setTimeout(resizeIframe, 3000);
                    }}
                  />
                ) : (
                  // Legacy markdown proposals
                  <div className="prose prose-sm max-w-none text-foreground">
                    <Streamdown>{proposal.generatedContent || "No content generated yet."}</Streamdown>
                  </div>
                )}
              </div>

              {/* Download section at bottom of content */}
              {!editing && (
                <div className="px-6 pb-6">
                  <div className="border-t border-border pt-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Download Documents</p>
                    <div className="flex flex-wrap gap-2">
                      {/* PDF — all users */}
                      <Button
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white"
                        disabled={exportPdfMutation.isPending}
                        onClick={handleDownloadPDF}
                      >
                        <FileDown className="w-3.5 h-3.5 mr-1.5" />
                        {exportPdfMutation.isPending ? "Generating..." : proposal.pdfUrl ? "Download PDF" : "Generate PDF"}
                      </Button>

                      {/* Word — Starter/Pro */}
                      {isPaidPlan ? (
                        <Button size="sm" variant="outline" disabled={exportWordMutation.isPending} onClick={handleDownloadWord}>
                          <FileText className="w-3.5 h-3.5 mr-1.5" />
                          {exportWordMutation.isPending ? "Generating..." : proposal.wordUrl ? "Download Word" : "Generate Word"}
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" className="text-muted-foreground border-dashed" onClick={() => navigate("/pricing")}>
                          <Lock className="w-3.5 h-3.5 mr-1.5" /> Word
                          <Badge variant="secondary" className="ml-1.5 text-xs">Starter+</Badge>
                        </Button>
                      )}

                      {/* Google Docs — Starter/Pro */}
                      {isPaidPlan ? (
                        <Button size="sm" variant="outline" disabled={exportGoogleDocsMutation.isPending} onClick={handleOpenGoogleDocs}>
                          <Globe className="w-3.5 h-3.5 mr-1.5" />
                          {exportGoogleDocsMutation.isPending ? "Opening..." : "Open in Google Docs"}
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" className="text-muted-foreground border-dashed" onClick={() => navigate("/pricing")}>
                          <Lock className="w-3.5 h-3.5 mr-1.5" /> Google Docs
                          <Badge variant="secondary" className="ml-1.5 text-xs">Starter+</Badge>
                        </Button>
                      )}

                      {/* Revise with AI — Starter/Pro */}
                      {isPaidPlan ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                          onClick={() => setReviseOpen(true)}
                        >
                          <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Revise with AI
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" className="text-muted-foreground border-dashed" onClick={() => navigate("/pricing")}>
                          <Lock className="w-3.5 h-3.5 mr-1.5" /> Revise with AI
                          <Badge variant="secondary" className="ml-1.5 text-xs">Starter+</Badge>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Job details */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold text-sm text-foreground mb-3">Job Details</h3>
              <div className="space-y-2 text-sm">
                <div><span className="text-muted-foreground">Trade:</span><span className="ml-2 text-foreground capitalize">{proposal.tradeType}</span></div>
                {proposal.clientAddress && (
                  <div><span className="text-muted-foreground">Address:</span><p className="text-foreground mt-0.5">{proposal.clientAddress}</p></div>
                )}
                {proposal.totalCost && (
                  <div><span className="text-muted-foreground">Total:</span><span className="ml-2 text-foreground font-semibold">${proposal.totalCost}</span></div>
                )}
                <div><span className="text-muted-foreground">Created:</span><span className="ml-2 text-foreground">{new Date(proposal.createdAt).toLocaleDateString()}</span></div>
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

            {/* Save as template */}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => saveTemplateMutation.mutate({
                proposalId: proposal.id,
                name: proposal.title,
                description: `Template from ${proposal.clientName || "proposal"} — ${proposal.tradeType}`,
              })}
              disabled={saveTemplateMutation.isPending}
            >
              <FileText className="w-4 h-4 mr-2" />
              {saveTemplateMutation.isPending ? "Saving..." : "Save as Template"}
            </Button>

            {/* Quick send */}
            {proposal.status === "draft" && (
              <Button className="w-full" onClick={() => { setSendEmail(proposal.clientEmail || ""); setSendName(proposal.clientName || ""); setSendOpen(true); }}>
                <Send className="w-4 h-4 mr-2" /> Send to Client
              </Button>
            )}

            {/* Follow-up */}
            {proposal.sentAt && !proposal.viewedAt && !proposal.followUpSentAt && (
              <Button variant="outline" className="w-full" onClick={() => followUpMutation.mutate({ id: proposal.id })} disabled={followUpMutation.isPending}>
                <Mail className="w-4 h-4 mr-2" /> {followUpMutation.isPending ? "Sending..." : "Send Follow-up"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Send Dialog */}
      <Dialog open={sendOpen} onOpenChange={setSendOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Send Proposal to Client</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm font-medium mb-2 block">Client Email <span className="text-destructive">*</span></Label>
              <SuggestInput type="email" placeholder="client@example.com" value={sendEmail} onChange={e => setSendEmail(e.target.value)} />
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Client Name</Label>
              <SuggestInput placeholder="John Smith" value={sendName} onChange={e => setSendName(e.target.value)} />
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Personal Message (optional)</Label>
              <SuggestTextarea placeholder="Thank you for considering us..." value={sendMessage} onChange={e => setSendMessage(e.target.value)} rows={3} className="resize-none" />
            </div>
            <p className="text-xs text-muted-foreground">A read receipt will be added so you know when the client opens your proposal.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sendEmail.trim())) {
                toast.error("Please enter a valid email address");
                return;
              }
              sendMutation.mutate({ id: proposal.id, clientEmail: sendEmail.trim(), clientName: sendName || undefined, message: sendMessage || undefined });
            }} disabled={sendMutation.isPending || !sendEmail.trim()}>
              {sendMutation.isPending ? "Sending..." : <><Send className="w-4 h-4 mr-1" /> Send Proposal</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revise with AI — Starter/Pro only */}
      <Sheet open={reviseOpen} onOpenChange={setReviseOpen}>
        <SheetContent side="right" className="w-[420px] sm:max-w-[420px] flex flex-col p-0">
          <SheetHeader className="px-5 py-4 border-b border-border flex-shrink-0">
            <SheetTitle className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-600" />
              Revise with AI
            </SheetTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Describe any changes you'd like. ProposAI will update the proposal and regenerate your documents.
            </p>
          </SheetHeader>
          <div className="flex-1 min-h-0">
            <AIChatBox
              messages={reviseMessages}
              onSendMessage={handleReviseMessage}
              isLoading={refineMutation.isPending}
              placeholder="e.g. Make the payment terms net-30..."
              height="100%"
              suggestedPrompts={[
                "Make the scope of work more detailed",
                "Change payment terms to net-30",
                "Make the tone more formal",
                "Add a warranty section",
                "Include a materials breakdown table",
              ]}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
