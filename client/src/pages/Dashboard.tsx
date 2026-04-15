import { useAuth } from "@/_core/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { PendingProposalsWidget } from "@/components/PendingProposalsWidget";
import { ResponseAnalyticsWidget } from "@/components/ResponseAnalyticsWidget";
import { FeedbackAnalyticsWidget } from "@/components/FeedbackAnalyticsWidget";
import { RecommendationsWidget } from "@/components/RecommendationsWidget";
import {
  FileText, Plus, Eye, Send, Trash2, Clock,
  CheckCircle, AlertCircle, Mail, BarChart3,
  Settings, LogOut, Home, Zap, Download, Upload, Menu, Search
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
  draft: "bg-stone-100 text-stone-600",
  sent: "bg-amber-50 text-amber-700 border border-amber-200",
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
  const [searchQuery, setSearchQuery] = useState("");

  const { data: proposals, isLoading, isError: proposalsError, refetch } = trpc.proposals.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: subscription } = trpc.subscription.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: profile } = trpc.profile.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Redirect to login if not authenticated (useEffect avoids setState-during-render warning)
  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate(`/login?return=${encodeURIComponent(window.location.pathname)}`);
  }, [authLoading, isAuthenticated]);

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
      <div className="min-h-screen flex items-center justify-center bg-[#faf7f2]">
        <div className="animate-spin w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const plan = subscription?.plan || "free";
  const used = subscription?.proposalsUsedThisMonth || 0;
  const limit = subscription?.limit;
  const remaining = subscription?.remaining;

  const planColors = {
    free: "bg-stone-700 text-stone-300",
    starter: "bg-amber-500/20 text-amber-400",
    pro: "bg-orange-500/20 text-orange-400",
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="p-5 border-b border-stone-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shadow-orange-500/20">
            <span className="text-white font-black text-base">P</span>
          </div>
          <span className="font-bold text-white text-lg tracking-tight">ProposAI</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-0.5">
        {[
          { label: t("dashboard.title"), icon: BarChart3, path: "/dashboard", active: true },
          { label: t("dashboard.newProposal"), icon: Plus, path: "/proposals/new" },
          { label: t("dashboard.myTemplates"), icon: FileText, path: "/templates" },
          { label: t("dashboard.importProposals"), icon: Upload, path: "/import" },
          { label: t("dashboard.settings"), icon: Settings, path: "/settings" },
          { label: t("dashboard.home"), icon: Home, path: "/" },
        ].map(({ label, icon: Icon, path, active }) => (
          <button
            key={path}
            onClick={() => { navigate(path); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              active
                ? "bg-orange-500/15 text-orange-400"
                : "text-stone-400 hover:bg-stone-800 hover:text-stone-200"
            }`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" /> {label}
          </button>
        ))}
      </nav>

      {/* Subscription + user */}
      <div className="p-4 border-t border-stone-800 space-y-3">
        {/* Plan usage */}
        <div className="bg-stone-800 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-stone-400 uppercase tracking-wider font-semibold">{t("dashboard.plan")}</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${planColors[plan as keyof typeof planColors]}`}>
              {plan}
            </span>
          </div>
          {limit !== null && limit !== undefined ? (
            <>
              <div className="text-xs text-stone-400 mb-2">{t("dashboard.proposalsThisMonth", { used, limit })}</div>
              <div className="h-1.5 bg-stone-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (used / limit) * 100)}%` }}
                />
              </div>
            </>
          ) : (
            <div className="text-xs text-stone-400">{t("dashboard.unlimitedProposals")}</div>
          )}
        </div>

        {/* AI model */}
        <button
          onClick={() => { navigate("/settings"); setSidebarOpen(false); }}
          className="w-full bg-stone-800 rounded-xl p-3 text-left hover:bg-stone-700/80 transition-colors"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-stone-400 uppercase tracking-wider font-semibold">{t("dashboard.aiModel")}</span>
            <span className="text-xs text-orange-400 font-medium">{t("dashboard.changeSetting")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm">🇺🇸</span>
            <span className="text-xs font-medium text-stone-300 truncate">
              {profile?.preferredModel === "claude-opus-4-6" ? "Advanced Model" : "Standard Model"}
            </span>
          </div>
        </button>

        {/* User */}
        <div className="flex items-center gap-2.5 px-1">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-sm font-black text-white flex-shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-stone-200 truncate">{user?.name || "Contractor"}</p>
            <p className="text-[10px] text-stone-500 truncate">{user?.email || ""}</p>
          </div>
          <button onClick={logout} aria-label="Sign out" className="text-stone-500 hover:text-stone-300 transition-colors p-1">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-[#faf7f2]">
      {/* Desktop Sidebar — stone-900 to match HomeE pricing section */}
      <aside className="hidden md:flex w-64 bg-stone-900 flex-col fixed inset-y-0 left-0 z-40">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0 bg-stone-900 border-stone-800">
          {sidebarContent}
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <main className="flex-1 md:ml-64">
        {/* Mobile header — matches HomeE navbar style */}
        <div className="md:hidden sticky top-0 z-30 flex items-center justify-between h-14 px-4 bg-[#faf7f2]/90 backdrop-blur-xl border-b border-stone-200/80 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl hover:bg-stone-100 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 text-stone-700" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
              <span className="text-white font-black text-sm">P</span>
            </div>
            <span className="font-bold text-stone-900 text-base tracking-tight">ProposAI</span>
          </div>
          <button
            onClick={() => navigate("/proposals/new")}
            className="h-8 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3 h-3" /> New
          </button>
        </div>

        <div className="p-4 md:p-8">
          {/* Page header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-black text-stone-900 tracking-tight">{t("dashboard.title")}</h1>
              <p className="text-stone-500 text-sm mt-0.5">
                {t("dashboard.welcomeBack", { name: user?.name?.split(" ")[0] || t("common.contractor") })}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {proposals && proposals.length > 0 && (
                <button onClick={handleBulkExport}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-sm font-medium transition-colors">
                  <Download className="w-4 h-4" /> {t("dashboard.exportAll")}
                </button>
              )}
              <button onClick={() => navigate("/templates")}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-sm font-medium transition-colors">
                <FileText className="w-4 h-4" /> {t("dashboard.myTemplates")}
              </button>
              <button onClick={() => navigate("/proposals/new")}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold transition-all hover:scale-105 shadow-md shadow-orange-500/20">
                <Plus className="w-4 h-4" /> New Proposal
              </button>
            </div>
          </div>

          {/* Empty State Banner */}
          {proposals?.length === 0 && !isLoading && (
            <div className="mb-8 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Upload className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-bold text-stone-900 mb-1">{t("dashboard.importBannerTitle")}</h3>
                  <p className="text-sm text-stone-600 mb-3">
                    {t("dashboard.importBannerDesc")}
                  </p>
                  <button onClick={() => navigate("/import")}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-sm font-semibold transition-colors">
                    <Upload className="w-4 h-4" /> {t("dashboard.importNow")}
                  </button>
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
          <h2 className="text-lg font-black text-stone-900 tracking-tight mb-4">{t("dashboard.proposalPerformance")}</h2>
          <ResponseAnalyticsWidget />
        </div>

        {/* Feedback Analytics */}
        <div className="mb-8">
          <h2 className="text-lg font-black text-stone-900 tracking-tight mb-4">{t("dashboard.clientFeedback")}</h2>
          <FeedbackAnalyticsWidget />
        </div>

        {/* Recommendations */}
        <div className="mb-8">
          <h2 className="text-lg font-black text-stone-900 tracking-tight mb-4">{t("dashboard.improvementRecs")}</h2>
          <RecommendationsWidget />
        </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[
              { label: t("dashboard.totalProposals"), value: proposals?.length || 0, accent: "border-l-amber-400" },
              {
                label: t("dashboard.sentThisMonth"),
                value: proposals?.filter(p => {
                  if (!p.sentAt) return false;
                  const s = new Date(p.sentAt), n = new Date();
                  return s.getFullYear() === n.getFullYear() && s.getMonth() === n.getMonth();
                }).length || 0,
                accent: "border-l-orange-400",
              },
              {
                label: t("dashboard.viewedByClients"),
                value: proposals?.filter(p => p.status === "viewed" || p.status === "accepted").length || 0,
                accent: "border-l-emerald-400",
                highlight: true,
              },
            ].map(({ label, value, accent, highlight }) => (
              <div key={label} className={`bg-white border border-stone-100 rounded-2xl p-5 border-l-4 ${accent} shadow-sm`}>
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">{label}</p>
                <p className={`text-4xl font-black tracking-tight ${highlight ? "text-orange-500" : "text-stone-900"}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Proposals Table */}
          <div className="bg-white border border-stone-100 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center justify-between flex-1">
                <h2 className="font-bold text-stone-900">{t("dashboard.allProposals")}</h2>
                <span className="text-sm text-stone-400">{proposals?.length || 0} {t("dashboard.total")}</span>
              </div>
              {proposals && proposals.length > 5 && (
                <div className="relative sm:w-56">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
                  <input
                    placeholder="Search proposals..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-stone-200 text-sm text-stone-800 placeholder:text-stone-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all"
                  />
                </div>
              )}
            </div>

            {isLoading ? (
              <div className="p-12 text-center">
                <div className="animate-spin w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full mx-auto" />
              </div>
            ) : proposalsError ? (
              <div className="p-12 text-center">
                <p className="text-rose-500 text-sm mb-3">Failed to load proposals.</p>
                <button onClick={() => refetch()}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-stone-700 text-sm font-medium hover:bg-stone-50 transition-colors">
                  Retry
                </button>
              </div>
            ) : proposals?.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-14 h-14 bg-stone-50 border border-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-7 h-7 text-stone-300" />
                </div>
                <h3 className="font-bold text-stone-900 mb-1">{t("dashboard.noProposals")}</h3>
                <p className="text-stone-400 text-sm mb-6">{t("dashboard.getStarted")}</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button onClick={() => navigate("/templates")}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-sm font-semibold transition-colors">
                    <FileText className="w-4 h-4" /> {t("dashboard.myTemplates")}
                  </button>
                  <button onClick={() => navigate("/proposals/new")}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-sm font-medium transition-colors">
                    <Plus className="w-4 h-4" /> {t("dashboard.createWithAI")}
                  </button>
                  <button onClick={() => navigate("/import")}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-sm font-medium transition-colors">
                    <Upload className="w-4 h-4" /> {t("dashboard.importPast")}
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-stone-100 bg-stone-50/60">
                      <th className="text-left text-[11px] font-bold text-stone-400 uppercase tracking-wider px-6 py-3">{t("dashboard.colProposal")}</th>
                      <th className="text-left text-[11px] font-bold text-stone-400 uppercase tracking-wider px-5 py-3">{t("dashboard.colTrade")}</th>
                      <th className="text-left text-[11px] font-bold text-stone-400 uppercase tracking-wider px-5 py-3">{t("dashboard.colClient")}</th>
                      <th className="text-left text-[11px] font-bold text-stone-400 uppercase tracking-wider px-5 py-3">{t("dashboard.colStatus")}</th>
                      <th className="text-left text-[11px] font-bold text-stone-400 uppercase tracking-wider px-5 py-3">{t("dashboard.colDate")}</th>
                      <th className="text-right text-[11px] font-bold text-stone-400 uppercase tracking-wider px-5 py-3">{t("dashboard.colActions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proposals?.filter(p => {
                      if (!searchQuery.trim()) return true;
                      const q = searchQuery.toLowerCase();
                      return (
                        p.title.toLowerCase().includes(q) ||
                        (p.clientName?.toLowerCase() || "").includes(q) ||
                        (p.clientEmail?.toLowerCase() || "").includes(q) ||
                        p.tradeType.toLowerCase().includes(q)
                      );
                    }).map((p) => {
                      const statusColor = STATUS_COLORS[p.status] || STATUS_COLORS.draft;
                      const StatusIcon = STATUS_ICONS[p.status] || STATUS_ICONS.draft;
                      const statusLabel = t(`dashboard.status${p.status.charAt(0).toUpperCase() + p.status.slice(1)}` as any) || p.status;
                      return (
                        <tr key={p.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50/60 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-semibold text-sm text-stone-900 truncate max-w-[200px]">{p.title}</p>
                            {p.totalCost && <p className="text-xs text-stone-400 mt-0.5">${p.totalCost}</p>}
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-xs text-stone-500 font-medium">{TRADE_LABELS[p.tradeType] || p.tradeType}</span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-sm text-stone-700">{p.clientName || "-"}</span>
                            {p.clientEmail && <p className="text-xs text-stone-400 mt-0.5">{p.clientEmail}</p>}
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor}`}>
                              <StatusIcon className="w-3 h-3" />
                              {statusLabel}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-xs text-stone-400">
                              {new Date(p.createdAt).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => navigate(`/proposals/${p.id}`)}
                                title="View"
                                aria-label={`View proposal: ${p.title}`}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteId(p.id)}
                                title="Delete"
                                aria-label={`Delete proposal: ${p.title}`}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
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
