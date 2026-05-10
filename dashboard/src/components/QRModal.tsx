'use client';

import React, { useEffect, useState } from 'react';
import { getSocket } from '@/utils/socket';

interface QRModalProps {
  sessionId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function QRModal({ sessionId, isOpen, onClose }: QRModalProps) {
  const [qr, setQr] = useState<string | null>(null);
  const [status, setStatus] = useState<'LOADING' | 'QR' | 'WAITING_FOR_SCAN' | 'AUTHENTICATING' | 'CONNECTED' | 'FAILED'>('LOADING');
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    if (!isOpen) return;

    const socket = getSocket();
    socket.emit('join:org', 'klb-connect');
    setQr(null);
    setStatus('LOADING');

    // Trigger session initialization on backend
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4005'}/api/whatsapp/sessions/${sessionId}/init`, {
      method: 'POST'
    })
      .catch(err => console.error('Failed to trigger session init:', err));

    const handleQr = (data: { sessionId: string; qr: string }) => {
      if (data.sessionId === sessionId) {
        setQr(data.qr);
        setStatus('QR');
        setTimeLeft(60); // Reset timer on new QR
        setTimeout(() => setStatus('WAITING_FOR_SCAN'), 2000);
      }
    };

    const handleStatus = (data: { sessionId: string; status: string }) => {
      if (data.sessionId === sessionId) {
        if (data.status === 'READY') {
          setStatus('CONNECTED');
          setTimeout(onClose, 2000);
        } else if (data.status === 'AUTHENTICATED') {
          setStatus('AUTHENTICATING');
        } else if (data.status === 'FAILED') {
          setStatus('FAILED');
        }
      }
    };

    const handleAuth = (data: { sessionId: string }) => {
      if (data.sessionId === sessionId) {
        setStatus('AUTHENTICATING');
      }
    };

    socket.on('whatsapp:qr', handleQr);
    socket.on('whatsapp:status', handleStatus);
    socket.on('whatsapp:authenticated', handleAuth);

    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      socket.off('whatsapp:qr', handleQr);
      socket.off('whatsapp:status', handleStatus);
      socket.off('whatsapp:authenticated', handleAuth);
      clearInterval(timer);
    };
  }, [isOpen, sessionId, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="glass-card modal-content animate-fade-in" style={{ maxWidth: '450px', width: '100%', textAlign: 'center', padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ textAlign: 'left' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Link WhatsApp</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Scan QR code to start automation</p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
        </div>

        <div className="qr-box">
          {status === 'LOADING' && (
            <div className="loading-container">
              <div className="spinner"></div>
              <p style={{ marginTop: '20px', color: 'var(--text-muted)' }}>Initializing Secure Engine...</p>
            </div>
          )}

          {(status === 'QR' || status === 'WAITING_FOR_SCAN') && qr && (
            <div className="animate-fade-in">
              <div style={{ background: 'white', padding: '16px', borderRadius: '16px', display: 'inline-block', marginBottom: '24px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)' }}>
                <img src={qr} alt="WhatsApp QR" style={{ width: '256px', height: '256px', display: 'block' }} />
              </div>
              
              <div style={{ textAlign: 'left', background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '12px', marginBottom: '24px' }}>
                <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '0.875rem', lineHeight: '1.6', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  <li>Open <b>WhatsApp</b> on your phone</li>
                  <li>Tap <b>Menu</b> or <b>Settings</b> and select <b>Linked Devices</b></li>
                  <li>Tap on <b>Link a Device</b></li>
                  <li>Point your phone to this screen to capture the code</li>
                </ol>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Code expires in:</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: timeLeft < 10 ? '#ef4444' : 'var(--primary)' }}>
                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <span className={`status-dot ${status === 'WAITING_FOR_SCAN' ? 'pulse' : ''}`}></span>
                <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--primary)' }}>
                  {status === 'WAITING_FOR_SCAN' ? 'WAITING FOR SCAN...' : 'SYNCING WITH WHATSAPP...'}
                </p>
              </div>
            </div>
          )}

          {status === 'AUTHENTICATING' && (
            <div className="animate-fade-in" style={{ padding: '40px 0' }}>
              <div className="success-icon" style={{ background: '#34b7f1' }}>🔓</div>
              <h3 style={{ color: '#34b7f1', fontWeight: 700, fontSize: '1.5rem', marginTop: '16px' }}>Connected!</h3>
              <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Authenticating and preparing your dashboard...</p>
              <div className="spinner" style={{ marginTop: '24px', width: '24px', height: '24px', borderWidth: '2px' }}></div>
            </div>
          )}

          {status === 'CONNECTED' && (
            <div className="animate-fade-in" style={{ padding: '40px 0' }}>
              <div className="success-icon">✓</div>
              <h3 style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '1.5rem', marginTop: '16px' }}>Linked Successfully!</h3>
              <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Your enterprise session is now active.</p>
            </div>
          )}

          {status === 'FAILED' && (
            <div className="animate-fade-in" style={{ padding: '40px 0' }}>
              <div className="error-icon">!</div>
              <h3 style={{ color: '#ef4444', fontWeight: 700, fontSize: '1.5rem', marginTop: '16px' }}>Connection Failed</h3>
              <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Please try again or restart the backend.</p>
              <button onClick={() => window.location.reload()} className="btn-primary" style={{ marginTop: '24px' }}>Reload Page</button>
            </div>
          )}
        </div>

        <style jsx>{`
          .modal-overlay {
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.85);
            backdrop-filter: blur(12px);
            display: flex; justify-content: center; align-items: center;
            z-index: 1000;
          }
          .qr-box { min-height: 420px; display: flex; flex-direction: column; justify-content: center; align-items: center; }
          .spinner { width: 40px; height: 40px; border: 3px solid rgba(var(--primary-rgb), 0.1); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; }
          @keyframes spin { to { transform: rotate(360deg); } }
          .status-dot { width: 8px; height: 8px; background: var(--primary); border-radius: 50%; }
          .status-dot.pulse { animation: status-pulse 1.5s infinite; }
          @keyframes status-pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5); opacity: 0.5; } 100% { transform: scale(1); opacity: 1; } }
          .success-icon { width: 64px; height: 64px; background: var(--primary); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; margin: 0 auto; }
          .error-icon { width: 64px; height: 64px; background: #ef4444; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; margin: 0 auto; }
        `}</style>
      </div>
    </div>
  );
}
