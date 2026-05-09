'use client';

import React from 'react';

export default function AutomationPage() {
  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Automation Builder</h1>
        <p style={{ color: 'var(--text-muted)' }}>Configure your enterprise chatbot and message flows.</p>
      </header>

      <div className="glass-card" style={{ padding: '60px', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '24px' }}>🤖</div>
        <h2 style={{ marginBottom: '12px' }}>Flow Builder Coming Soon</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '500px', margin: '0 auto' }}>
          The visual drag-and-drop flow builder is being prepared for production. 
          Currently, the system uses the seeded enterprise flows.
        </p>
      </div>
    </div>
  );
}
