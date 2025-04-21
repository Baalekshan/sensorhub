import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ApolloProviderWrapper } from '@/components/providers/apollo-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { AuthProvider } from '@/context/auth-context';
import { Toaster } from "@/components/ui/toaster";
import { ToastNotificationsProvider } from '@/hooks/use-toast-notifications';
import { ToastNotifications } from '@/components/ui/toast-notifications';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SensorHub - IoT Management Platform',
  description: 'Manage and monitor your IoT devices with ease',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ToastNotificationsProvider>
          <ApolloProviderWrapper>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <AuthProvider>
                {children}
                <ToastNotifications />
              </AuthProvider>
            </ThemeProvider>
          </ApolloProviderWrapper>
        </ToastNotificationsProvider>
      </body>
    </html>
  );
}