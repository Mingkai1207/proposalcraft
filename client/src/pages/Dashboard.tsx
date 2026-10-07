import { useAuth } from "@/_core/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { PendingProposalsWidget } from "@/components/PendingProposalsWidget";
import { ResponseAnalyticsWidget } from "@/components/ResponseAnalyticsWidget";
import { FeedbackAnalyticsWidget } from "@/components/FeedbackAnalyticsWidget";
import { RecommendationsWidget } from "@/components/RecommendationsWidget";
import {
  FileText,
  Plus,
  Eye,
  Trash2,
  Clock,
  CheckCircle,
  AlertCircle,
  Mail,
  Download,
  Upload,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import React from "react";
import { OnboardingModal } from "@/components/OnboardingModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-stone-100 text-stone-600",
  sent: "bg-amber-50 text-amber-700 border border-border",
  viewed: "bg-orange-50 text-orange-700 border border-orange-200",
  accepted: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  declined: "bg-rose-50 text-rose-600 border border-rose-200",
};
const STATUS_ICONS: Record<string, React.ElementType> = {
  draft: Clock,
  sent: Mail,
  viewed: Eye,
  accepted: CheckCircle,
  declined: AlertCircle,
};

const TRADE_LABELS: Record<string, string> = {
  hvac: "HVAC",
  plumbing: "Plumbing",
  electrical: "Electrical",
  roofing: "Roofing",
  general: "General",
  painting: "Painting",
  flooring: "Flooring",
  landscaping: "Landscaping",
  carpentry: "Carpentry",
  concrete: "Concrete",
  masonry: "Masonry",
  insulation: "Insulation",
  drywall: "Drywall",
  windows: "Windows & Doors",
  solar: "Solar",
};

export default function Dashboard() {
  const { t } = useTranslation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: proposals,
    isLoading,
    isError: proposalsError,
    refetch,
  } = trpc.proposals.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: profile } = trpc.profile.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Redirect to login if not authenticated (useEffect avoids setState-during-render warning)
  useEffect(() => {
    if (!authLoading && !isAuthenticated)
      navigate(`/login?return=${encodeURIComponent(window.location.pathname)}`);
  }, [authLoading, isAuthenticated]);

  // Show onboarding modal if user hasn't completed it
  useEffect(() => {
    if (profile && !profile.onboardingCompleted) {
      setShowOnboarding(true);
    }
  }, [profile]);
  const deleteMutation = trpc.proposals.delete.useMutation({
    onSuccess: () => {
      toast.success(t("common.deleted"));
      refetch();
      setDeleteId(null);
    },
    onError: e => toast.error(e.message),
  });
  const updateProfileMutation = trpc.profile.update.useMutation();
  const exportQuery = trpc.export.bulkExportProposals.useQuery(undefined, {
    enabled: false,
  });

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
    const loadingId = toast.loading(t("common.loading"));
    try {
      const result = await exportQuery.refetch();
      toast.dismiss(loadingId);
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
      toast.dismiss(loadingId);
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

  if (!isAuthenticated) return null;

  return (
    <div className="dashboard-page">
      <div className="p-4 md:p-8">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-stone-900 tracking-tight">
              {t("dashboard.title")}
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {t("dashboard.welcomeBack", {
                name: user?.name?.split(" ")[0] || t("common.contractor"),
              })}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {proposals && proposals.length > 0 && (
              <button
                onClick={handleBulkExport}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-sm font-medium transition-colors"
              >
                <Download className="w-4 h-4" /> {t("dashboard.exportAll")}
              </button>
            )}
            <button
              onClick={() => navigate("/templates")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-sm font-medium transition-colors"
            >
              <FileText className="w-4 h-4" /> {t("dashboard.myTemplates")}
            </button>
            <button
              onClick={() => navigate("/proposals/new")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary hover:bg-primary/90 text-white text-sm font-bold transition-all  "
            >
              <Plus className="w-4 h-4" /> {t("dashboard.newProposal")}
            </button>
          </div>
        </div>

        {proposals && proposals.length > 0 && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {[
                {
                  label: t("dashboard.totalProposals"),
                  value: proposals?.length || 0,
                  accent: "border-l-primary",
                },
                {
                  label: t("dashboard.sentThisMonth"),
                  value:
                    proposals?.filter(p => {
                      if (!p.sentAt) return false;
                      const s = new Date(p.sentAt),
                        n = new Date();
                      return (
                        s.getFullYear() === n.getFullYear() &&
                        s.getMonth() === n.getMonth()
                      );
                    }).length || 0,
                  accent: "border-l-primary",
                },
                {
                  label: t("dashboard.viewedByClients"),
                  value:
                    proposals?.filter(
                      p => p.status === "viewed" || p.status === "accepted"
                    ).length || 0,
                  accent: "border-l-primary",
                  highlight: true,
                },
              ].map(({ label, value, accent, highlight }) => (
                <div
                  key={label}
                  className={`bg-white border border-stone-100 rounded-lg p-5 border-l-4 ${accent} shadow-none`}
                >
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    {label}
                  </p>
                  <p
                    className={`text-4xl font-semibold tracking-tight ${highlight ? "text-primary" : "text-stone-900"}`}
                  >
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
        {/* Proposals Table */}
        <div className="bg-white border border-stone-100 rounded-lg overflow-hidden shadow-none">
          <div className="px-6 py-4 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center justify-between flex-1">
              <h2 className="font-bold text-stone-900">
                {t("dashboard.allProposals")}
              </h2>
              <span className="text-sm text-muted-foreground">
                {proposals?.length || 0} {t("dashboard.total")}
              </span>
            </div>
            {proposals && proposals.length > 5 && (
              <div className="relative sm:w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  aria-label="Search proposals"
                  placeholder="Search proposals..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-md border border-stone-200 text-sm text-stone-800 placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
            </div>
          ) : proposalsError ? (
            <div className="p-12 text-center">
              <p className="text-rose-500 text-sm mb-3">
                Failed to load proposals.
              </p>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 rounded-md border border-stone-200 text-stone-700 text-sm font-medium hover:bg-stone-50 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : proposals?.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-14 h-14 bg-stone-50 border border-stone-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FileText className="w-7 h-7 text-stone-300" />
              </div>
              <h3 className="font-bold text-stone-900 mb-1">
                {t("dashboard.noProposals")}
              </h3>
              <p className="text-muted-foreground text-sm mb-6">
                {t("dashboard.getStarted")}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => navigate("/templates")}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-stone-900 hover:bg-stone-800 text-white text-sm font-semibold transition-colors"
                >
                  <FileText className="w-4 h-4" /> {t("dashboard.myTemplates")}
                </button>
                <button
                  onClick={() => navigate("/proposals/new")}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md border border-stone-200 hover:bg-stone-50 text-stone-700 text-sm font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" /> {t("dashboard.createWithAI")}
                </button>
                <button
                  onClick={() => navigate("/import")}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md border border-stone-200 hover:bg-stone-50 text-stone-700 text-sm font-medium transition-colors"
                >
                  <Upload className="w-4 h-4" /> {t("dashboard.importPast")}
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50/60">
                    <th className="text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-6 py-3">
                      {t("dashboard.colProposal")}
                    </th>
                    <th className="text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-5 py-3">
                      {t("dashboard.colTrade")}
                    </th>
                    <th className="text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-5 py-3">
                      {t("dashboard.colClient")}
                    </th>
                    <th className="text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-5 py-3">
                      {t("dashboard.colStatus")}
                    </th>
                    <th className="text-left text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-5 py-3">
                      {t("dashboard.colDate")}
                    </th>
                    <th className="text-right text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-5 py-3">
                      {t("dashboard.colActions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {proposals
                    ?.filter(p => {
                      if (!searchQuery.trim()) return true;
                      const q = searchQuery.toLowerCase();
                      return (
                        p.title.toLowerCase().includes(q) ||
                        (p.clientName?.toLowerCase() || "").includes(q) ||
                        (p.clientEmail?.toLowerCase() || "").includes(q) ||
                        p.tradeType.toLowerCase().includes(q)
                      );
                    })
                    .map(p => {
                      const statusColor =
                        STATUS_COLORS[p.status] || STATUS_COLORS.draft;
                      const StatusIcon =
                        STATUS_ICONS[p.status] || STATUS_ICONS.draft;
                      const statusLabel =
                        t(
                          `dashboard.status${p.status.charAt(0).toUpperCase() + p.status.slice(1)}` as any
                        ) || p.status;
                      return (
                        <tr
                          key={p.id}
                          className="border-b border-stone-100 last:border-0 hover:bg-stone-50/60 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <p className="font-semibold text-sm text-stone-900 truncate max-w-[200px]">
                              {p.title}
                            </p>
                            {p.totalCost && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                ${p.totalCost}
                              </p>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-xs text-muted-foreground font-medium">
                              {TRADE_LABELS[p.tradeType] || p.tradeType}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-sm text-stone-700">
                              {p.clientName || "-"}
                            </span>
                            {p.clientEmail && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {p.clientEmail}
                              </p>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor}`}
                            >
                              <StatusIcon className="w-3 h-3" />
                              {statusLabel}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-xs text-muted-foreground">
                              {new Date(p.createdAt).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => navigate(`/proposals/${p.id}`)}
                                title="View"
                                aria-label={`View proposal: ${p.title}`}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-stone-700 hover:bg-stone-100 transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteId(p.id)}
                                title="Delete"
                                aria-label={`Delete proposal: ${p.title}`}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-rose-500 hover:bg-rose-50 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
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
        <div className="dashboard-insights mt-10 border-t border-border pt-8">
          {/* Pending Proposals Widget */}
          {proposals && proposals.length > 0 && (
            <div className="mb-8">
              <PendingProposalsWidget />
            </div>
          )}

          {proposals && proposals.length > 0 && (
            <>
              {/* Response Analytics */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-stone-900 tracking-tight mb-4">
                  {t("dashboard.proposalPerformance")}
                </h2>
                <ResponseAnalyticsWidget />
              </div>

              {/* Feedback Analytics */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-stone-900 tracking-tight mb-4">
                  {t("dashboard.clientFeedback")}
                </h2>
                <FeedbackAnalyticsWidget />
              </div>

              {/* Recommendations */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-stone-900 tracking-tight mb-4">
                  {t("dashboard.improvementRecs")}
                </h2>
                <RecommendationsWidget />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete confirmation */}
      <AlertDialog
        open={deleteId !== null}
        onOpenChange={open => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dashboard.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dashboard.deleteDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() =>
                deleteId && deleteMutation.mutate({ id: deleteId })
              }
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <OnboardingModal
        isOpen={showOnboarding}
        onClose={handleOnboardingClose}
      />
    </div>
  );
}
