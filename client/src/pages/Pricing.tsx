import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { CheckCircle, ArrowLeft, Zap, Crown, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "/month",
    proposals: "3 proposals/month",
    features: [
      "AI proposal generation",
      "PDF download",
      "HVAC, Plumbing, Electrical, Roofing templates",
      "Basic branding",
    ],
    cta: "Current Plan",
    highlight: false,
    icon: null,
  },
  {
    id: "starter",
    name: "Starter",
    price: "$29",
    period: "/month",
    proposals: "20 proposals/month",
    features: [
      "Everything in Free",
      "Email delivery to clients",
      "Proposal open tracking",
      "Custom logo & branding",
      "Custom terms & conditions",
    ],
    cta: "Upgrade to Starter",
    highlight: false,
    icon: Zap,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$59",
    period: "/month",
    proposals: "Unlimited proposals",
    features: [
      "Everything in Starter",
      "Unlimited proposal generation",
      "Priority AI generation",
      "Advanced tracking & analytics",
      "Priority support",
    ],
    cta: "Upgrade to Pro",
    highlight: true,
    icon: Crown,
  },
];

export default function Pricing() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();

  const { data: subscription } = trpc.subscription.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const currentPlan = subscription?.plan || "free";

  const checkoutMutation = trpc.billing.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        toast.info("Redirecting to secure checkout...");
        window.open(data.url, "_blank");
      }
    },
    onError: (e) => toast.error(e.message),
  });

  const portalMutation = trpc.billing.createPortal.useMutation({
    onSuccess: (data) => {
      if (data.url) window.open(data.url, "_blank");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleUpgrade = (planId: string) => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    if (planId === "starter" || planId === "pro") {
      checkoutMutation.mutate({ plan: planId });
    }
  };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="border-b border-border bg-white px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate(isAuthenticated ? "/dashboard" : "/")} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-semibold text-foreground">Plans & Pricing</h1>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-3">Simple, transparent pricing</h2>
          <p className="text-muted-foreground text-lg">One winning proposal pays for the tool 10x over.</p>
          {isAuthenticated && (
            <div className="mt-4 inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
              <CheckCircle className="w-4 h-4" />
              You are on the <span className="capitalize font-bold">{currentPlan}</span> plan
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map(({ id, name, price, period, proposals, features, cta, highlight, icon: Icon }) => {
            const isCurrent = currentPlan === id;
            return (
              <div
                key={id}
                className={`rounded-2xl border p-6 flex flex-col transition-all ${
                  highlight
                    ? "border-primary bg-primary text-white shadow-xl scale-105"
                    : "border-border bg-card"
                }`}
              >
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    {Icon && <Icon className={`w-4 h-4 ${highlight ? "text-white" : "text-primary"}`} />}
                    <p className={`text-sm font-semibold uppercase tracking-wide ${highlight ? "text-white/80" : "text-muted-foreground"}`}>
                      {name}
                    </p>
                  </div>
                  <div className="flex items-end gap-1">
                    <span className={`text-4xl font-bold ${highlight ? "text-white" : "text-foreground"}`}>{price}</span>
                    <span className={`text-sm mb-1 ${highlight ? "text-white/70" : "text-muted-foreground"}`}>{period}</span>
                  </div>
                  <p className={`text-sm mt-1 font-medium ${highlight ? "text-white/80" : "text-primary"}`}>{proposals}</p>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <CheckCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${highlight ? "text-white" : "text-primary"}`} />
                      <span className={highlight ? "text-white" : "text-foreground"}>{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => !isCurrent && handleUpgrade(id)}
                  disabled={isCurrent}
                  variant={highlight ? "secondary" : "default"}
                  className={`w-full ${highlight ? "bg-white text-primary hover:bg-white/90" : ""} ${isCurrent ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  {isCurrent ? "Current Plan" : cta}
                </Button>
              </div>
            );
          })}
        </div>

        {isAuthenticated && currentPlan !== "free" && (
          <div className="mt-6 text-center">
            <Button variant="outline" onClick={() => portalMutation.mutate()} disabled={portalMutation.isPending}>
              <ExternalLink className="w-4 h-4 mr-1" />
              {portalMutation.isPending ? "Loading..." : "Manage Subscription & Billing"}
            </Button>
          </div>
        )}

        <div className="mt-8 bg-card border border-border rounded-xl p-6 text-center">
          <h3 className="font-semibold text-foreground mb-2">Need a custom plan?</h3>
          <p className="text-muted-foreground text-sm mb-4">For large teams or enterprise use, contact us for custom pricing.</p>
          <Button variant="outline" onClick={() => toast.info("Contact us at hello@proposai.org")}>
            Contact Sales
          </Button>
        </div>
      </div>
    </div>
  );
}
