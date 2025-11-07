import { Card, CardContent } from '@/components/ui/Card';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({ title, value, icon: Icon, description, trend, gradient, className = '' }) {
  return (
    <Card gradient={gradient} className={`group hover-lift ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">
              {title}
            </p>
          </div>
          {Icon && (
            <div className={`p-3 rounded-xl transition-all duration-300 ${gradient ? 'gradient-primary' : 'bg-primary/10'} group-hover:scale-110`}>
              <Icon className={gradient ? 'text-white' : 'text-primary'} size={24} />
            </div>
          )}
        </div>

        <div className="flex items-baseline gap-3 mb-2">
          <h3 className="text-4xl font-bold tracking-tight bg-gradient-primary bg-clip-text text-transparent">
            {value}
          </h3>
          {trend && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${
              trend.positive
                ? 'bg-success/10 text-success border border-success/20'
                : 'bg-destructive/10 text-destructive border border-destructive/20'
            }`}>
              {trend.positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              <span>{trend.value}</span>
            </div>
          )}
        </div>

        {description && (
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
