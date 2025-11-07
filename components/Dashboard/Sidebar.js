'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  Table2,
  Search,
  Clock,
  Eye,
  GitBranch,
  Activity,
  Database,
  Menu,
  X,
  LogOut,
  Server,
  Cloud,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/tables', label: 'Tables', icon: Table2 },
  { href: '/query-analyzer', label: 'Query Analyzer', icon: Search },
  { href: '/slow-queries', label: 'Slow Queries', icon: Clock },
  { href: '/materialized-views', label: 'Materialized Views', icon: Eye },
  { href: '/lineage', label: 'Data Lineage', icon: GitBranch },
  { href: '/monitoring', label: 'Monitoring', icon: Activity },
];

export default function Sidebar({ clusterInfo, onDisconnect }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-sidebar text-sidebar-foreground shadow-lg hover:bg-sidebar/90 transition-colors"
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen w-64 bg-sidebar border-r border-sidebar-border z-40 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-sidebar-border">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 group"
              onClick={() => setIsOpen(false)}
            >
              <div className="p-2 rounded-lg bg-gradient-primary">
                <Database className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-sidebar-foreground group-hover:text-primary transition-colors">
                  CheckMyHouse
                </h1>
                <p className="text-xs text-muted-foreground">
                  ClickHouse Explorer
                </p>
              </div>
            </Link>
          </div>

          {/* Cluster Info */}
          {clusterInfo && (
            <div className="px-4 py-3 border-b border-sidebar-border">
              <div className="space-y-2">
                {clusterInfo.isClustered && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-success/10 text-success rounded-lg text-xs font-medium border border-success/20">
                    <Server size={14} />
                    <span>{clusterInfo.defaultCluster}</span>
                  </div>
                )}
                {clusterInfo.isCloud && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-info text-white rounded-lg text-xs font-medium">
                    <Cloud size={14} />
                    <span>ClickHouse Cloud</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            <div className="px-3 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                      isActive
                        ? 'nav-active-indicator bg-primary/10 text-primary'
                        : 'text-sidebar-foreground hover:bg-sidebar-foreground/5 hover:text-primary'
                    }`}
                  >
                    <Icon
                      size={20}
                      className={`transition-transform duration-200 ${
                        isActive ? '' : 'group-hover:scale-110'
                      }`}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Footer - Disconnect Button */}
          <div className="p-4 border-t border-sidebar-border">
            <button
              onClick={() => {
                onDisconnect();
                setIsOpen(false);
              }}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200 group"
            >
              <LogOut
                size={20}
                className="transition-transform duration-200 group-hover:scale-110"
              />
              <span>Disconnect</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Spacer for desktop to prevent content overlap */}
      <div className="hidden lg:block w-64 flex-shrink-0" />
    </>
  );
}
