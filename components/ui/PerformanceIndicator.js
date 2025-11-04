import { getPerformanceColor, getPerformanceEmoji } from '@/utils/performanceIndicators';

export default function PerformanceIndicator({ level, showLabel = false, size = 'md' }) {
  const colors = getPerformanceColor(level);
  const emoji = getPerformanceEmoji(level);

  const sizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className="inline-flex items-center gap-1">
      <span className={sizes[size]}>{emoji}</span>
      {showLabel && (
        <span className={`${colors.text} ${sizes[size]} font-medium capitalize`}>
          {level}
        </span>
      )}
    </div>
  );
}

export function PerformanceBadge({ level, children, className = '' }) {
  const colors = getPerformanceColor(level);
  const emoji = getPerformanceEmoji(level);

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${colors.bg} ${colors.text} ${colors.border} border ${className}`}
    >
      <span>{emoji}</span>
      {children}
    </span>
  );
}
