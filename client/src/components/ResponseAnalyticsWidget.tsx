import React from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { CheckCircle, XCircle, Clock, TrendingUp } from "lucide-react";

export function ResponseAnalyticsWidget() {
  const { data: proposals } = trpc.proposals.list.useQuery();

  if (!proposals || proposals.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No proposals yet. Performance stats appear after you send your first one.
      </div>
    );
  }

  const sent = proposals.filter(p => p.sentAt).length;
  const accepted = proposals.filter(p => p.acceptedAt).length;
  const declined = proposals.filter(p => p.declinedAt).length;
  const pending = sent - accepted - declined;

  const acceptanceRate = sent > 0 ? Math.round((accepted / sent) * 100) : 0;
  const declineRate = sent > 0 ? Math.round((declined / sent) * 100) : 0;

  const byTrade: Record<string, { sent: number; accepted: number }> = {};
  proposals.forEach(p => {
    if (!byTrade[p.tradeType]) {
      byTrade[p.tradeType] = { sent: 0, accepted: 0 };
    }
    if (p.sentAt) byTrade[p.tradeType].sent++;
    if (p.acceptedAt) byTrade[p.tradeType].accepted++;
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-medium text-muted-foreground">Pending</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{pending}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-xs font-medium text-muted-foreground">Accepted</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{accepted}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-4 h-4 text-red-600" />
            <span className="text-xs font-medium text-muted-foreground">Declined</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{declined}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-medium text-muted-foreground">Acceptance Rate</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{acceptanceRate}%</p>
        </Card>
      </div>

      {Object.keys(byTrade).length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold text-sm mb-3">Performance by Trade</h3>
          <div className="space-y-2">
            {Object.entries(byTrade).map(([trade, stats]) => {
              const rate = stats.sent > 0 ? Math.round((stats.accepted / stats.sent) * 100) : 0;
              return (
                <div key={trade} className="flex items-center justify-between text-sm">
                  <span className="capitalize text-muted-foreground">{trade}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-foreground font-medium">{stats.accepted}/{stats.sent}</span>
                    <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-green-500" style={{ width: `${rate}%` }} />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground w-8 text-right">{rate}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
