'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ConnectionForm from '@/components/Dashboard/ConnectionForm';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check if already connected
    const config = localStorage.getItem('clickhouse_config');
    if (config) {
      router.push('/dashboard');
    } else {
      setChecking(false);
    }
  }, [router]);

  const handleConnect = (config, clusterConfig) => {
    // Store connection config in localStorage
    localStorage.setItem('clickhouse_config', JSON.stringify(config));
    localStorage.setItem('cluster_config', JSON.stringify(clusterConfig));

    // Redirect to dashboard
    router.push('/dashboard');
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return <ConnectionForm onConnect={handleConnect} />;
}
