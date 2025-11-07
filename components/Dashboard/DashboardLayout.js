'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function DashboardLayout({ children, title, description, icon: Icon }) {
  const router = useRouter();
  const [clusterConfig, setClusterConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const config = localStorage.getItem('clickhouse_config');
    if (!config) {
      router.push('/');
      return;
    }

    const cluster = localStorage.getItem('cluster_config');
    if (cluster) {
      setClusterConfig(JSON.parse(cluster));
    }

    setLoading(false);
  }, [router]);

  const handleDisconnect = () => {
    localStorage.removeItem('clickhouse_config');
    localStorage.removeItem('cluster_config');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar clusterInfo={clusterConfig} onDisconnect={handleDisconnect} />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar clusterInfo={clusterConfig} onDisconnect={handleDisconnect} />

      <main className="flex-1 overflow-auto">
        {/* Hero Section */}
        <div className="gradient-hero text-white py-12 px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              {Icon && (
                <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                  <Icon size={24} />
                </div>
              )}
              <h1 className="text-4xl font-bold">{title}</h1>
            </div>
            {description && (
              <p className="text-white/90 text-lg max-w-2xl">{description}</p>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
