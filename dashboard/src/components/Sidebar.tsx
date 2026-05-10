'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/', icon: '📊' },
    { name: 'Sessions', href: '/sessions', icon: '📱' },
    { name: 'Automation', href: '/automation', icon: '🤖' },
    { name: 'Analytics', href: '/analytics', icon: '📈' },
  ];

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Mobile Header / Hamburger */}
      <div className="mobile-header">
        <button className="hamburger-btn" onClick={toggleSidebar}>
          <div className={`bar ${isOpen ? 'open' : ''}`}></div>
          <div className={`bar ${isOpen ? 'open' : ''}`}></div>
          <div className={`bar ${isOpen ? 'open' : ''}`}></div>
        </button>
        <h2 className="mobile-logo">KLB WHATSAPP</h2>
      </div>

      {/* Overlay for mobile */}
      {isOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}

      {/* Sidebar */}
      <aside className={`nav-sidebar ${isOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-logo">
          <Link href="/" onClick={() => setIsOpen(false)} style={{ textDecoration: 'none' }}>
            <h2 style={{ color: 'var(--primary)', letterSpacing: '1px', margin: 0 }}>KLB WHATSAPP</h2>
          </Link>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>ENTERPRISE CLOUD</p>
        </div>

        <nav className="nav-links">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href} 
                onClick={() => setIsOpen(false)}
                className={`nav-link ${isActive ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="avatar">AD</div>
            <div className="user-info">
              <p className="user-name">Admin User</p>
              <p className="user-status">System Online</p>
            </div>
          </div>
        </div>
      </aside>

      <style jsx>{`
        .mobile-header {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 64px;
          background: rgba(15, 23, 42, 0.9);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border);
          padding: 0 20px;
          align-items: center;
          z-index: 999;
        }

        .mobile-logo {
          color: var(--primary);
          font-size: 1.25rem;
          margin-left: 16px;
        }

        .hamburger-btn {
          width: 32px;
          height: 32px;
          display: flex;
          flex-direction: column;
          justify-content: space-around;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 4px;
        }

        .bar {
          width: 100%;
          height: 2px;
          background: var(--text-main);
          transition: all 0.3s ease;
          border-radius: 2px;
        }

        .bar.open:nth-child(1) { transform: translateY(8px) rotate(45deg); }
        .bar.open:nth-child(2) { opacity: 0; }
        .bar.open:nth-child(3) { transform: translateY(-8px) rotate(-45deg); }

        .nav-sidebar {
          width: 280px;
          height: 100vh;
          position: fixed;
          left: 0;
          top: 0;
          background: rgba(15, 23, 42, 0.95);
          border-right: 1px solid var(--border);
          padding: 32px 20px;
          display: flex;
          flex-direction: column;
          z-index: 1000;
          transition: transform 0.3s ease;
        }

        .sidebar-logo {
          margin-bottom: 48px;
          padding: 0 12px;
        }

        .nav-links {
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          color: var(--text-muted);
          text-decoration: none;
          border-radius: 10px;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .nav-link:hover {
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-main);
        }

        .nav-link.active {
          background: rgba(0, 168, 132, 0.1);
          color: var(--primary);
        }

        .nav-icon {
          font-size: 1.25rem;
        }

        .sidebar-footer {
          padding-top: 24px;
          border-top: 1px solid var(--border);
        }

        .user-profile {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 12px;
        }

        .avatar {
          width: 36px;
          height: 36px;
          background: var(--primary);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.875rem;
        }

        .user-name {
          font-size: 0.875rem;
          font-weight: 600;
          margin: 0;
        }

        .user-status {
          font-size: 0.75rem;
          color: #4ade80;
          margin: 2px 0 0;
        }

        .sidebar-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          z-index: 998;
        }

        @media (max-width: 1024px) {
          .mobile-header {
            display: flex;
          }
          .nav-sidebar {
            transform: translateX(-100%);
          }
          .nav-sidebar.mobile-open {
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
}
