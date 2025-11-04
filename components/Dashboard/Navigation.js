'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/tables', label: 'Tables', icon: '📁' },
  { href: '/query-analyzer', label: 'Query Analyzer', icon: '🔍' },
  { href: '/slow-queries', label: 'Slow Queries', icon: '🐌' },
  { href: '/materialized-views', label: 'Materialized Views', icon: '👁️' },
  { href: '/lineage', label: 'Data Lineage', icon: '🔗' },
];

export default function Navigation({ clusterInfo }) {
  const pathname = usePathname();

  return (
    <nav className="bg-white border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl">
              <span>🏠</span>
              <span>CheckMyHouse</span>
            </Link>

            <div className="flex gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {clusterInfo && (
            <div className="flex items-center gap-3 text-sm">
              {clusterInfo.isClustered && (
                <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full">
                  <span>🌐</span>
                  <span>Cluster: {clusterInfo.defaultCluster}</span>
                </div>
              )}
              {clusterInfo.isCloud && (
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full">
                  <span>☁️</span>
                  <span>ClickHouse Cloud</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
