import { useAuth } from "@/_core/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { PendingProposalsWidget } from "@/components/PendingProposalsWidget";
import { ResponseAnalyticsWidget } from "@/components/ResponseAnalyticsWidget";
import { FeedbackAnalyticsWidget } from "@/components/FeedbackAnalyticsWidget";
import { RecommendationsWidget } from "@/components/RecommendationsWidget";
import {
  FileText, Plus, Eye, Send, Trash2, Clock,
  CheckCircle, AlertCircle, Mail, BarChart3,
  Settings, LogOut, Home, Zap, Download, Upload, Menu
} from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import React from "react";
import { OnboardingModal } from "@/components/OnboardingModal";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  sent: "bg-blue-100 text-blue-700",
  viewed: "bg-green-100 text-green-700",
  accepted: "bg-emerald-100 text-emerald-700",
  declined: "bg-red-100 text-red-700",
};
const STATUS_ICONS: Record<string, React.ElementType> = {
  draft: Clock,
  sent: Mail,
  viewed: Eye,
  accepted: CheckCircle,
  declined: AlertCircle,
};

const TRADE_LABELS: Record<string, string> = {
  hvac: "HVAC", plumbing: "Plumbing", electrical: "Electrical",
  roofing: "Roofing", general: "General", painting: "Painting",
  flooring: "Flooring", landscaping: "Landscaping", carpentry: "Carpentry",
  concrete: "Concrete", masonry: "Masonry", insulation: "Insulation",
  drywall: "Drywall", windows: "Windows & Doors", solar: "Solar",
};

export default function Dashboard() {
  const { t } = useTranslation();
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    onSuccess: () => { toast.success(t("common.deleted")); refetch(); setDeleteId(null); },
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
      toast.loading(t("common.loading"));
      const result = await exportQuery.refetch();
      if (result.data) {
        const link = document.createElement("a");
        link.href = `data:application/zip;base64,${result.data.data}`;
        link.download = result.data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(t("common.success"));
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
    navigate("/login");
    return null;
  }

  const plan = subscription?.plan || "free";
  const used = subscription?.proposalsUsedThisMonth || 0;
  const limit = subscription?.limit;
  const remaining = subscription?.remaining;

  const planColors = { free: "bg-gray-100 text-gray-700", starter: "bg-blue-100 text-blue-700", pro: "bg-primary/10 text-primary" };

  const sidebarContent = (
    <>
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
          onClick={() => { navigate("/dashboard"); setSidebarOpen(false); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-sidebar-accent text-sidebar-accent-foreground text-sm font-medium"
        >
          <BarChart3 className="w-4 h-4" /> {t("dashboard.title")}
        </button>
        <button
          onClick={() => { navigate("/proposals/new"); setSidebarOpen(false); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> {t("dashboard.newProposal")}
        </button>
        <button
          onClick={() => { navigate("/import"); setSidebarOpen(false); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sm transition-colors"
        >
          <Upload className="w-4 h-4" /> {t("dashboard.importProposals")}
        </button>
        <button
          onClick={() => { navigate("/settings"); setSidebarOpen(false); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sm transition-colors"
        >
          <Settings className="w-4 h-4" /> {t("dashboard.settings")}
        </button>
        <button
          onClick={() => { navigate("/"); setSidebarOpen(false); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sm transition-colors"
        >
          <Home className="w-4 h-4" /> {t("dashboard.home")}
        </button>
      </nav>

      {/* Subscription status */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="bg-sidebar-accent rounded-lg p-3 mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-sidebar-foreground/70 uppercase tracking-wide">{t("dashboard.plan")}</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${planColors[plan as keyof typeof planColors]}`}>
              {plan}
            </span>
          </div>
          {limit !== null && limit !== undefined ? (
            <>
              <div className="text-xs text-sidebar-foreground/70 mb-1">{t("dashboard.proposalsThisMonth", { used, limit })}</div>
              <div className="h-1.5 bg-sidebar-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${Math.min(100, (used / limit) * 100)}%` }}
                />
              </div>
            </>
          ) : (
            <div className="text-xs text-sidebar-foreground/70">{t("dashboard.unlimitedProposals")}</div>
          )}
        </div>
        {/* Current AI model & language indicator */}
        <button
          onClick={() => { navigate("/settings"); setSidebarOpen(false); }}
          className="w-full bg-sidebar-accent rounded-lg p-3 mb-3 text-left hover:opacity-80 transition-opacity"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-sidebar-foreground/70 uppercase tracking-wide">{t("dashboard.aiModel")}</span>
            <span className="text-xs text-primary font-medium">{t("dashboard.changeSetting")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm">🇺🇸</span>
            <span className="text-xs font-medium text-sidebar-foreground truncate">
              {profile?.preferredModel === "claude-opus-4-6" ? "Claude Opus 4.6" : "Claude Sonnet 4.6"}
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
          <button onClick={logout} aria-label="Sign out" className="text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-sidebar text-sidebar-foreground flex-col fixed inset-y-0 left-0 z-40">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0 bg-sidebar text-sidebar-foreground border-sidebar-border">
          {sidebarContent}
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <main className="flex-1 md:ml-64">
        {/* Mobile header */}
        <div className="md:hidden sticky top-0 z-30 flex items-center justify-between h-14 px-4 bg-background border-b border-border">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-accent transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <FileText className="w-3 h-3 text-white" />
            </div>
            <span className="font-bold text-sm">ProposAI</span>
          </div>
          <Button size="sm" onClick={() => navigate("/proposals/new")} className="h-8 px-3 text-xs gap-1">
            <Plus className="w-3 h-3" /> New
          </Button>
        </div>
        <div className="p-4 md:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t("dashboard.title")}</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {t("dashboard.welcomeBack", { name: user?.name?.split(" ")[0] || t("common.contractor") })}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {proposals && proposals.length > 0 && (
              <Button onClick={handleBulkExport} variant="outline" size="sm" className="gap-2">
                <Download className="w-4 h-4" /> {t("dashboard.exportAll")}
              </Button>
            )}
            <Button onClick={() => navigate("/templates")} variant="outline" size="sm" className="gap-2">
              <FileText className="w-4 h-4" /> {t("dashboard.myTemplates")}
            </Button>
            <Button onClick={() => navigate("/proposals/new")} size="sm" className="gap-2">
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
                <h3 className="font-semibold text-blue-900 mb-1">{t("dashboard.importBannerTitle")}</h3>
                <p className="text-sm text-blue-800 mb-3">
                  {t("dashboard.importBannerDesc")}
                </p>
                <Button onClick={() => navigate("/import")} size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <Upload className="w-4 h-4 mr-2" /> {t("dashboard.importNow")}
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
          <h2 className="text-lg font-semibold text-foreground mb-4">{t("dashboard.proposalPerformance")}</h2>
          <ResponseAnalyticsWidget />
        </div>

        {/* Feedback Analytics */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">{t("dashboard.clientFeedback")}</h2>
          <FeedbackAnalyticsWidget />
        </div>

        {/* Recommendations */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">{t("dashboard.improvementRecs")}</h2>
          <RecommendationsWidget />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="text-sm text-muted-foreground mb-1">{t("dashboard.totalProposals")}</p>
            <p className="text-3xl font-bold text-foreground">{proposals?.length || 0}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="text-sm text-muted-foreground mb-1">{t("dashboard.sentThisMonth")}</p>
            <p className="text-3xl font-bold text-foreground">
              {proposals?.filter(p => p.status !== "draft").length || 0}
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="text-sm text-muted-foreground mb-1">{t("dashboard.viewedByClients")}</p>
            <p className="text-3xl font-bold text-primary">
              {proposals?.filter(p => p.status === "viewed" || p.status === "accepted").length || 0}
            </p>
          </div>
        </div>

        {/* Proposals Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-foreground">{t("dashboard.allProposals")}</h2>
            <span className="text-sm text-muted-foreground">{proposals?.length || 0} {t("dashboard.total")}</span>
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
              <h3 className="font-semibold text-foreground mb-1">{t("dashboard.noProposals")}</h3>
              <p className="text-muted-foreground text-sm mb-6">{t("dashboard.getStarted")}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => navigate("/templates")} size="sm">
                  <FileText className="w-4 h-4 mr-1" /> {t("dashboard.myTemplates")}
                </Button>
                <Button onClick={() => navigate("/proposals/new")} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-1" /> {t("dashboard.createWithAI")}
                </Button>
                <Button onClick={() => navigate("/import")} variant="outline" size="sm">
                  <Upload className="w-4 h-4 mr-1" /> {t("dashboard.importPast")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">{t("dashboard.colProposal")}</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">{t("dashboard.colTrade")}</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">{t("dashboard.colClient")}</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">{t("dashboard.colStatus")}</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-5 py-3">{t("dashboard.colDate")}</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-5 py-3">{t("dashboard.colActions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {proposals?.map((p) => {
                    const statusColor = STATUS_COLORS[p.status] || STATUS_COLORS.draft;
                    const StatusIcon = STATUS_ICONS[p.status] || STATUS_ICONS.draft;
                    const statusLabel = t(`dashboard.status${p.status.charAt(0).toUpperCase() + p.status.slice(1)}` as any) || p.status;
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
                          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${statusColor}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusLabel}
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
                              aria-label={`View proposal: ${p.title}`}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost" size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => setDeleteId(p.id)}
                              title="Delete"
                              aria-label={`Delete proposal: ${p.title}`}
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
        </div>
      </main>

      {/* Delete confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dashboard.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("dashboard.deleteDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <OnboardingModal isOpen={showOnboarding} onClose={handleOnboardingClose} />
    </div>
  );
}
