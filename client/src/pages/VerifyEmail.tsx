import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { FileText, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VerifyEmail() {
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  const params = new URLSearchParams(window.location.search);
  const token = params.get("token") ?? "";

  const utils = trpc.useUtils();

  const verifyMutation = trpc.auth.verifyEmail.useMutation({
    onSuccess: async (data) => {
      setStatus("success");
      setMessage(data.message);
      // Refresh auth state then redirect to dashboard
      await utils.auth.me.invalidate();
      setTimeout(() => navigate("/dashboard"), 2000);
    },
    onError: (err) => {
      setStatus("error");
      setMessage(err.message || "Verification failed. Please try again.");
    },
  });

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token found. Please use the link from your email.");
      return;
    }
    verifyMutation.mutate({ token });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

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

        {/* Status icon */}
        <div className="mb-6">
          {status === "loading" && (
            <div className="w-20 h-20 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto">
              <Loader2 className="w-9 h-9 text-amber-400 animate-spin" />
            </div>
          )}
          {status === "success" && (
            <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto">
              <CheckCircle className="w-9 h-9 text-green-400" />
            </div>
          )}
          {status === "error" && (
            <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
              <XCircle className="w-9 h-9 text-red-400" />
            </div>
          )}
        </div>

        {/* Title */}
        {status === "loading" && (
          <>
            <h1 className="text-2xl font-bold text-white mb-3">Verifying your email…</h1>
            <p className="text-slate-400 text-sm">Please wait a moment.</p>
          </>
        )}
        {status === "success" && (
          <>
            <h1 className="text-2xl font-bold text-white mb-3">Email verified!</h1>
            <p className="text-slate-400 text-sm mb-6">{message}</p>
            <p className="text-slate-500 text-xs">Redirecting you to the dashboard…</p>
          </>
        )}
        {status === "error" && (
          <>
            <h1 className="text-2xl font-bold text-white mb-3">Verification failed</h1>
            <p className="text-slate-400 text-sm mb-6">{message}</p>
            <div className="flex flex-col gap-3">
              <Button
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold"
                onClick={() => navigate("/register")}
              >
                Create a new account
              </Button>
              <Button
                variant="outline"
                className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
                onClick={() => navigate("/login")}
              >
                Back to sign in
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
