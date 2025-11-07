'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ConnectionForm from '@/components/Dashboard/ConnectionForm';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check if already connected via secure cookies
    async function checkAuth() {
      try {
        const response = await fetch('/api/clickhouse/check-auth');
        if (response.ok) {
          router.push('/dashboard');
        } else {
          setChecking(false);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setChecking(false);
      }
    }
    checkAuth();
  }, [router]);

  const handleConnect = () => {
    // Connection config is now stored securely in httpOnly cookies by the API
    // No need to store in localStorage anymore
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
