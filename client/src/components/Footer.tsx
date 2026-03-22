import { Link } from "wouter";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <span className="text-white text-xs font-bold">P</span>
            </div>
            <span className="font-semibold text-foreground">ProposAI</span>
            <span className="text-muted-foreground text-sm ml-2">
              &copy; {year} ProposAI. All rights reserved.
            </span>
          </div>

          {/* Legal links */}
          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/pricing" className="hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="/refund" className="hover:text-foreground transition-colors">
              Refund Policy
            </Link>
            <a
              href="mailto:hello@proposai.org"
              className="hover:text-foreground transition-colors"
            >
              Contact
            </a>
          </nav>
        </div>

        {/* Tagline */}
        <div className="mt-4 pt-4 border-t border-border/50 text-center text-xs text-muted-foreground">
          ProposAI helps trade contractors (HVAC, plumbing, electrical, roofing) generate professional proposals in under 60 seconds using AI.
          &nbsp;&middot;&nbsp;
          <a href="https://proposai.org/pricing" className="underline hover:text-foreground">
            View plans from $29/month
          </a>
        </div>
      </div>
    </footer>
  );
}
