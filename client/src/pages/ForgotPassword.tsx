import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, FileText, CheckCircle } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetMutation = trpc.auth.requestPasswordReset.useMutation({
    onSuccess: () => setSubmitted(true),
    onError: (err) => setError(err.message || "Something went wrong. Please try again."),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    resetMutation.mutate({ email, origin: window.location.origin });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link href="/">
            <div className="inline-flex items-center gap-2 cursor-pointer group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">ProposAI</span>
            </div>
          </Link>
        </div>

        <Card className="bg-slate-900/80 border-slate-700/50 shadow-2xl backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-xl">Reset your password</CardTitle>
            <CardDescription className="text-slate-400">
              Enter your email and we'll send you a reset link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {submitted ? (
              <div className="text-center py-4">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <p className="text-white font-medium mb-2">Check your inbox</p>
                <p className="text-slate-400 text-sm mb-6">
                  If an account exists for <strong className="text-slate-300">{email}</strong>, you'll receive a password reset link shortly.
                </p>
                <Link href="/login">
                  <span className="text-amber-400 hover:text-amber-300 text-sm font-medium cursor-pointer">
                    Back to sign in →
                  </span>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert className="border-red-500/50 bg-red-500/10">
                    <AlertDescription className="text-red-400 text-sm">{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300 text-sm font-medium">
                    Email address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="bg-slate-800/60 border-slate-600 text-white placeholder:text-slate-500 focus:border-amber-500 focus:ring-amber-500/20 h-11"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={resetMutation.isPending}
                  className="w-full h-11 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold shadow-lg shadow-amber-500/25 border-0"
                >
                  {resetMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending…</>
                  ) : (
                    "Send reset link"
                  )}
                </Button>
                <p className="text-center text-sm text-slate-400">
                  Remember your password?{" "}
                  <Link href="/login">
                    <span className="text-amber-400 hover:text-amber-300 font-medium cursor-pointer">Sign in</span>
                  </Link>
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
