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
    onError: (err) => {
      toast.error(err.message || "Failed to resend. Please try again.");
    },
  });

  const handleResend = () => {
    resendMutation.mutate({ email, origin: window.location.origin });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 text-center">
        {/* Logo */}
        <div className="mb-8">
          <Link href="/">
            <div className="inline-flex items-center gap-2 cursor-pointer group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">ProposAI</span>
            </div>
          </Link>
        </div>

        {/* Email icon */}
        <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-6">
          <Mail className="w-9 h-9 text-amber-400" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-3">Check your email</h1>
        <p className="text-slate-400 text-sm leading-relaxed mb-2">
          We sent a verification link to
        </p>
        {email && (
          <p className="text-amber-400 font-semibold text-sm mb-6">{email}</p>
        )}
        <p className="text-slate-400 text-sm leading-relaxed mb-8">
          Click the link in the email to verify your account and start using ProposAI.
          The link expires in 24 hours.
        </p>

        {/* Resend button */}
        {resent ? (
          <div className="flex items-center justify-center gap-2 text-green-400 text-sm mb-6">
            <CheckCircle className="w-4 h-4" />
            <span>Verification email resent successfully!</span>
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full mb-4 border-slate-700 text-slate-300 hover:bg-slate-800"
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

        <p className="text-slate-500 text-xs">
          Already verified?{" "}
          <Link href="/login" className="text-amber-400 hover:text-amber-300">
            Sign in
          </Link>
        </p>

        {/* Tips */}
        <div className="mt-8 p-4 rounded-xl bg-slate-900/60 border border-slate-700/40 text-left">
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            Can't find the email?
          </p>
          <ul className="text-slate-500 text-xs space-y-1 list-disc list-inside">
            <li>Check your spam or junk folder</li>
            <li>Make sure you entered the correct email address</li>
            <li>Wait a few minutes and refresh your inbox</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
