'use client';

import React, { useState, useEffect } from 'react';
import Badge from './Badge';

/**
 * Capability Indicator Component
 * Shows which features are available based on permissions
 */
export default function CapabilityIndicator({ capabilities }) {
  const [showDetails, setShowDetails] = useState(false);

  if (!capabilities) return null;

  const features = [
    {
      name: 'Query Analyzer',
      available: capabilities.hasQueryLog,
      requirement: 'system.query_log',
    },
    {
      name: 'Slow Queries',
      available: capabilities.hasQueryLog,
      requirement: 'system.query_log',
    },
    {
      name: 'Table Statistics',
      available: capabilities.hasParts,
      requirement: 'system.parts',
    },
    {
      name: 'Cluster Info',
      available: capabilities.hasClusters,
      requirement: 'system.clusters',
    },
    {
      name: 'Process Monitor',
      available: capabilities.hasProcesses,
      requirement: 'system.processes',
    },
  ];

  const availableCount = features.filter((f) => f.available).length;
  const totalCount = features.length;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full flex items-center justify-between text-sm hover:bg-gray-50 rounded px-2 py-1"
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">
            {availableCount === totalCount ? '✓' : '⚠️'}
          </span>
          <span className="font-medium">
            System Capabilities
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={availableCount === totalCount ? 'success' : 'warning'}
          >
            {availableCount}/{totalCount} Features
          </Badge>
          <span className="text-gray-400">{showDetails ? '▼' : '▶'}</span>
        </div>
      </button>

      {showDetails && (
        <div className="mt-3 space-y-2 border-t pt-3">
          {features.map((feature) => (
            <div
              key={feature.name}
              className="flex items-center justify-between text-sm py-1 px-2"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {feature.available ? '✓' : '✗'}
                </span>
                <span
                  className={
                    feature.available ? 'text-gray-900' : 'text-gray-400'
                  }
                >
                  {feature.name}
                </span>
              </div>
              <code className="text-xs text-gray-500">
                {feature.requirement}
              </code>
            </div>
          ))}

          <div className="mt-3 pt-2 border-t text-xs text-muted-foreground">
            Last checked: {new Date(capabilities.checkedAt).toLocaleTimeString()}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Feature Gate Component
 * Conditionally renders children based on capability
 */
export function FeatureGate({ capability, feature, children, fallback }) {
  if (!capability) {
    return fallback || (
      <div className="text-center py-8 text-muted-foreground">
        <div className="text-4xl mb-2">🔒</div>
        <p>
          {feature} is not available due to insufficient permissions.
        </p>
      </div>
    );
  }

  return children;
}

/**
 * Capability Banner Component
 * Shows a warning banner when features are limited
 */
export function CapabilityBanner({ capabilities }) {
  const [dismissed, setDismissed] = useState(false);

  if (!capabilities || dismissed) return null;

  const unavailableFeatures = [];
  if (!capabilities.hasQueryLog)
    unavailableFeatures.push('Query Analyzer');
  if (!capabilities.hasParts)
    unavailableFeatures.push('Table Statistics');
  if (!capabilities.hasClusters)
    unavailableFeatures.push('Cluster Info');
  if (!capabilities.hasProcesses)
    unavailableFeatures.push('Process Monitor');

  if (unavailableFeatures.length === 0) return null;

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <h4 className="font-semibold text-yellow-900 mb-1">
              Limited Access
            </h4>
            <p className="text-sm text-yellow-800 mb-2">
              Some features are unavailable due to insufficient permissions.
            </p>
            <details className="text-sm">
              <summary className="cursor-pointer text-yellow-700 hover:text-yellow-900">
                Show unavailable features
              </summary>
              <ul className="list-disc list-inside mt-2 space-y-1 text-yellow-700">
                {unavailableFeatures.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </details>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-yellow-600 hover:text-yellow-800"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
