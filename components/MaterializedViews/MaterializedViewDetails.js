'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { formatBytes, formatNumber } from '@/utils/formatters';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import sql from 'react-syntax-highlighter/dist/esm/languages/hljs/sql';
import { github } from 'react-syntax-highlighter/dist/esm/styles/hljs';

SyntaxHighlighter.registerLanguage('sql', sql);

export default function MaterializedViewDetails({ view }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl mb-2 flex items-center gap-3">
                <span className="text-3xl">👁️</span>
                {view.database}.{view.name}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="info">{view.engine}</Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatItem label="Total Rows" value={formatNumber(view.total_rows)} icon="📊" />
            <StatItem label="Total Size" value={formatBytes(view.total_bytes)} icon="💾" />
            <StatItem label="Source Tables" value={view.sources?.length || 0} icon="📥" />
            <StatItem label="Downstream Tables" value={view.targets?.length || 0} icon="📤" />
          </div>
        </CardContent>
      </Card>

      {/* Data Flow */}
      <Card>
        <CardHeader>
          <CardTitle>Data Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-4 p-6">
            {/* Sources */}
            <div className="flex-1">
              <div className="text-sm font-medium mb-3 text-center">Source Tables</div>
              <div className="space-y-2">
                {view.sources && view.sources.length > 0 ? (
                  view.sources.map((src, i) => (
                    <div
                      key={i}
                      className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center"
                    >
                      <div className="font-mono text-sm font-medium text-blue-900">
                        {src.database}.{src.table}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground text-center">
                    No source tables
                  </div>
                )}
              </div>
            </div>

            {/* Arrow */}
            <div className="flex flex-col items-center gap-2">
              <div className="text-4xl">→</div>
              <div className="text-xs text-muted-foreground">Transform</div>
            </div>

            {/* Materialized View */}
            <div className="flex-1">
              <div className="text-sm font-medium mb-3 text-center">Materialized View</div>
              <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">👁️</div>
                <div className="font-mono text-sm font-medium text-purple-900">
                  {view.database}.{view.name}
                </div>
                <div className="text-xs text-purple-600 mt-1">
                  {formatNumber(view.total_rows)} rows
                </div>
              </div>
            </div>

            {/* Arrow */}
            {view.targets && view.targets.length > 0 && (
              <>
                <div className="text-4xl">→</div>

                {/* Targets */}
                <div className="flex-1">
                  <div className="text-sm font-medium mb-3 text-center">Downstream Tables</div>
                  <div className="space-y-2">
                    {view.targets.map((tgt, i) => (
                      <div
                        key={i}
                        className="bg-green-50 border border-green-200 rounded-lg p-3 text-center"
                      >
                        <div className="font-mono text-sm font-medium text-green-900">
                          {tgt.database}.{tgt.table}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* CREATE Statement */}
      <Card>
        <CardHeader>
          <CardTitle>CREATE MATERIALIZED VIEW Statement</CardTitle>
        </CardHeader>
        <CardContent>
          <SyntaxHighlighter
            language="sql"
            style={github}
            customStyle={{
              padding: '1.5rem',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
            }}
          >
            {view.create_table_query}
          </SyntaxHighlighter>
        </CardContent>
      </Card>

      {/* SELECT Query */}
      {view.select_query && (
        <Card>
          <CardHeader>
            <CardTitle>Transformation Query</CardTitle>
          </CardHeader>
          <CardContent>
            <SyntaxHighlighter
              language="sql"
              style={github}
              customStyle={{
                padding: '1.5rem',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
              }}
            >
              {view.select_query}
            </SyntaxHighlighter>

            {/* Query Analysis */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              <AnalysisItem
                label="Has JOINs"
                value={view.select_query.includes('JOIN')}
              />
              <AnalysisItem
                label="Has Aggregations"
                value={view.select_query.includes('GROUP BY') || /sum\(|count\(|avg\(/i.test(view.select_query)}
              />
              <AnalysisItem
                label="Has Filters"
                value={view.select_query.includes('WHERE')}
              />
              <AnalysisItem
                label="Has Subqueries"
                value={view.select_query.split('SELECT').length > 2}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatItem({ label, value, icon }) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 mb-1">
        <span>{icon}</span>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function AnalysisItem({ label, value }) {
  return (
    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
      <span className="text-lg">{value ? '✅' : '❌'}</span>
      <span className="text-sm">{label}</span>
    </div>
  );
}
