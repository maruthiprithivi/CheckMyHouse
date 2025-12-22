'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Folder,
  Search,
  Clock,
  Eye,
  GitFork,
  Home,
  Globe,
  Cloud
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/tables', label: 'Tables', icon: Folder },
  { href: '/query-analyzer', label: 'Query Analyzer', icon: Search },
  { href: '/slow-queries', label: 'Slow Queries', icon: Clock },
  { href: '/materialized-views', label: 'Materialized Views', icon: Eye },
  { href: '/lineage', label: 'Data Lineage', icon: GitFork },
];

export default function Navigation({ clusterInfo }) {
  const pathname = usePathname();

  return (
    <nav className="bg-card border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl text-foreground">
              <Home className="w-5 h-5" />
              <span>CheckMyHouse</span>
            </Link>

            <div className="flex gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-glow'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:shadow-glow-accent'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
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
                  <Globe className="w-4 h-4" />
                  <span>Cluster: {clusterInfo.defaultCluster}</span>
                </div>
              )}
              {clusterInfo.isCloud && (
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full">
                  <Cloud className="w-4 h-4" />
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
