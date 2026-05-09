'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global Application Error:', error);
  }, [error]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      textAlign: 'center',
      padding: '20px',
      background: 'var(--bg)',
      color: 'var(--text-main)'
    }}>
      <div className="glass-card" style={{ maxWidth: '500px', width: '100%' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '16px', color: '#ef4444' }}>Something went wrong!</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
          An unexpected error occurred in the application. We've logged the details and are working on it.
        </p>
        <div style={{ 
          background: 'rgba(0,0,0,0.2)', 
          padding: '12px', 
          borderRadius: '8px', 
          marginBottom: '24px',
          textAlign: 'left',
          fontSize: '0.8rem',
          fontFamily: 'monospace',
          overflowX: 'auto'
        }}>
          {error.message}
        </div>
        <button
          className="btn-primary"
          onClick={() => reset()}
          style={{ width: '100%' }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
