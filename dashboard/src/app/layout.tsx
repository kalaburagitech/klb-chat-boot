import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'WhatsApp Enterprise | Premium Automation',
  description: 'Enterprise-grade WhatsApp automation infrastructure for scaling your business.',
};

import Sidebar from '@/components/Sidebar';
import ConvexClientProvider from '@/components/ConvexClientProvider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning={true}>
        <ConvexClientProvider>
          <Sidebar />
          <main className="main-content">
            {children}
          </main>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
