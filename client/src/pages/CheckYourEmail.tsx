import AuthShell from "@/components/AuthShell";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { FileText, Mail, RefreshCw, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function CheckYourEmail() {
  const [, navigate] = useLocation();
  const [resent, setResent] = useState(false);

  // Read the email from query params (passed from Register page)
  const params = new URLSearchParams(window.location.search);
  const email = params.get("email") ?? "";

  const resendMutation = trpc.auth.resendVerification.useMutation({
    onSuccess: () => {
      setResent(true);
      toast.success("Verification email resent! Check your inbox.");
    },
    onError: err => {
      toast.error(err.message || "Failed to resend. Please try again.");
    },
  });

  const handleResend = () => {
    resendMutation.mutate({ email, origin: window.location.origin });
  };

  return (
    <AuthShell>
      {/* Email icon */}
      <div className="w-20 h-20 rounded-full bg-accent border border-border flex items-center justify-center mx-auto mb-6">
        <Mail className="w-9 h-9 text-primary" />
      </div>

      <h1 className="text-2xl font-bold text-foreground mb-3">
        Check your email
      </h1>
      <p className="text-muted-foreground text-sm leading-relaxed mb-2">
        We sent a verification link to
      </p>
      {email && (
        <p className="text-primary font-semibold text-sm mb-6">{email}</p>
      )}
      <p className="text-muted-foreground text-sm leading-relaxed mb-8">
        Click the link in the email to verify your account and start using
        ProposAI. The link expires in 24 hours.
      </p>

      {/* Resend button */}
      {resent ? (
        <div className="flex items-center justify-center gap-2 text-primary text-sm mb-6">
          <CheckCircle className="w-4 h-4" />
          <span>Verification email resent successfully!</span>
        </div>
      ) : (
        <Button
          variant="outline"
          className="w-full mb-4 border-border text-muted-foreground hover:bg-card"
          onClick={handleResend}
          disabled={resendMutation.isPending || !email}
        >
          {resendMutation.isPending ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Resend verification email
        </Button>
      )}

      <p className="text-muted-foreground text-xs">
        Already verified?{" "}
        <Link href="/login" className="text-primary hover:text-primary">
          Sign in
        </Link>
      </p>

      {/* Tips */}
      <div className="mt-8 p-4 rounded-xl bg-card border border-border text-left">
        <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-2">
          Can't find the email?
        </p>
        <ul className="text-muted-foreground text-xs space-y-1 list-disc list-inside">
          <li>Check your spam or junk folder</li>
          <li>Make sure you entered the correct email address</li>
          <li>Wait a few minutes and refresh your inbox</li>
        </ul>
      </div>
    </AuthShell>
  );
}
