import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { getRecommendationColor } from '@/utils/recommendations';

export default function RecommendationsPanel({ recommendations, title = 'Recommendations' }) {
  if (!recommendations || recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>💡</span>
            <span>{title}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-green-600">
            <span>✓</span>
            <span>Everything looks good! No recommendations at this time.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort by severity
  const sortedRecs = [...recommendations].sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2 };
    return order[a.type] - order[b.type];
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span>💡</span>
            <span>{title}</span>
          </span>
          <Badge variant="outline">
            {recommendations.length} {recommendations.length === 1 ? 'item' : 'items'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedRecs.map((rec, index) => (
            <RecommendationCard key={index} recommendation={rec} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function RecommendationCard({ recommendation }) {
  const colors = getRecommendationColor(recommendation.type);

  return (
    <div className={`border rounded-lg p-4 ${colors.bg} ${colors.border}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">{colors.icon}</span>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h4 className={`font-semibold ${colors.text}`}>
              {recommendation.title}
            </h4>
            {recommendation.category && (
              <Badge variant="outline" className="text-xs">
                {recommendation.category}
              </Badge>
            )}
          </div>

          <p className="text-sm mb-3">{recommendation.description}</p>

          {recommendation.impact && recommendation.effort && (
            <div className="flex gap-4 mb-3 text-xs">
              <div>
                <span className="text-muted-foreground">Impact:</span>{' '}
                <Badge
                  variant={recommendation.impact === 'High' ? 'danger' : recommendation.impact === 'Medium' ? 'warning' : 'info'}
                  className="text-xs"
                >
                  {recommendation.impact}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Effort:</span>{' '}
                <Badge variant="outline" className="text-xs">
                  {recommendation.effort}
                </Badge>
              </div>
              {recommendation.queries && (
                <div>
                  <span className="text-muted-foreground">Affected Queries:</span>{' '}
                  <Badge variant="secondary" className="text-xs">
                    {recommendation.queries}
                  </Badge>
                </div>
              )}
            </div>
          )}

          {recommendation.recommendations && recommendation.recommendations.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Suggested Actions:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {recommendation.recommendations.map((action, i) => (
                  <li key={i} className="text-muted-foreground">{action}</li>
                ))}
              </ul>
            </div>
          )}

          {recommendation.suggestion && (
            <p className="text-sm text-muted-foreground mt-2 italic">
              💡 {recommendation.suggestion}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
