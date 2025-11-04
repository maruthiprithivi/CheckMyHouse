'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function ConnectionForm({ onConnect }) {
  const [config, setConfig] = useState({
    host: 'http://localhost:8123',
    username: 'default',
    password: '',
    database: 'default',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/clickhouse/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect');
      }

      onConnect(config, data.clusterConfig);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="text-4xl">🏠</div>
            <div>
              <CardTitle>CheckMyHouse</CardTitle>
              <CardDescription>ClickHouse Database Explorer</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Host URL
              </label>
              <Input
                type="text"
                value={config.host}
                onChange={(e) => handleChange('host', e.target.value)}
                placeholder="http://localhost:8123"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                ClickHouse HTTP interface URL
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Username
              </label>
              <Input
                type="text"
                value={config.username}
                onChange={(e) => handleChange('username', e.target.value)}
                placeholder="default"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Password
              </label>
              <Input
                type="password"
                value={config.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="Enter password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Database
              </label>
              <Input
                type="text"
                value={config.database}
                onChange={(e) => handleChange('database', e.target.value)}
                placeholder="default"
                required
              />
            </div>

            {error && (
              <div className="p-3 rounded-md bg-red-50 border border-red-200">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  <span>Connecting...</span>
                </div>
              ) : (
                'Connect to ClickHouse'
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t">
            <p className="text-xs text-muted-foreground">
              <strong>Note:</strong> Your connection details are stored locally in your browser
              and never sent to external servers.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
