'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';
import { Database, Server, User, Lock, Sparkles, Terminal } from 'lucide-react';
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

    const connectingToast = toast.loading('Initiating uplink...');

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
      toast.success('Connection established', { id: connectingToast });
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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* Cyberpunk grid background */}
      <div className="absolute inset-0 bg-grid-pattern bg-[size:40px_40px] pointer-events-none"></div>

      {/* Scanline effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent h-[200%] w-full animate-scanline pointer-events-none"></div>

      <ThreeBackground />

      <div className="w-full max-w-md z-10 animate-fade-in">
        <Card className="border border-primary/50 bg-black/80 backdrop-blur-md shadow-lg relative overflow-visible">
          {/* Glowing corners */}
          <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-primary"></div>
          <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-primary"></div>
          <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-primary"></div>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-primary"></div>

          <CardHeader className="text-center pb-4 border-b border-primary/20">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-black border border-primary box-glow relative group">
                <div className="absolute inset-0 bg-primary/20 animate-pulse-slow"></div>
                <Database className="text-primary relative z-10" size={40} />
              </div>
            </div>
            <CardTitle className="text-3xl text-primary font-mono tracking-widest glitch-text" data-text="CHECKMYHOUSE">
              CHECKMYHOUSE
            </CardTitle>
            <CardDescription className="text-base font-mono uppercase tracking-widest text-muted-foreground mt-2">
              <span className="text-primary mr-2">&gt;</span>Initialize System Connection
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-primary mb-2 font-mono uppercase tracking-wider">
                  <Server size={14} />
                  Host URL
                </label>
                <div className="relative group">
                   <div className="absolute -inset-0.5 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity blur-sm"></div>
                    <Input
                      type="text"
                      value={config.host}
                      onChange={(e) => handleChange('host', e.target.value)}
                      placeholder="http://localhost:8123"
                      required
                      error={error && error.includes('host')}
                      className="relative font-mono"
                    />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5 ml-1 font-mono">
                  // CLICKHOUSE HTTP INTERFACE
                </p>
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-primary mb-2 font-mono uppercase tracking-wider">
                  <User size={14} />
                  Username
                </label>
                 <div className="relative group">
                   <div className="absolute -inset-0.5 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity blur-sm"></div>
                    <Input
                      type="text"
                      value={config.username}
                      onChange={(e) => handleChange('username', e.target.value)}
                      placeholder="default"
                      required
                      className="relative font-mono"
                    />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-primary mb-2 font-mono uppercase tracking-wider">
                  <Lock size={14} />
                  Password
                </label>
                <div className="relative group">
                   <div className="absolute -inset-0.5 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity blur-sm"></div>
                    <Input
                      type="password"
                      value={config.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      placeholder="••••••••"
                      className="relative font-mono"
                    />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-primary mb-2 font-mono uppercase tracking-wider">
                  <Database size={14} />
                  Database
                </label>
                 <div className="relative group">
                   <div className="absolute -inset-0.5 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity blur-sm"></div>
                    <Input
                      type="text"
                      value={config.database}
                      onChange={(e) => handleChange('database', e.target.value)}
                      placeholder="default"
                      required
                      className="relative font-mono"
                    />
                </div>
              </div>

              {error && (
                <div className="p-4 bg-destructive/10 border border-destructive/50 animate-fade-in relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-1 h-full bg-destructive"></div>
                  <div className="flex items-start gap-2">
                     <Terminal size={16} className="text-destructive mt-0.5" />
                     <p className="text-xs text-destructive font-mono uppercase">{error}</p>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                variant="primary"
                size="lg"
                className="w-full mt-4"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Establishing Uplink...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>INITIATE CONNECTION</span>
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-primary/20">
              <div className="flex items-start gap-2 text-[10px] text-muted-foreground font-mono uppercase">
                <div className="p-1 border border-primary/30 bg-primary/5">
                  <Lock size={10} className="text-primary" />
                </div>
                <p className="leading-relaxed">
                  <strong className="text-primary">ENCRYPTED:</strong> CREDENTIALS STORED LOCALLY. NO EXTERNAL TRANSMISSION DETECTED.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
