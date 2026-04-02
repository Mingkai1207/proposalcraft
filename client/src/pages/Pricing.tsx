import { useAuth } from "@/_core/hooks/useAuth";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { CheckCircle, ArrowLeft, Zap, Crown, Gift } from "lucide-react";

const PLANS = [
  {
    id: "free",
    name: "Starter",
    originalPrice: "$0",
    promoPrice: "FREE",
    period: "/month",
    proposals: "Unlimited proposals",
    badge: null,
    features: [
      "AI proposal generation",
      "Guided form with profile auto-fill",
      "AI summary review before generation",
      "PDF download",
      "Save proposals as templates",
      "Upload your own template documents",
    ],
    highlight: false,
    icon: null,
  },
  {
    id: "starter",
    name: "Professional",
    originalPrice: "$5.99",
    promoPrice: "FREE",
    period: "/month",
    proposals: "Unlimited proposals",
    badge: "Most Popular",
    features: [
      "Everything in Starter",
      "Word (.docx) export",
      "Google Doc export",
      "Revise with AI chatbot",
      "Custom logo & branding on every document",
      "Custom terms & conditions",
      "Multi-language proposals (EN, ZH, ES, FR)",
      "Template-based generation (follow your format)",
    ],
    highlight: false,
    icon: Zap,
  },
  {
    id: "pro",
    name: "Business",
    originalPrice: "$9.99",
    promoPrice: "FREE",
    period: "/month",
    proposals: "Unlimited proposals",
    badge: "Best Value",
    features: [
      "Everything in Professional",
      "Unlimited proposal generation",
      "Bulk export all proposals as ZIP",
      "Analytics dashboard — win rate & revenue tracked",
      "Priority support (response within 4 hours)",
    ],
    highlight: true,
    icon: Crown,
  },
];

export default function Pricing() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();

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

      {/* Promotional banner */}
      <div className="bg-primary text-white text-center py-3 px-4">
        <div className="flex items-center justify-center gap-2 text-sm font-medium">
          <Gift className="w-4 h-4 flex-shrink-0" />
          <span>
            🎉 <strong>Launch Promotion:</strong> All features are completely free during our launch period — no credit card required, no hidden fees.
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
            <Gift className="w-4 h-4" />
            Free During Launch
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-3">Everything is free right now</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            We're in our launch period — all plans and all features are available at no cost. No payment info needed. Just sign up and start winning more jobs.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-start">
          {PLANS.map(({ id, name, originalPrice, promoPrice, period, proposals, features, badge, highlight, icon: Icon }) => {
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
                  <div className="flex items-end gap-2">
                    <span className={`text-4xl font-bold ${highlight ? "text-white" : "text-green-600"}`}>{promoPrice}</span>
                    {originalPrice !== "$0" && (
                      <span className={`text-lg mb-1 line-through ${highlight ? "text-white/40" : "text-muted-foreground/50"}`}>{originalPrice}{period}</span>
                    )}
                  </div>
                  <p className={`text-sm mt-1 font-medium ${highlight ? "text-white/80" : "text-primary"}`}>{proposals}</p>
                </div>

                <ul className="space-y-2.5 mb-6 flex-1">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <CheckCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${highlight ? "text-white" : "text-primary"}`} />
                      <span className={highlight ? "text-white" : "text-foreground"}>{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {isAuthenticated ? (
                  <Button
                    onClick={() => navigate("/dashboard")}
                    variant={highlight ? "secondary" : "default"}
                    className={`w-full ${highlight ? "bg-white text-primary hover:bg-white/90" : ""}`}
                  >
                    Go to Dashboard
                  </Button>
                ) : (
                  <Button
                    onClick={() => navigate("/register")}
                    variant={highlight ? "secondary" : "default"}
                    className={`w-full ${highlight ? "bg-white text-primary hover:bg-white/90" : ""}`}
                  >
                    Get Started Free
                  </Button>
                )}

                <p className={`text-xs text-center mt-2 ${highlight ? "text-white/60" : "text-muted-foreground"}`}>
                  No credit card required
                </p>
              </div>
            );
          })}
        </div>

        {/* FAQ note */}
        <div className="mt-8 bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <h3 className="font-semibold text-green-800 mb-2">Why is everything free?</h3>
          <p className="text-green-700 text-sm">
            We're in our public launch phase and want contractors to experience the full power of ProposAI before we introduce paid plans. Enjoy unlimited access to all features — no strings attached.
          </p>
        </div>

        <div className="mt-6 bg-card border border-border rounded-xl p-6 text-center">
          <h3 className="font-semibold text-foreground mb-2">Questions?</h3>
          <p className="text-muted-foreground text-sm">We're happy to help. Reach us at <a href="mailto:hello@proposai.org" className="text-primary hover:underline">hello@proposai.org</a></p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
