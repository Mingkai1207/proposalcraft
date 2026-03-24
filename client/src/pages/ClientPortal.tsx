import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, XCircle, FileText, Clock, AlertCircle, Download } from "lucide-react";
import { toast } from "sonner";

export default function ClientPortal() {
  const [, navigate] = useLocation();
  const [token, setToken] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (t) {
      setToken(t);
    } else {
      setIsLoading(false);
    }
  }, []);

  const { data: proposal, isLoading: proposalLoading, error } = trpc.clientPortal.getProposal.useQuery(
    { token },
    { enabled: !!token }
  );

  const acceptMutation = trpc.clientPortal.acceptProposal.useMutation({
    onSuccess: () => {
      toast.success("Proposal accepted! The contractor will be notified.");
      setTimeout(() => navigate("/"), 2000);
    },
    onError: (e) => toast.error(e.message),
  });

  const declineMutation = trpc.clientPortal.declineProposal.useMutation({
    onSuccess: () => {
      toast.success("Proposal declined. The contractor has been notified.");
      setTimeout(() => navigate("/"), 2000);
    },
    onError: (e) => toast.error(e.message),
  });

  const downloadPDF = () => {
    if (proposal?.pdfUrl) {
      window.open(proposal.pdfUrl, "_blank");
    }
  };

  // Invalid token
  if (!token && !isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
          <h1 className="text-2xl font-bold mb-2">Invalid Link</h1>
          <p className="text-muted-foreground mb-6">This proposal link is invalid or has expired.</p>
          <Button onClick={() => navigate("/")} className="w-full">
            Back to Home
          </Button>
        </Card>
      </div>
    );
  }

  // Loading
  if (proposalLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Proposal not found
  if (error || !proposal) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
          <h1 className="text-2xl font-bold mb-2">Proposal Not Found</h1>
          <p className="text-muted-foreground mb-6">This proposal link is invalid or has expired.</p>
          <Button onClick={() => navigate("/")} className="w-full">
            Back to Home
          </Button>
        </Card>
      </div>
    );
  }

  // Proposal already responded
  if (proposal.acceptedAt || proposal.declinedAt) {
    const isAccepted = proposal.acceptedAt;
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center">
          {isAccepted ? (
            <>
              <CheckCircle className="w-12 h-12 mx-auto text-green-600 mb-4" />
              <h1 className="text-2xl font-bold mb-2">Proposal Accepted</h1>
              <p className="text-muted-foreground mb-6">
                You accepted this proposal on {new Date(proposal.acceptedAt!).toLocaleDateString()}.
              </p>
            </>
          ) : (
            <>
              <XCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
              <h1 className="text-2xl font-bold mb-2">Proposal Declined</h1>
              <p className="text-muted-foreground mb-6">
                You declined this proposal on {new Date(proposal.declinedAt!).toLocaleDateString()}.
              </p>
            </>
          )}
          <Button onClick={() => navigate("/")} className="w-full">
            Back to Home
          </Button>
        </Card>
      </div>
    );
  }

  // Check if expired
  const isExpired = proposal.expiryDays && proposal.sentAt
    ? new Date(proposal.sentAt).getTime() + proposal.expiryDays * 24 * 60 * 60 * 1000 < Date.now()
    : false;

  if (isExpired) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <Clock className="w-12 h-12 mx-auto text-amber-600 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Proposal Expired</h1>
          <p className="text-muted-foreground mb-6">
            This proposal expired on {new Date(new Date(proposal.sentAt!).getTime() + proposal.expiryDays! * 24 * 60 * 60 * 1000).toLocaleDateString()}.
          </p>
          <p className="text-sm text-muted-foreground mb-6">Please contact the contractor for a new proposal.</p>
          <Button onClick={() => navigate("/")} className="w-full">
            Back to Home
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Header */}
      <div className="border-b border-border bg-white px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-foreground">Proposal Review</h1>
          <p className="text-muted-foreground mt-1">From {proposal.userId}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Proposal Details Card */}
        <Card className="p-8 mb-8">
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Left: Proposal Info */}
            <div>
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                {proposal.title}
              </h2>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Trade Type</p>
                  <p className="font-medium capitalize">{proposal.tradeType}</p>
                </div>

                {proposal.clientName && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Client Name</p>
                    <p className="font-medium">{proposal.clientName}</p>
                  </div>
                )}

                {proposal.clientAddress && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Job Site Address</p>
                    <p className="font-medium">{proposal.clientAddress}</p>
                  </div>
                )}

                {proposal.totalCost && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Estimated Cost</p>
                    <p className="text-lg font-semibold text-primary">${proposal.totalCost}</p>
                  </div>
                )}

                {proposal.jobScope && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Job Scope</p>
                    <p className="text-sm">{proposal.jobScope}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right: PDF Preview */}
            <div className="flex flex-col">
              <p className="text-sm text-muted-foreground mb-2">Proposal Document</p>
              <div className="bg-muted rounded-lg p-4 flex-1 flex items-center justify-center mb-4">
                <div className="text-center">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">PDF Document</p>
                </div>
              </div>
              <Button onClick={downloadPDF} className="w-full" variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>

          {/* Expiry Info */}
          {proposal.expiryDays && proposal.sentAt && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
              <p className="text-sm text-blue-900">
                <Clock className="w-4 h-4 inline mr-2" />
                This proposal expires on{" "}
                <strong>
                  {new Date(new Date(proposal.sentAt).getTime() + proposal.expiryDays * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </strong>
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              onClick={() => acceptMutation.mutate({ token })}
              disabled={acceptMutation.isPending || declineMutation.isPending}
              className="flex-1 bg-green-600 hover:bg-green-700"
              size="lg"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {acceptMutation.isPending ? "Accepting..." : "Accept Proposal"}
            </Button>
            <Button
              onClick={() => declineMutation.mutate({ token })}
              disabled={acceptMutation.isPending || declineMutation.isPending}
              variant="destructive"
              className="flex-1"
              size="lg"
            >
              <XCircle className="w-4 h-4 mr-2" />
              {declineMutation.isPending ? "Declining..." : "Decline Proposal"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
