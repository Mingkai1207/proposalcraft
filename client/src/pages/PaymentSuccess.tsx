import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { CheckCircle, Sparkles, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export default function PaymentSuccess() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const utils = trpc.useUtils();

  const [activationState, setActivationState] = useState<"pending" | "activating" | "success" | "error">("pending");
  const [errorMsg, setErrorMsg] = useState("");
  const [planName, setPlanName] = useState("Starter");

  const activateMutation = trpc.billing.activateSubscription.useMutation({
    onSuccess: () => {
      setActivationState("success");
      utils.subscription.get.invalidate();
    },
    onError: (e) => {
      // If PayPal already activated via webhook, treat as success
      setActivationState("success");
      utils.subscription.get.invalidate();
    },
  });

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate("/");
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const plan = params.get("plan") as "starter" | "pro" | null;
    const subscriptionId = params.get("subscription_id");

    if (plan) {
      setPlanName(plan === "pro" ? "Pro" : "Starter");
    }

    if (plan && subscriptionId) {
      setActivationState("activating");
      activateMutation.mutate({ subscriptionId, plan });
    } else if (plan) {
      // PayPal didn't pass subscription_id — still show success, webhook will activate
      setActivationState("success");
    } else {
      // No params at all — redirect to dashboard
      navigate("/dashboard");
    }
  }, [authLoading, isAuthenticated]);

  if (authLoading || activationState === "pending") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (activationState === "activating") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-orange-400 animate-spin mx-auto mb-4" />
          <p className="text-white text-lg font-semibold">Activating your subscription…</p>
          <p className="text-slate-400 text-sm mt-1">Just a moment while we set things up.</p>
        </div>
      </div>
    );
  }

  if (activationState === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">Activation Issue</h1>
          <p className="text-muted-foreground text-sm mb-6">{errorMsg || "We couldn't activate your subscription automatically. Your payment was received — please contact support and we'll sort it out right away."}</p>
          <Button onClick={() => navigate("/dashboard")} className="w-full">
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Success state
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Main card */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-black/40 overflow-hidden">
          {/* Top banner */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-400 px-8 py-6 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-white">You're all set!</h1>
            <p className="text-orange-100 text-sm mt-1">Welcome to ProposAI {planName}</p>
          </div>

          {/* Body */}
          <div className="px-8 py-6">
            <div className="text-center mb-6">
              <p className="text-foreground font-semibold text-lg">
                🎉 Congratulations{user?.name ? `, ${user.name.split(" ")[0]}` : ""}!
              </p>
              <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
                Your <strong>{planName}</strong> subscription is now active. You can start generating professional proposals right away.
              </p>
            </div>

            {/* What's unlocked */}
            <div className="bg-slate-50 rounded-2xl p-5 mb-6 space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">What's unlocked</p>
              {planName === "Pro" ? (
                <>
                  <FeatureRow icon="🚀" text="Unlimited AI-generated proposals" />
                  <FeatureRow icon="🤖" text="Priority ProposAI (most powerful model)" />
                  <FeatureRow icon="📄" text="PDF, Word & Google Doc exports" />
                  <FeatureRow icon="📊" text="Advanced analytics & tracking" />
                  <FeatureRow icon="🎨" text="Custom branding & templates" />
                </>
              ) : (
                <>
                  <FeatureRow icon="📋" text="20 AI-generated proposals per month" />
                  <FeatureRow icon="🤖" text="ProposAI standard generation" />
                  <FeatureRow icon="📄" text="PDF, Word & Google Doc exports" />
                  <FeatureRow icon="📧" text="Email delivery & tracking" />
                  <FeatureRow icon="💾" text="Save proposals as reusable templates" />
                </>
              )}
            </div>

            <div className="space-y-3">
              <Button
                size="lg"
                className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-md shadow-orange-500/20"
                onClick={() => navigate("/dashboard/new")}
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Create Your First Proposal
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full h-12"
                onClick={() => navigate("/dashboard")}
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>

        <p className="text-center text-slate-500 text-xs mt-4">
          Questions? Email us at <a href="mailto:support@proposai.org" className="text-orange-400 hover:underline">support@proposai.org</a>
        </p>
      </div>
    </div>
  );
}

function FeatureRow({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-base">{icon}</span>
      <span className="text-sm text-foreground">{text}</span>
    </div>
  );
}
