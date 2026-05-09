'use client';

import React from 'react';

export default function AnalyticsPage() {
  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Real-time Analytics</h1>
        <p style={{ color: 'var(--text-muted)' }}>Monitor performance and message volume across all sessions.</p>
      </header>

      <div className="glass-card" style={{ padding: '60px', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '24px' }}>📊</div>
        <h2 style={{ marginBottom: '12px' }}>Analytics Dashboard Coming Soon</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '500px', margin: '0 auto' }}>
          Detailed charts and conversion metrics are being integrated with the real-time message stream.
        </p>
      </div>
    </div>
  );
}
