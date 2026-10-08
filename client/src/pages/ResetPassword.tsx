import AuthShell from "@/components/AuthShell";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
      setError(
        "Invalid or missing reset token. Please request a new password reset."
      );
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
    onError: err =>
      setError(err.message || "Failed to reset password. Please try again."),
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
    <AuthShell>
      <Card className="bg-card border-border ">
        <CardHeader className="pb-4">
          <CardTitle className="text-foreground text-xl">
            <h1>Choose a new password</h1>
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Enter a new password for your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="text-center py-4">
              <CheckCircle className="w-12 h-12 text-primary mx-auto mb-3" />
              <p className="text-foreground font-medium mb-2">
                Password updated!
              </p>
              <p className="text-muted-foreground text-sm">
                You're now signed in. Redirecting to your dashboard…
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert className="border-red-500/50 bg-red-500/10">
                  <AlertDescription className="text-destructive text-sm">
                    {error}
                    <span className="block mt-1">
                      <Link
                        href="/forgot-password"
                        className="text-primary underline font-medium"
                      >
                        Request a new reset link
                      </Link>
                    </span>
                  </AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-muted-foreground text-sm font-medium"
                >
                  New password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={8}
                    maxLength={72}
                    autoComplete="new-password"
                    className="bg-card border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground transition-colors"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="text-muted-foreground text-sm font-medium"
                >
                  Confirm new password
                </Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  maxLength={72}
                  autoComplete="new-password"
                  className="bg-card border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 h-11"
                />
              </div>
              <Button
                type="submit"
                disabled={resetMutation.isPending || !token}
                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold border-0"
              >
                {resetMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Updating…
                  </>
                ) : (
                  "Update password"
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </AuthShell>
  );
}
