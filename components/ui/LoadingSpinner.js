export default function LoadingSpinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`${sizes[size]} animate-spin rounded-full border-4 border-gray-300 border-t-primary`}
      />
    </div>
  );
}

export function LoadingOverlay({ message = 'Loading...' }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

export function LoadingSkeleton({ className = '' }) {
  return (
    <div className={`loading-shimmer rounded ${className}`} />
  );
}
