import type { Metadata } from 'next';
import './globals.css';
import { AppLayoutWrapper } from '@/components/layout/app-layout-wrapper';
import { ToastProvider } from '@/components/ui/toast';

export const metadata: Metadata = {
  title: 'Q Delta CRM — Agency Internal Operations',
  description: 'Internal CRM and operations platform for Q Delta Agency',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 min-h-screen antialiased selection:bg-zinc-800 selection:text-white">
        <ToastProvider>
          <AppLayoutWrapper>{children}</AppLayoutWrapper>
        </ToastProvider>
      </body>
    </html>
  );
}
