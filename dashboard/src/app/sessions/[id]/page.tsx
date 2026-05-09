'use client';
import React, { useEffect, useState, use } from 'react';
import { getSocket } from '@/utils/socket';
import { QRCodeSVG } from 'qrcode.react';

export default function SessionDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [qr, setQr] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('INITIALIZING');
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const socket = getSocket();
    const sessionId = id;
    const orgId = 'klb-connect'; 
    socket.emit('join:org', orgId);

    // Fetch initial status
    const fetchStatus = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4005'}/api/whatsapp/sessions/klb-connect`);
        const sessions = await res.json();
        const session = sessions.find((s: any) => s.sessionId === sessionId);
        if (session) {
          setStatus(session.status);
          if (session.status === 'READY') {
            addLog('Session restored: WhatsApp is ready.');
          }
        }
      } catch (err) {
        console.error('Failed to fetch initial status:', err);
      }
    };

    fetchStatus();

    socket.on('whatsapp:qr', (data) => {
      if (data.sessionId === sessionId) {
        setQr(data.qr);
        setStatus('QR_READY');
        addLog('QR Code received. Please scan.');
      }
    });

    socket.on('whatsapp:ready', (data) => {
      if (data.sessionId === sessionId) {
        setQr(null);
        setStatus('READY');
        addLog('WhatsApp session is ready and connected!');
      }
    });

    socket.on('whatsapp:authenticated', (data) => {
      if (data.sessionId === sessionId) {
        setStatus('AUTHENTICATED');
        addLog('Authenticated successfully.');
      }
    });

    socket.on('whatsapp:disconnected', (data) => {
      if (data.sessionId === sessionId) {
        setStatus('DISCONNECTED');
        addLog(`Disconnected: ${data.reason}`);
      }
    });

    return () => {
      socket.off('whatsapp:qr');
      socket.off('whatsapp:ready');
      socket.off('whatsapp:authenticated');
      socket.off('whatsapp:disconnected');
    };
  }, [id]);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));
  };

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Session: {id}</h1>
          <span className={`badge ${status === 'READY' ? 'badge-success' : 'badge-warning'}`}>{status}</span>
        </div>
        <p style={{ color: 'var(--text-muted)' }}>Manage your enterprise WhatsApp connection and automation.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px' }}>
        <div className="glass-card">
          <h3 style={{ marginBottom: '20px', fontWeight: 600 }}>Connection Status</h3>
          
          {status === 'QR_READY' && qr ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ marginBottom: '24px', color: 'var(--text-muted)' }}>Scan the QR code below using your WhatsApp app to link this account.</p>
              <div className="qr-container" style={{ background: 'white', padding: '16px', borderRadius: '16px', display: 'inline-block' }}>
                <img src={qr} alt="WhatsApp QR" style={{ width: '256px', height: '256px', display: 'block' }} />
              </div>
              <p style={{ marginTop: '24px', fontSize: '0.875rem' }}>The QR code will automatically refresh every minute.</p>
            </div>
          ) : status === 'READY' ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <div style={{ width: '80px', height: '80px', background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
              </div>
              <h2 style={{ marginBottom: '12px' }}>Connected Successfully</h2>
              <p style={{ color: 'var(--text-muted)' }}>This session is active and processing messages.</p>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <p style={{ color: 'var(--text-muted)' }}>Waiting for session initialization...</p>
            </div>
          )}
        </div>

        <div className="glass-card" style={{ height: 'fit-content' }}>
          <h3 style={{ marginBottom: '16px', fontWeight: 600 }}>Activity Logs</h3>
          <div style={{ 
            height: '400px', 
            overflowY: 'auto', 
            background: 'rgba(0,0,0,0.2)', 
            borderRadius: '8px', 
            padding: '12px',
            fontSize: '0.8125rem',
            fontFamily: 'monospace',
            color: '#cbd5e1'
          }}>
            {logs.length > 0 ? logs.map((log, i) => (
              <div key={i} style={{ marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>
                {log}
              </div>
            )) : <p style={{ color: 'var(--text-muted)' }}>No activity yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
