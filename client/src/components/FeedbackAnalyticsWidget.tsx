import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Star, TrendingDown } from "lucide-react";

const REASON_COLORS: Record<string, string> = {
  price: "#ef4444",
  scope: "#f97316",
  timeline: "#eab308",
  other: "#6b7280",
};

export function FeedbackAnalyticsWidget() {
  const { data: analytics, isLoading } = trpc.feedback.getAnalytics.useQuery();

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading analytics...</div>;
  }

  if (!analytics || analytics.totalDeclined === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No declined proposals yet. Feedback will appear here.
      </div>
    );
  }

  const feedbackRate = analytics.totalDeclined > 0 
    ? Math.round((analytics.feedbackReceived / analytics.totalDeclined) * 100)
    : 0;

  const reasonData = Object.entries(analytics.reasonBreakdown).map(([reason, count]) => ({
    name: reason.charAt(0).toUpperCase() + reason.slice(1),
    value: count,
  }));

  return (
    <div className="space-y-4">
      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground mb-1">Total Declined</div>
          <div className="text-2xl font-bold">{analytics.totalDeclined}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground mb-1">Feedback Received</div>
          <div className="text-2xl font-bold">{analytics.feedbackReceived}</div>
          <div className="text-xs text-muted-foreground mt-1">{feedbackRate}% response rate</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
            <Star className="w-3 h-3" /> Avg Rating
          </div>
          <div className="text-2xl font-bold">{analytics.averageRating.toFixed(1)}</div>
        </Card>
      </div>

      {/* Decline Reasons Chart */}
      {reasonData.length > 0 && (
        <Card className="p-4">
          <h4 className="font-semibold text-sm mb-4">Why Clients Declined</h4>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={reasonData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {reasonData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={REASON_COLORS[entry.name.toLowerCase()] || "#6b7280"} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Insights */}
      <Card className="p-4 bg-amber-50 border-amber-200">
        <div className="flex gap-2">
          <TrendingDown className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <div className="font-semibold text-amber-900 mb-1">Insights</div>
            {reasonData.length > 0 && (
              <div className="text-amber-800 text-xs space-y-1">
                <div>
                  Most common reason: <strong>{reasonData[0].name}</strong> ({reasonData[0].value} mentions)
                </div>
                <div>
                  Consider adjusting your {reasonData[0].name.toLowerCase()} to improve acceptance rates.
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
