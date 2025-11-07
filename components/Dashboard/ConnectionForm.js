'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';
import { Database, Server, User, Lock, Sparkles } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const ThreeBackground = dynamic(() => import('@/components/ui/ThreeBackground'), {
  ssr: false,
  loading: () => null,
});

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

    const connectingToast = toast.loading('Connecting to ClickHouse...');

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

      // Connection successful - credentials now stored securely in httpOnly cookies
      toast.success('Connected successfully!', { id: connectingToast });
      onConnect();
    } catch (err) {
      setError(err.message);
      toast.error(err.message, { id: connectingToast });
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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <ThreeBackground />

      <div className="w-full max-w-md z-10 animate-fade-in">
        <Card className="backdrop-blur-xl bg-card/95 shadow-2xl border-2">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-2xl bg-gradient-primary shadow-colored">
                <Database className="text-white" size={40} />
              </div>
            </div>
            <CardTitle className="text-3xl bg-gradient-primary bg-clip-text text-transparent">
              CheckMyHouse
            </CardTitle>
            <CardDescription className="text-base">
              ClickHouse Database Explorer
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold mb-2">
                  <Server size={16} className="text-primary" />
                  Host URL
                </label>
                <Input
                  type="text"
                  value={config.host}
                  onChange={(e) => handleChange('host', e.target.value)}
                  placeholder="http://localhost:8123"
                  required
                  error={error && error.includes('host')}
                />
                <p className="text-xs text-muted-foreground mt-1.5 ml-1">
                  ClickHouse HTTP interface URL
                </p>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold mb-2">
                  <User size={16} className="text-primary" />
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
                <label className="flex items-center gap-2 text-sm font-semibold mb-2">
                  <Lock size={16} className="text-primary" />
                  Password
                </label>
                <Input
                  type="password"
                  value={config.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder="Enter password (optional)"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold mb-2">
                  <Database size={16} className="text-primary" />
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
                <div className="p-4 rounded-lg bg-destructive/10 border-2 border-destructive/20 animate-fade-in">
                  <p className="text-sm text-destructive font-medium">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                variant="gradient"
                size="lg"
                className="w-full"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>Connect to ClickHouse</span>
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-border/50">
              <div className="flex items-start gap-2">
                <div className="p-1 rounded bg-primary/10">
                  <Lock size={12} className="text-primary" />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Secure:</strong> Your connection details are stored locally in your browser
                  and never sent to external servers.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
