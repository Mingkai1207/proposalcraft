import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function Privacy() {
  const [, navigate] = useLocation();
  const effectiveDate = "March 23, 2026";

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-white px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
        <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-semibold text-foreground">Privacy Policy</h1>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-foreground mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground text-sm mb-8">Effective date: {effectiveDate}</p>

        <div className="space-y-6 text-foreground text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold mb-2">1. Information We Collect</h2>
            <p>We collect information you provide directly to us when you create an account, including your name and email address. We also collect the business information you enter in your profile (business name, phone, address, license number) and the job details you input when generating proposals. We collect usage data such as the number of proposals generated and email open events.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">2. How We Use Your Information</h2>
            <p>We use the information we collect to provide and improve the Service, process your subscription payments, send you proposals and notifications, and communicate with you about your account. We do not sell your personal information to third parties.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">3. AI Processing</h2>
            <p>When you generate a proposal, the job details you enter are sent to an AI language model (OpenAI GPT) to generate the proposal text. OpenAI processes this data in accordance with their privacy policy. We do not share your name, email, or business identity with OpenAI — only the job scope details you enter into the proposal form.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">4. Payment Information</h2>
            <p>Payment processing is handled by Paddle. We do not store your credit card number or payment details on our servers. Paddle's privacy policy governs the handling of your payment information.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">5. Email Tracking</h2>
            <p>When you send a proposal to a client via the Service, we embed a tracking pixel in the email to detect when the client opens it. This allows us to notify you when your proposal has been viewed. Your clients' email open events are stored in our database and are visible only to you.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">6. Data Storage and Security</h2>
            <p>Your data is stored on secure cloud servers. We use industry-standard encryption for data in transit (HTTPS/TLS) and at rest. We retain your data for as long as your account is active. You may request deletion of your account and associated data at any time by contacting support@proposai.org.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">7. Cookies</h2>
            <p>We use a session cookie to keep you logged in. We do not use third-party advertising cookies or tracking cookies beyond what is necessary to operate the Service.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">8. Your Rights</h2>
            <p>You have the right to access, correct, or delete your personal information at any time. To exercise these rights, contact us at support@proposai.org. If you are located in the European Economic Area, you have additional rights under GDPR including the right to data portability and the right to lodge a complaint with your local supervisory authority.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">9. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of material changes by email or by posting a notice on the Service.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">10. Contact</h2>
            <p>For privacy-related questions, contact us at: <a href="mailto:support@proposai.org" className="text-primary underline">support@proposai.org</a></p>
          </section>
        </div>
      </div>
    </div>
  );
}
