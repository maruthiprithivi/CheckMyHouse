import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Custom hook to check authentication and redirect if not authenticated
 * Authentication is now based on secure httpOnly cookies, not localStorage
 */
export function useRequireAuth() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch('/api/clickhouse/check-auth');
        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          router.push('/');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  return { isAuthenticated, isLoading };
}

/**
 * Hook to get current connection info without sensitive data
 */
export function useConnectionInfo() {
  const [connectionInfo, setConnectionInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchConnectionInfo() {
      try {
        const response = await fetch('/api/clickhouse/check-auth');
        if (response.ok) {
          const data = await response.json();
          setConnectionInfo({
            host: data.host,
            username: data.username,
            database: data.database,
          });
        }
      } catch (error) {
        console.error('Failed to fetch connection info:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchConnectionInfo();
  }, []);

  return { connectionInfo, isLoading };
}
