import AuthShell from "@/components/AuthShell";
import { useState } from "react";
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
import { Loader2, Eye, EyeOff, FileText } from "lucide-react";

export default function Login() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRegisterLink, setShowRegisterLink] = useState(false);
  const [showResendLink, setShowResendLink] = useState(false);

  const utils = trpc.useUtils();

  // Read ?return= param and validate it's a safe relative path (no open redirect)
  const returnTo = (() => {
    const raw = new URLSearchParams(window.location.search).get("return") || "";
    return raw.startsWith("/") && !raw.startsWith("//") ? raw : "/dashboard";
  })();

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      navigate(returnTo);
    },
    onError: err => {
      setError(err.message || "Login failed. Please try again.");
      setShowRegisterLink(err.message?.includes("No account found") ?? false);
      setShowResendLink(err.message?.includes("verify your email") ?? false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    loginMutation.mutate({ email, password });
  };

  return (
    <AuthShell>
      <Card className="bg-card border-border ">
        <CardHeader className="pb-4">
          <CardTitle className="text-foreground text-xl">
            <h1>Welcome back</h1>
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Enter your email and password to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert className="border-red-500/50 bg-red-500/10">
                <AlertDescription className="text-destructive text-sm">
                  {error}
                  {showRegisterLink && (
                    <span className="block mt-1">
                      <Link
                        href="/register"
                        className="text-primary hover:text-primary underline font-medium"
                      >
                        Create a free account →
                      </Link>
                    </span>
                  )}
                  {showResendLink && (
                    <span className="block mt-1">
                      <Link
                        href={`/check-your-email?email=${encodeURIComponent(email)}`}
                        className="text-primary hover:text-primary underline font-medium"
                      >
                        Resend verification email →
                      </Link>
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}

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
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="password"
                  className="text-muted-foreground text-sm font-medium"
                >
                  Password
                </Label>
                <Link href="/forgot-password">
                  <span className="text-xs text-primary hover:text-primary transition-colors cursor-pointer">
                    Forgot password?
                  </span>
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  maxLength={128}
                  autoComplete="current-password"
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
            </div>

            <Button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold border-0 mt-2"
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground text-sm">
              Don't have an account?{" "}
              <Link href="/register">
                <span className="text-primary hover:text-primary font-medium cursor-pointer transition-colors">
                  Create one free
                </span>
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-muted-foreground text-xs mt-6">
        By signing in, you agree to our{" "}
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
