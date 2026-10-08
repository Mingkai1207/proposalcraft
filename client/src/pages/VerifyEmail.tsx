import AuthShell from "@/components/AuthShell";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  authReturnUrl,
  clearPendingAuthReturn,
  getAuthReturn,
  readPendingAuthReturn,
} from "@/lib/authReturn";
import { FileText, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VerifyEmail() {
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");

  const params = new URLSearchParams(window.location.search);
  const token = params.get("token") ?? "";
  const returnTo = getAuthReturn(
    window.location.search,
    readPendingAuthReturn()
  );

  const utils = trpc.useUtils();

  const verifyMutation = trpc.auth.verifyEmail.useMutation({
    onSuccess: async data => {
      setStatus("success");
      setMessage(data.message);
      await utils.auth.me.fetch(undefined, { staleTime: 0 });
      clearPendingAuthReturn();
      setTimeout(() => navigate(returnTo), 2000);
    },
    onError: err => {
      setStatus("error");
      setMessage(err.message || "Verification failed. Please try again.");
    },
  });

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage(
        "No verification token found. Please use the link from your email."
      );
      return;
    }
    verifyMutation.mutate({ token });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <AuthShell>
      {/* Status icon */}
      <div className="mb-6">
        {status === "loading" && (
          <div className="w-20 h-20 rounded-full bg-card border border-border flex items-center justify-center mx-auto">
            <Loader2 className="w-9 h-9 text-primary animate-spin" />
          </div>
        )}
        {status === "success" && (
          <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto">
            <CheckCircle className="w-9 h-9 text-primary" />
          </div>
        )}
        {status === "error" && (
          <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
            <XCircle className="w-9 h-9 text-destructive" />
          </div>
        )}
      </div>

      {/* Title */}
      {status === "loading" && (
        <>
          <h1 className="text-2xl font-bold text-foreground mb-3">
            Verifying your email…
          </h1>
          <p className="text-muted-foreground text-sm">Please wait a moment.</p>
        </>
      )}
      {status === "success" && (
        <>
          <h1 className="text-2xl font-bold text-foreground mb-3">
            Email verified!
          </h1>
          <p className="text-muted-foreground text-sm mb-6">{message}</p>
          <p className="text-muted-foreground text-xs">
            Taking you back to your requested page…
          </p>
        </>
      )}
      {status === "error" && (
        <>
          <h1 className="text-2xl font-bold text-foreground mb-3">
            Verification failed
          </h1>
          <p className="text-muted-foreground text-sm mb-6">{message}</p>
          <div className="flex flex-col gap-3">
            <Button
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              onClick={() => navigate(authReturnUrl("/register", returnTo))}
            >
              Create a new account
            </Button>
            <Button
              variant="outline"
              className="w-full border-border text-muted-foreground hover:bg-card"
              onClick={() => navigate(authReturnUrl("/login", returnTo))}
            >
              Back to sign in
            </Button>
          </div>
        </>
      )}
    </AuthShell>
  );
}
