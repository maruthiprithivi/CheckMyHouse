import { Card, CardContent } from '@/components/ui/Card';

export default function StatCard({ title, value, icon, description, trend, className = '' }) {
  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {icon && <span className="text-2xl">{icon}</span>}
        </div>
        <div className="flex items-baseline gap-2">
          <h3 className="text-3xl font-bold break-words max-w-full overflow-hidden text-ellipsis">{value}</h3>
          {trend && (
            <span className={`text-sm ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.value}
            </span>
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-2">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
