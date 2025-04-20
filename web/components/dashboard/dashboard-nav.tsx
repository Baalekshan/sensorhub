"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Dices as DevicesMobile, Activity, History, Bell, Settings, FileText, Sliders } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

interface DashboardNavProps {
  isMobile?: boolean;
  onNavItemClick?: () => void;
}

export function DashboardNav({ isMobile = false, onNavItemClick }: DashboardNavProps) {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    {
      title: 'Overview',
      href: '/dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      title: 'Devices',
      href: '/dashboard/devices',
      icon: <DevicesMobile className="h-5 w-5" />,
    },
    {
      title: 'Live Data',
      href: '/dashboard/live-data',
      icon: <Activity className="h-5 w-5" />,
    },
    {
      title: 'History',
      href: '/dashboard/history',
      icon: <History className="h-5 w-5" />,
    },
    {
      title: 'Alerts',
      href: '/dashboard/alerts',
      icon: <Bell className="h-5 w-5" />,
    },
    {
      title: 'Calibration',
      href: '/dashboard/calibration',
      icon: <Sliders className="h-5 w-5" />,
    },
    {
      title: 'API Access',
      href: '/dashboard/api',
      icon: <FileText className="h-5 w-5" />,
    },
    {
      title: 'Settings',
      href: '/dashboard/settings',
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  if (isMobile) {
    return (
      <nav className="grid gap-2 p-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavItemClick}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:text-primary",
              pathname === item.href ? "bg-muted font-medium text-primary" : "text-muted-foreground"
            )}
          >
            {item.icon}
            {item.title}
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <div className="hidden border-r bg-background md:block">
      <div className="space-y-4 py-4">
        <div className="px-4 py-2">
          <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">
            Dashboard
          </h2>
          <div className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:text-primary",
                  pathname === item.href ? "bg-muted font-medium text-primary" : "text-muted-foreground"
                )}
              >
                {item.icon}
                {item.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}