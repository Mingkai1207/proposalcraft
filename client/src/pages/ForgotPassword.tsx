import AuthShell from "@/components/AuthShell";
import { useState } from "react";
import { Link } from "wouter";
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
import { Loader2, FileText, CheckCircle } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetMutation = trpc.auth.requestPasswordReset.useMutation({
    onSuccess: () => setSubmitted(true),
    onError: err =>
      setError(err.message || "Something went wrong. Please try again."),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    resetMutation.mutate({ email, origin: window.location.origin });
  };

  return (
    <AuthShell>
      <Card className="bg-card border-border ">
        <CardHeader className="pb-4">
          <CardTitle className="text-foreground text-xl">
            <h1>Reset your password</h1>
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Enter your email and we'll send you a reset link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="text-center py-4">
              <CheckCircle className="w-12 h-12 text-primary mx-auto mb-3" />
              <p className="text-foreground font-medium mb-2">
                Check your inbox
              </p>
              <p className="text-muted-foreground text-sm mb-6">
                If an account exists for{" "}
                <strong className="text-muted-foreground">{email}</strong>,
                you'll receive a password reset link shortly.
              </p>
              <Link href="/login">
                <span className="text-primary hover:text-primary text-sm font-medium cursor-pointer">
                  Back to sign in →
                </span>
              </Link>
            </div>
          ) : (
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
              <Button
                type="submit"
                disabled={resetMutation.isPending}
                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold border-0"
              >
                {resetMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending…
                  </>
                ) : (
                  "Send reset link"
                )}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Remember your password?{" "}
                <Link href="/login">
                  <span className="text-primary hover:text-primary font-medium cursor-pointer">
                    Sign in
                  </span>
                </Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </AuthShell>
  );
}
