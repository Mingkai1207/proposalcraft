import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function Refund() {
  const [, navigate] = useLocation();
  const effectiveDate = "March 23, 2026";

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-white px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
        <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-semibold text-foreground">Refund Policy</h1>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-foreground mb-2">Refund Policy</h1>
        <p className="text-muted-foreground text-sm mb-8">Effective date: {effectiveDate}</p>

        <div className="space-y-6 text-foreground text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold mb-2">7-Day Money-Back Guarantee</h2>
            <p>We stand behind ProposalCraft AI. If you subscribe to a paid plan and are not satisfied for any reason, you may request a full refund within <strong>7 days of your first payment</strong>. No questions asked.</p>
            <p className="mt-2">To request a refund within this window, email us at <a href="mailto:support@proposai.org" className="text-primary underline">support@proposai.org</a> with the subject line "Refund Request" and include the email address associated with your account. We will process your refund within 5 business days.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">After the 7-Day Window</h2>
            <p>After the initial 7-day period, subscription fees are generally non-refundable. However, we review refund requests on a case-by-case basis. If you experience a technical issue that prevented you from using the Service, please contact us and we will work to find a fair resolution.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">Subscription Cancellations</h2>
            <p>You may cancel your subscription at any time from the billing portal. When you cancel, your plan remains active until the end of the current billing period. You will not be charged again after cancellation, and you will not receive a prorated refund for the remaining days in your billing period.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">Free Plan</h2>
            <p>The Free plan is provided at no charge and is not eligible for refunds as no payment is collected.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">Contact Us</h2>
            <p>For refund requests or billing questions, contact us at: <a href="mailto:support@proposai.org" className="text-primary underline">support@proposai.org</a></p>
            <p className="mt-2">We aim to respond to all refund requests within 1 business day.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
