import { useAuth } from "@/_core/hooks/useAuth";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { CheckCircle, ArrowLeft, Zap, Crown, ExternalLink, Lock } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useRef, useState } from "react";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "/month",
    proposals: "3 proposals/month",
    badge: null,
    features: [
      "AI proposal generation (Gemini 2.5 Flash only)",
      "PDF download",
      "5 trade templates (HVAC, Plumbing, Electrical, Roofing, General)",
      "English language only",
      "ProposAI watermark on PDF",
    ],
    locked: [
      "Email delivery to clients",
      "Proposal open & read tracking",
      "Custom logo & branding",
      "Multi-language proposals",
      "Premium AI models (GPT-4o, Claude, DeepSeek)",
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
    badge: "Most Popular",
    features: [
      "Everything in Free — no watermark",
      "Email delivery directly to clients",
      "Proposal open & read tracking",
      "Custom logo & branding on every PDF",
      "Custom terms & conditions",
      "Multi-language proposals (EN, ZH, ES, FR)",
      "All 7 AI models including GPT-4o Mini & DeepSeek V3",
      "Proposal expiry date (urgency for clients)",
      "Auto follow-up email if client hasn't opened in 48h",
    ],
    locked: [
      "Proposal template library (10+ trade templates)",
      "Bulk export all proposals as ZIP",
      "Custom sender email domain",
      "Analytics dashboard (open rate, win rate)",
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
    badge: "Best Value",
    features: [
      "Everything in Starter",
      "Unlimited proposal generation",
      "All 7 AI models including GPT-4o, Claude 3.7 & DeepSeek R1",
      "10+ trade-specific proposal templates",
      "Bulk export all proposals as ZIP",
      "Custom sender email domain & name",
      "Analytics dashboard — open rate, win rate, revenue tracked",
      "Client portal — clients can accept/decline online",
      "Priority support (response within 4 hours)",
    ],
    locked: [],
    cta: "Upgrade to Pro",
    highlight: true,
    icon: Crown,
  },
];

// PayPal subscription button component
function PayPalButton({ planId, onSuccess }: { planId: string; onSuccess: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rendered, setRendered] = useState(false);
  const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;

  useEffect(() => {
    if (!clientId || !containerRef.current || rendered) return;

    // Load PayPal JS SDK dynamically
    const scriptId = "paypal-js-sdk";
    const existing = document.getElementById(scriptId);

    const renderButton = () => {
      if (!(window as any).paypal || !containerRef.current) return;
      const planEnvKey = planId === "starter" ? "VITE_PAYPAL_STARTER_PLAN_ID" : "VITE_PAYPAL_PRO_PLAN_ID";
      const paypalPlanId = planId === "starter"
        ? import.meta.env.VITE_PAYPAL_STARTER_PLAN_ID
        : import.meta.env.VITE_PAYPAL_PRO_PLAN_ID;

      if (!paypalPlanId) return;

      try {
        (window as any).paypal.Buttons({
          style: {
            shape: "pill",
            color: "gold",
            layout: "vertical",
            label: "subscribe",
          },
          createSubscription: (_data: any, actions: any) => {
            return actions.subscription.create({ plan_id: paypalPlanId });
          },
          onApprove: (_data: any, _actions: any) => {
            toast.success("Subscription activated! Refreshing your plan...");
            onSuccess();
          },
          onError: (err: any) => {
            console.error("[PayPal] Error:", err);
            toast.error("PayPal checkout failed. Please try again.");
          },
          onCancel: () => {
            toast.info("Checkout cancelled.");
          },
        }).render(containerRef.current);
        setRendered(true);
      } catch (e) {
        console.error("[PayPal] Render error:", e);
      }
    };

    if (existing) {
      if ((window as any).paypal) renderButton();
      else existing.addEventListener("load", renderButton);
    } else {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&vault=true&intent=subscription`;
      script.setAttribute("data-sdk-integration-source", "button-factory");
      script.onload = renderButton;
      document.body.appendChild(script);
    }
  }, [clientId, planId, rendered, onSuccess]);

  return <div ref={containerRef} className="mt-4 min-h-[45px]" />;
}

export default function Pricing() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const { data: subscription, refetch: refetchSub } = trpc.subscription.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const portalMutation = trpc.billing.createPortal.useMutation({
    onSuccess: (data) => {
      if (data.url) window.open(data.url, "_blank");
    },
    onError: (e) => toast.error(e.message),
  });

  const currentPlan = subscription?.plan || "free";

  const handlePayPalSuccess = () => {
    // Give PayPal webhook a moment to fire, then refetch
    setTimeout(() => {
      refetchSub();
      utils.subscription.get.invalidate();
      navigate("/dashboard?upgraded=1");
    }, 3000);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="border-b border-border bg-white px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => navigate(isAuthenticated ? "/dashboard" : "/")}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
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
              You are on the <span className="capitalize font-bold ml-1">{currentPlan}</span> plan
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-start">
          {PLANS.map(({ id, name, price, period, proposals, features, locked, badge, cta, highlight, icon: Icon }) => {
            const isCurrent = currentPlan === id;
            const isPaid = id === "starter" || id === "pro";
            const showPayPal = isAuthenticated && isPaid && !isCurrent;
            const needsLogin = !isAuthenticated && isPaid;

            return (
              <div
                key={id}
                className={`rounded-2xl border p-6 flex flex-col transition-all relative ${
                  highlight
                    ? "border-primary bg-primary text-white shadow-xl"
                    : "border-border bg-card"
                }`}
              >
                {/* Badge */}
                {badge && (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold ${
                    highlight ? "bg-white text-primary" : "bg-primary text-white"
                  }`}>
                    {badge}
                  </div>
                )}

                <div className="mb-5">
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

                <ul className="space-y-2.5 mb-4 flex-1">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <CheckCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${highlight ? "text-white" : "text-primary"}`} />
                      <span className={highlight ? "text-white" : "text-foreground"}>{f}</span>
                    </li>
                  ))}
                  {locked && locked.length > 0 && (
                    <>
                      <li className={`text-xs font-semibold uppercase tracking-wide mt-3 mb-1 ${highlight ? "text-white/50" : "text-muted-foreground/60"}`}>Not included:</li>
                      {locked.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-sm">
                          <Lock className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${highlight ? "text-white/30" : "text-muted-foreground/40"}`} />
                          <span className={`line-through ${highlight ? "text-white/40" : "text-muted-foreground/50"}`}>{f}</span>
                        </li>
                      ))}
                    </>
                  )}
                </ul>

                {/* CTA */}
                {isCurrent ? (
                  <Button disabled variant={highlight ? "secondary" : "default"} className={`w-full mt-4 opacity-60 cursor-not-allowed ${highlight ? "bg-white text-primary" : ""}`}>
                    ✓ Current Plan
                  </Button>
                ) : needsLogin ? (
                  <Button
                    onClick={() => { window.location.href = getLoginUrl(); }}
                    variant={highlight ? "secondary" : "default"}
                    className={`w-full mt-4 ${highlight ? "bg-white text-primary hover:bg-white/90" : ""}`}
                  >
                    Sign in to {cta}
                  </Button>
                ) : showPayPal ? (
                  <PayPalButton planId={id} onSuccess={handlePayPalSuccess} />
                ) : id === "free" ? (
                  <Button disabled variant="outline" className="w-full mt-4 opacity-60 cursor-not-allowed">
                    {cta}
                  </Button>
                ) : null}
              </div>
            );
          })}
        </div>

        {isAuthenticated && currentPlan !== "free" && (
          <div className="mt-6 text-center">
            <Button
              variant="outline"
              onClick={() => portalMutation.mutate()}
              disabled={portalMutation.isPending}
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              {portalMutation.isPending ? "Loading..." : "Manage Subscription (PayPal)"}
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
      <Footer />
    </div>
  );
}
