import AuthShell from "@/components/AuthShell";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  authReturnUrl,
  clearPendingAuthReturn,
  getAuthReturn,
  rememberPendingAuthReturn,
} from "@/lib/authReturn";
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
import { Loader2, Eye, EyeOff, FileText, CheckCircle2 } from "lucide-react";

export default function Register() {
  const [, navigate] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const returnTo = getAuthReturn(window.location.search);

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: async data => {
      if (data.autoVerified) {
        await utils.auth.me.invalidate();
        clearPendingAuthReturn();
        navigate(returnTo);
      } else {
        rememberPendingAuthReturn(returnTo);
        navigate(authReturnUrl("/check-your-email", returnTo, { email }));
      }
    },
    onError: err => {
      setError(err.message || "Registration failed. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password.length > 72) {
      setError("Password must be 72 characters or fewer.");
      return;
    }
    registerMutation.mutate({
      name,
      email,
      password,
      origin: window.location.origin,
    });
  };

  const passwordStrength =
    password.length === 0
      ? null
      : password.length < 8
        ? "weak"
        : password.length < 12
          ? "good"
          : "strong";

  return (
    <AuthShell>
      <Card className="bg-card border-border ">
        <CardHeader className="pb-4">
          <CardTitle className="text-foreground text-xl">
            <h1>Get started for free</h1>
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Start generating professional proposals in under 60 seconds
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert className="border-red-500/50 bg-red-500/10">
                <AlertDescription className="text-destructive text-sm">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-muted-foreground text-sm font-medium"
              >
                Full name
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="John Smith"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                autoComplete="name"
                className="bg-card border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 h-11"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-muted-foreground text-sm font-medium"
              >
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="bg-card border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 h-11"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-muted-foreground text-sm font-medium"
              >
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  maxLength={72}
                  autoComplete="new-password"
                  className="bg-card border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {/* Password strength indicator */}
              {passwordStrength && (
                <div className="flex gap-1 mt-1">
                  {["weak", "good", "strong"].map((level, i) => {
                    const filled =
                      (passwordStrength === "weak" && i === 0) ||
                      (passwordStrength === "good" && i <= 1) ||
                      passwordStrength === "strong";
                    const color =
                      passwordStrength === "weak"
                        ? "bg-red-500"
                        : passwordStrength === "good"
                          ? "bg-amber-500"
                          : "bg-green-500";
                    return (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-colors ${filled ? color : "bg-card"}`}
                      />
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="confirmPassword"
                className="text-muted-foreground text-sm font-medium"
              >
                Confirm password
              </Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                className={`bg-card border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 h-11 ${
                  confirmPassword && confirmPassword !== password
                    ? "border-red-500/60"
                    : ""
                }`}
              />
            </div>

            <Button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold border-0 mt-2"
            >
              {registerMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating account…
                </>
              ) : (
                "Create free account"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground text-sm">
              Already have an account?{" "}
              <Link href={authReturnUrl("/login", returnTo)}>
                <span className="text-primary hover:text-primary font-medium cursor-pointer transition-colors">
                  Sign in
                </span>
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-muted-foreground text-xs mt-6">
        By creating an account, you agree to our{" "}
        <Link href="/terms">
          <span className="text-muted-foreground hover:text-muted-foreground cursor-pointer underline underline-offset-2">
            Terms of Service
          </span>
        </Link>{" "}
        and{" "}
        <Link href="/privacy">
          <span className="text-muted-foreground hover:text-muted-foreground cursor-pointer underline underline-offset-2">
            Privacy Policy
          </span>
        </Link>
        .
      </p>
    </AuthShell>
  );
}
