import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, FileText, Eye, EyeOff, CheckCircle } from "lucide-react";

export default function ResetPassword() {
  const [, navigate] = useLocation();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (!t) {
      setError("Invalid or missing reset token. Please request a new password reset.");
    } else {
      setToken(t);
    }
  }, []);

  const utils = trpc.useUtils();
  const resetMutation = trpc.auth.resetPassword.useMutation({
    onSuccess: async () => {
      setSuccess(true);
      await utils.auth.me.invalidate();
      setTimeout(() => navigate("/dashboard"), 2000);
    },
    onError: (err) => setError(err.message || "Failed to reset password. Please try again."),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    resetMutation.mutate({ token, password });
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
            <CardTitle className="text-white text-xl">Choose a new password</CardTitle>
            <CardDescription className="text-slate-400">
              Enter a new password for your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="text-center py-4">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <p className="text-white font-medium mb-2">Password updated!</p>
                <p className="text-slate-400 text-sm">You're now signed in. Redirecting to your dashboard…</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert className="border-red-500/50 bg-red-500/10">
                    <AlertDescription className="text-red-400 text-sm">
                      {error}
                      {error.includes("expired") && (
                        <span className="block mt-1">
                          <Link href="/forgot-password">
                            <span className="text-amber-400 hover:text-amber-300 underline font-medium cursor-pointer">
                              Request a new link →
                            </span>
                          </Link>
                        </span>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-300 text-sm font-medium">
                    New password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="At least 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      maxLength={72}
                      autoComplete="new-password"
                      className="bg-slate-800/60 border-slate-600 text-white placeholder:text-slate-500 focus:border-amber-500 focus:ring-amber-500/20 h-11 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-slate-300 text-sm font-medium">
                    Confirm new password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Repeat your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    maxLength={72}
                    autoComplete="new-password"
                    className="bg-slate-800/60 border-slate-600 text-white placeholder:text-slate-500 focus:border-amber-500 focus:ring-amber-500/20 h-11"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={resetMutation.isPending || !token}
                  className="w-full h-11 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold shadow-lg shadow-amber-500/25 border-0"
                >
                  {resetMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Updating…</>
                  ) : (
                    "Update password"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
