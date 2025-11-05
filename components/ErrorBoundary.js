'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import Button from './ui/Button';

/**
 * Error Boundary Component
 * Catches React errors and prevents full page crashes
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });

    // You can also log the error to an error reporting service
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // Optionally reload the page or reset state
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      // Render custom fallback UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <span className="text-2xl">⚠️</span>
                Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                {this.props.message ||
                  'An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.'}
              </p>

              {this.props.showDetails && this.state.error && (
                <details className="mb-4">
                  <summary className="cursor-pointer text-sm font-medium mb-2">
                    Error Details
                  </summary>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs">
                    {this.state.error.toString()}
                    {this.state.errorInfo && (
                      <>
                        {'\n\n'}
                        {this.state.errorInfo.componentStack}
                      </>
                    )}
                  </pre>
                </details>
              )}

              <div className="flex gap-2">
                <Button onClick={this.handleReset} variant="primary">
                  Try Again
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                >
                  Reload Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

/**
 * Permission Error Component
 * Shows user-friendly message when access is denied
 */
export function PermissionError({ feature, table, requirements, onDismiss }) {
  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <span className="text-2xl">🔒</span>
          Permission Required
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4">
          <strong>{feature}</strong> requires access to{' '}
          <code className="bg-orange-100 px-2 py-1 rounded text-sm">
            {table}
          </code>
          .
        </p>

        {requirements && (
          <div className="bg-white border border-orange-200 rounded-lg p-4 mb-4">
            <h4 className="font-medium mb-2">Required Permission:</h4>
            <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
              GRANT {requirements.grant} TO {'{user}'}
            </pre>

            {requirements.description && (
              <p className="text-sm text-muted-foreground mt-3">
                {requirements.description}
              </p>
            )}

            {requirements.documentation && (
              <a
                href={requirements.documentation}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 mt-2 inline-block"
              >
                Learn more about permissions →
              </a>
            )}
          </div>
        )}

        <div className="flex gap-2">
          {onDismiss && (
            <Button onClick={onDismiss} variant="outline" size="sm">
              Dismiss
            </Button>
          )}
          <Button
            onClick={() => window.location.reload()}
            variant="primary"
            size="sm"
          >
            Retry After Granting Permission
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Quota Exceeded Error Component
 * Shows user-friendly message when quota is exceeded
 */
export function QuotaExceededError({ quotaInfo, retryAfter, onRetry }) {
  const [countdown, setCountdown] = React.useState(retryAfter || 60);

  React.useEffect(() => {
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-800">
          <span className="text-2xl">⏱️</span>
          Query Quota Exceeded
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4">
          You have exceeded your query quota. This limit helps protect the
          ClickHouse server from overload.
        </p>

        {quotaInfo && quotaInfo.metric && (
          <div className="bg-white border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Quota Usage:</span>
              <span className="text-sm text-muted-foreground">
                {quotaInfo.metric}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-yellow-600 h-2 rounded-full"
                style={{
                  width: `${Math.min(
                    100,
                    (quotaInfo.current / quotaInfo.limit) * 100
                  )}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span>
                {quotaInfo.current} / {quotaInfo.limit}
              </span>
              <span className="text-red-600">Limit Exceeded</span>
            </div>
          </div>
        )}

        <div className="bg-white border border-yellow-200 rounded-lg p-4 mb-4">
          <h4 className="font-medium mb-2">What you can do:</h4>
          <ul className="list-disc list-inside text-sm space-y-1">
            <li>Wait for the quota to reset (countdown below)</li>
            <li>Contact your administrator to increase quota limits</li>
            <li>Reduce the frequency of queries or use filters to limit results</li>
            <li>Use cached data when available</li>
          </ul>
        </div>

        <div className="flex items-center gap-4">
          <Button
            onClick={onRetry}
            variant="primary"
            disabled={countdown > 0}
          >
            {countdown > 0
              ? `Retry in ${countdown}s`
              : 'Retry Now'}
          </Button>
          {countdown > 0 && (
            <span className="text-sm text-muted-foreground">
              Quota resets in {countdown} seconds
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Feature Unavailable Component
 * Shows when a feature is disabled due to permissions
 */
export function FeatureUnavailable({ feature, reason, learnMoreUrl }) {
  return (
    <div className="text-center py-12 px-4">
      <div className="text-6xl mb-4">🚫</div>
      <h3 className="text-xl font-semibold mb-2">{feature} Unavailable</h3>
      <p className="text-muted-foreground mb-4 max-w-md mx-auto">
        {reason ||
          'This feature is currently unavailable due to insufficient permissions or system configuration.'}
      </p>
      {learnMoreUrl && (
        <a
          href={learnMoreUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          Learn more →
        </a>
      )}
    </div>
  );
}
