import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, AlertCircle } from "lucide-react";
import { Link } from "wouter";

export function PendingProposalsWidget() {
  const { data: proposals, isLoading } = trpc.proposals.list.useQuery();

  // Filter pending proposals (sent but not opened)
  const pendingProposals = proposals
    ?.filter(p => p.status === "sent")
    .sort((a, b) => {
      // Sort by expiry urgency — use sentAt as the start of the expiry window
      const aBase = a.sentAt ? new Date(a.sentAt).getTime() : new Date(a.createdAt).getTime();
      const bBase = b.sentAt ? new Date(b.sentAt).getTime() : new Date(b.createdAt).getTime();
      const aExpiry = a.expiryDays ? aBase + a.expiryDays * 24 * 60 * 60 * 1000 : Infinity;
      const bExpiry = b.expiryDays ? bBase + b.expiryDays * 24 * 60 * 60 * 1000 : Infinity;
      return aExpiry - bExpiry;
    })
    .slice(0, 5) || [];

  const calculateDaysRemaining = (sentAt: Date | null, createdAt: Date, expiryDays: number | null) => {
    if (!expiryDays) return null;
    const base = sentAt ? new Date(sentAt).getTime() : new Date(createdAt).getTime();
    const expiry = base + expiryDays * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const remaining = Math.ceil((expiry - now) / (24 * 60 * 60 * 1000));
    return remaining;
  };

  const isUrgent = (daysRemaining: number | null) => daysRemaining !== null && daysRemaining <= 3;

  if (isLoading) {
    return (
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Pending Responses</h3>
        <p className="text-sm text-gray-500">Loading...</p>
      </Card>
    );
  }

  if (pendingProposals.length === 0) {
    return (
      <Card className="p-6 bg-green-50 border-green-200">
        <h3 className="font-semibold mb-2">Pending Responses</h3>
        <p className="text-sm text-green-700">All proposals have been reviewed! 🎉</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Pending Responses ({pendingProposals.length})
        </h3>
      </div>

      <div className="space-y-3">
        {pendingProposals.map((proposal) => {
          const daysRemaining = calculateDaysRemaining(proposal.sentAt ?? null, proposal.createdAt, proposal.expiryDays);
          const urgent = isUrgent(daysRemaining);

          return (
            <Link key={proposal.id} href={`/proposals/${proposal.id}`}>
                      <div className={`p-3 rounded border cursor-pointer hover:bg-gray-50 transition ${
                urgent ? "border-red-200 bg-red-50" : "border-gray-200"
              }`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{proposal.title}</p>
                    <p className="text-xs text-gray-500">{proposal.clientName || "Client"}</p>
                  </div>
                  <div className="text-right">
                    {daysRemaining !== null && (
                      <div className={`text-xs font-semibold ${
                        urgent ? "text-red-600" : "text-gray-600"
                      }`}>
                        {daysRemaining} days left
                      </div>
                    )}
                    {urgent && (
                      <AlertCircle className="w-4 h-4 text-red-600 mt-1" />
                    )}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <Button variant="outline" className="w-full mt-4" asChild>
        <Link href="/dashboard">View All Proposals</Link>
      </Button>
    </Card>
  );
}
