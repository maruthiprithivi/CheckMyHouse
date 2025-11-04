import { generateQueryInsights } from '@/utils/performanceIndicators';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export default function InsightsPanel({ queryData }) {
  const insights = generateQueryInsights(queryData);

  if (insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>💡</span>
            <span>Insights</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-green-600">
            <span>✓</span>
            <span>No performance issues detected</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>💡</span>
          <span>Performance Insights</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.map((insight, index) => (
            <InsightItem key={index} insight={insight} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function InsightItem({ insight }) {
  const severityColors = {
    critical: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const severityIcons = {
    critical: '🔴',
    warning: '⚠️',
    info: 'ℹ️',
  };

  return (
    <div className={`border rounded-lg p-4 ${severityColors[insight.severity]}`}>
      <div className="flex items-start gap-2 mb-2">
        <span className="text-lg">{severityIcons[insight.severity]}</span>
        <div className="flex-1">
          <h4 className="font-semibold mb-1">{insight.category}</h4>
          <p className="text-sm mb-3">{insight.message}</p>

          {insight.recommendations && insight.recommendations.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-1">Recommendations:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {insight.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
