import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'WhatsApp Enterprise | Premium Automation',
  description: 'Enterprise-grade WhatsApp automation infrastructure for scaling your business.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning={true}>
        <div className="nav-sidebar">
          <Link href="/" style={{ textDecoration: 'none' }}>
            <h2 style={{ marginBottom: '40px', color: 'var(--primary)', letterSpacing: '1px' }}>KLB WHATSAPP</h2>
          </Link>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Link href="/" style={{ color: 'var(--text-main)', textDecoration: 'none', fontWeight: 500 }}>Dashboard</Link>
            <Link href="/sessions" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Sessions</Link>
            <Link href="/automation" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Automation</Link>
            <Link href="/analytics" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Analytics</Link>
          </nav>
        </div>
        <main className="main-content">
          {children}
        </main>
      </body>
    </html>
  );
}
