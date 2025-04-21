'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/lib/api/auth.service';
import { useToastNotifications } from '@/hooks/use-toast-notifications';
import {
  LayoutGrid,
  Server,
  Cpu,
  BarChart,
  Bell,
  Package,
  Settings,
  LogOut,
  Menu,
  User,
  X
} from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { error } = useToastNotifications();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setLoading(true);
      const currentUser = await authService.getCurrentUser();
      
      if (!currentUser) {
        router.push('/login');
        return;
      }
      
      setUser(currentUser);
    } catch (err) {
      error('Authentication Error', 'Please sign in to continue');
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      router.push('/login');
    } catch (err) {
      error('Logout Failed', 'An error occurred while logging out');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutGrid className="mr-2 h-4 w-4" /> },
    { name: 'Devices', path: '/devices', icon: <Server className="mr-2 h-4 w-4" /> },
    { name: 'Sensors', path: '/sensors', icon: <Cpu className="mr-2 h-4 w-4" /> },
    { name: 'OTA Updates', path: '/ota', icon: <Package className="mr-2 h-4 w-4" /> },
    { name: 'Analytics', path: '/analytics', icon: <BarChart className="mr-2 h-4 w-4" /> },
    { name: 'Alerts', path: '/alerts', icon: <Bell className="mr-2 h-4 w-4" /> },
    { name: 'Settings', path: '/settings', icon: <Settings className="mr-2 h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navbar */}
      <div className="bg-primary text-primary-foreground sticky top-0 z-50 w-full border-b shadow-sm">
        <div className="flex h-16 items-center px-4">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="md:hidden mr-2"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="font-bold text-xl">SensorHub</div>
          <div className="ml-auto flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>{user?.name}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center text-red-500"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Sidebar - Mobile */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)}></div>
            <div className="fixed left-0 top-0 bottom-0 w-64 bg-card shadow-lg">
              <div className="flex items-center justify-between p-4 border-b">
                <div className="font-bold text-xl">SensorHub</div>
                <button onClick={() => setSidebarOpen(false)}>
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex flex-col p-4 space-y-1">
                {menuItems.map((item) => (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`flex items-center px-4 py-2 rounded-md hover:bg-muted ${
                      pathname === item.path ? 'bg-muted font-medium' : ''
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        )}

        {/* Sidebar - Desktop */}
        <div className="hidden md:flex flex-col bg-card w-64 border-r shadow-sm">
          <nav className="flex flex-col p-4 space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center px-4 py-2 rounded-md hover:bg-muted ${
                  pathname === item.path ? 'bg-muted font-medium' : ''
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <main className="p-6">{children}</main>
        </div>
      </div>
    </div>
  );
} 