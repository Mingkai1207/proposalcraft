import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, TrendingUp } from "lucide-react";

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-red-100 text-red-700 border-red-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-blue-100 text-blue-700 border-blue-200",
};

export function RecommendationsWidget() {
  const { data: result, isLoading } = trpc.recommendations.getOverallRecommendations.useQuery();

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading recommendations...</div>;
  }

  if (!result?.recommendations || result.recommendations.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No recommendations yet. Keep collecting feedback to get personalized insights.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {result.recommendations.map((rec, idx) => (
        <Card key={idx} className={`p-4 border-2 ${PRIORITY_COLORS[rec.priority]}`}>
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-sm">{rec.title}</h4>
                <Badge variant="outline" className="text-xs capitalize">
                  {rec.priority} priority
                </Badge>
              </div>
              <p className="text-sm opacity-90">{rec.description}</p>
              {rec.affectedCount > 0 && (
                <div className="flex items-center gap-1 mt-2 text-xs opacity-75">
                  <TrendingUp className="w-3 h-3" />
                  Affects {rec.affectedCount} proposal{rec.affectedCount !== 1 ? "s" : ""}
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
