import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { PendingProposalsWidget } from "@/components/PendingProposalsWidget";
import { ResponseAnalyticsWidget } from "@/components/ResponseAnalyticsWidget";
import { FeedbackAnalyticsWidget } from "@/components/FeedbackAnalyticsWidget";
import { RecommendationsWidget } from "@/components/RecommendationsWidget";
import {
  FileText, Plus, Eye, Send, Trash2, Clock,
  CheckCircle, AlertCircle, Mail, BarChart3,
  Settings, LogOut, Home, Zap, Download, Upload
} from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { OnboardingModal } from "@/components/OnboardingModal";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const STATUS_CONFIG = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-700", icon: Clock },
  sent: { label: "Sent", color: "bg-blue-100 text-blue-700", icon: Mail },
  viewed: { label: "Viewed", color: "bg-green-100 text-green-700", icon: Eye },
  accepted: { label: "Accepted", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
  declined: { label: "Declined", color: "bg-red-100 text-red-700", icon: AlertCircle },
};

const TRADE_LABELS: Record<string, string> = {
  hvac: "HVAC", plumbing: "Plumbing", electrical: "Electrical",
  roofing: "Roofing", general: "General", painting: "Painting",
  flooring: "Flooring", landscaping: "Landscaping", carpentry: "Carpentry",
  concrete: "Concrete", masonry: "Masonry", insulation: "Insulation",
  drywall: "Drywall", windows: "Windows & Doors", solar: "Solar",
};

export default function Dashboard() {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const { data: proposals, isLoading, refetch } = trpc.proposals.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: subscription } = trpc.subscription.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: profile } = trpc.profile.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Show onboarding modal if user hasn't completed it
  useEffect(() => {
    if (profile && !profile.onboardingCompleted) {
      setShowOnboarding(true);
    }
  }, [profile]);
  const deleteMutation = trpc.proposals.delete.useMutation({
    onSuccess: () => { toast.success("Proposal deleted"); refetch(); setDeleteId(null); },
    onError: (e) => toast.error(e.message),
  });
  const updateProfileMutation = trpc.profile.update.useMutation();
  const exportQuery = trpc.export.bulkExportProposals.useQuery(undefined, { enabled: false });

  const handleOnboardingClose = async () => {
    setShowOnboarding(false);
    // Mark onboarding as completed
    try {
      await updateProfileMutation.mutateAsync({
        onboardingCompleted: true,
      });
    } catch (err) {
      console.error("Failed to mark onboarding as completed", err);
    }
  };

  const handleBulkExport = async () => {
    try {
      toast.loading("Exporting proposals...");
      const result = await exportQuery.refetch();
      if (result.data) {
        const link = document.createElement("a");
        link.href = `data:application/zip;base64,${result.data.data}`;
        link.download = result.data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Proposals exported successfully");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  const plan = subscription?.plan || "free";
  const used = subscription?.proposalsUsedThisMonth || 0;
  const limit = subscription?.limit;
  const remaining = subscription?.remaining;

  const planColors = { free: "bg-gray-100 text-gray-700", starter: "bg-blue-100 text-blue-700", pro: "bg-primary/10 text-primary" };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col fixed inset-y-0 left-0 z-40">
        <div className="p-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sidebar-foreground">ProposAI</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-sidebar-accent text-sidebar-accent-foreground text-sm font-medium"
          >
            <BarChart3 className="w-4 h-4" /> Dashboard
          </button>
          <button
            onClick={() => navigate("/proposals/new")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> New Proposal
          </button>
          <button
            onClick={() => navigate("/import")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sm transition-colors"
          >
            <Upload className="w-4 h-4" /> Import Proposals
          </button>
          <button
            onClick={() => navigate("/settings")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sm transition-colors"
          >
            <Settings className="w-4 h-4" /> Settings
          </button>
          <button
            onClick={() => navigate("/")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sm transition-colors"
          >
            <Home className="w-4 h-4" /> Home
          </button>
        </nav>

        {/* Subscription status */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="bg-sidebar-accent rounded-lg p-3 mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-sidebar-foreground/70 uppercase tracking-wide">Plan</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${planColors[plan as keyof typeof planColors]}`}>
                {plan}
              </span>
            </div>
            {limit !== null && limit !== undefined ? (
              <>
                <div className="text-xs text-sidebar-foreground/70 mb-1">{used} / {limit} proposals this month</div>
                <div className="h-1.5 bg-sidebar-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${Math.min(100, (used / limit) * 100)}%` }}
                  />
                </div>
              </>
            ) : (
              <div className="text-xs text-sidebar-foreground/70">Unlimited proposals</div>
            )}
            {plan !== "pro" && (
              <button
                onClick={() => navigate("/pricing")}
                className="mt-2 w-full text-xs text-primary font-medium hover:underline text-left"
              >
                Upgrade plan &rarr;
              </button>
            )}
          </div>
          {/* Current AI model & language indicator */}
          <button
            onClick={() => navigate("/settings")}
            className="w-full bg-sidebar-accent rounded-lg p-3 mb-3 text-left hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-sidebar-foreground/70 uppercase tracking-wide">AI Model</span>
              <span className="text-xs text-primary font-medium">Change &rarr;</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm">
                {(() => {
                  const m = profile?.preferredModel || "gemini-2.5-flash";
                  if (m.includes("deepseek")) return "🇨🇳";
                  if (m.includes("gpt") || m.includes("o4") || m.includes("o3")) return "🇺🇸";
                  if (m.includes("claude")) return "🇺🇸";
                  if (m.includes("qwen")) return "🇨🇳";
                  return "🌐";
                })()}
              </span>
              <span className="text-xs font-medium text-sidebar-foreground truncate">
                {(() => {
                  const m = profile?.preferredModel || "gemini-2.5-flash";
                  if (m === "gemini-2.5-flash") return "Gemini 2.5 Flash";
                  if (m === "deepseek-v3") return "DeepSeek V3";
                  if (m === "deepseek-r1") return "DeepSeek R1";
                  if (m === "gpt-4o") return "GPT-4o";
                  if (m === "gpt-4o-mini") return "GPT-4o Mini";
                  if (m === "claude-3-7-sonnet-20250219") return "Claude 3.7 Sonnet";
                  if (m === "qwen-max") return "Qwen Max";
                  return m;
                })()}
              </span>
            </div>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary/20 rounded-full flex items-center justify-center text-xs font-bold text-primary">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-sidebar-foreground truncate">{user?.name || "Contractor"}</p>
            </div>
            <button onClick={logout} className="text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Welcome back, {user?.name?.split(" ")[0] || "Contractor"}
            </p>
          </div>
          <div className="flex gap-2">
            {proposals && proposals.length > 0 && (
              <Button onClick={handleBulkExport} variant="outline" className="gap-2">
                <Download className="w-4 h-4" /> Export All
              </Button>
            )}
            <Button onClick={() => navigate("/templates/pick")} variant="outline" className="gap-2">
              <FileText className="w-4 h-4" /> From Template
            </Button>
            <Button onClick={() => navigate("/proposals/new")} className="gap-2">
              <Plus className="w-4 h-4" /> New Proposal
            </Button>
          </div>
        </div>

        {/* Empty State Banner for New Users */}
        {proposals?.length === 0 && !isLoading && (
          <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Upload className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-blue-900 mb-1">Have past proposals? Import them!</h3>
                <p className="text-sm text-blue-800 mb-3">
                  Upload your previous proposals (PDF, Word, or text files) and our AI will extract client info, pricing, and scope to create reusable templates.
                </p>
                <Button onClick={() => navigate("/import")} size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <Upload className="w-4 h-4 mr-2" /> Import Proposals Now
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Pending Proposals Widget */}
        {proposals && proposals.length > 0 && (
          <div className="mb-8">
            <PendingProposalsWidget />
          </div>
        )}

        {/* Response Analytics */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">Proposal Performance</h2>
          <ResponseAnalyticsWidget />
        </div>

        {/* Feedback Analytics */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">Client Feedback</h2>
          <FeedbackAnalyticsWidget />
        </div>

        {/* Recommendations */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">Improvement Recommendations</h2>
          <RecommendationsWidget />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="text-sm text-muted-foreground mb-1">Total Proposals</p>
            <p className="text-3xl font-bold text-foreground">{proposals?.length || 0}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="text-sm text-muted-foreground mb-1">Sent This Month</p>
            <p className="text-3xl font-bold text-foreground">
              {proposals?.filter(p => p.status !== "draft").length || 0}
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="text-sm text-muted-foreground mb-1">Viewed by Clients</p>
            <p className="text-3xl font-bold text-primary">
              {proposals?.filter(p => p.status === "viewed" || p.status === "accepted").length || 0}
            </p>
          </div>
        </div>

        {/* Proposals Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-foreground">All Proposals</h2>
            <span className="text-sm text-muted-foreground">{proposals?.length || 0} total</span>
          </div>

          {isLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
            </div>
          ) : proposals?.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-7 h-7 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">No proposals yet</h3>
              <p className="text-muted-foreground text-sm mb-6">Get started in two ways:</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => navigate("/templates/pick")} size="sm">
                  <FileText className="w-4 h-4 mr-1" /> Start from Template
                </Button>
                <Button onClick={() => navigate("/proposals/new")} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-1" /> Create with AI
                </Button>
                <Button onClick={() => navigate("/import")} variant="outline" size="sm">
                  <Upload className="w-4 h-4 mr-1" /> Import Past Proposals
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Proposal</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Trade</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Client</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Status</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">Date</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {proposals?.map((p) => {
                    const statusCfg = STATUS_CONFIG[p.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.draft;
                    const StatusIcon = statusCfg.icon;
                    return (
                      <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="font-medium text-sm text-foreground truncate max-w-[200px]">{p.title}</p>
                          {p.totalCost && <p className="text-xs text-muted-foreground">${p.totalCost}</p>}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-xs text-muted-foreground">{TRADE_LABELS[p.tradeType] || p.tradeType}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-sm text-foreground">{p.clientName || "-"}</span>
                          {p.clientEmail && <p className="text-xs text-muted-foreground">{p.clientEmail}</p>}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${statusCfg.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusCfg.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-xs text-muted-foreground">
                            {new Date(p.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost" size="icon"
                              className="h-7 w-7"
                              onClick={() => navigate(`/proposals/${p.id}`)}
                              title="View"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost" size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => setDeleteId(p.id)}
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Delete confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Proposal?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. The proposal will be permanently deleted.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <OnboardingModal isOpen={showOnboarding} onClose={handleOnboardingClose} />
    </div>
  );
}
