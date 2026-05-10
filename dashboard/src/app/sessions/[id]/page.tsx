'use client';

import React, { useEffect, useState, use } from 'react';
import { getSocket } from '@/utils/socket';
import Link from 'next/link';

export default function SessionDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [qr, setQr] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('INITIALIZING');
  const [logs, setLogs] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const socket = getSocket();
    const sessionId = id;
    const orgId = 'klb-connect'; 
    socket.emit('join:org', orgId);

    const fetchStatus = async () => {
      try {
        let backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4005';

        if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
          backendUrl = 'https://klb-chat-boot-production.up.railway.app';
        }
        
        const res = await fetch(`${backendUrl}/api/whatsapp/sessions/klb-connect`);
        const sessions = await res.json();
        const session = sessions.find((s: any) => s.sessionId === sessionId);
        
        if (session) {
          setStatus(session.status);
          if (session.status === 'READY') {
            addLog('Session restored: WhatsApp is ready.');
          }
        }

        await fetch(`${backendUrl}/api/whatsapp/sessions/${sessionId}/init`, {
          method: 'POST'
        });
        addLog('Requesting session initialization...');
        
      } catch (err) {
        console.error('Failed to fetch initial status:', err);
      }
    };

    fetchStatus();

    socket.on('whatsapp:qr', (data: any) => {
      if (data.sessionId === sessionId) {
        setQr(data.qr);
        setStatus('QR_READY');
        setTimeLeft(60);
        addLog('QR Code received. Please scan.');
      }
    });

    socket.on('whatsapp:ready', (data: any) => {
      if (data.sessionId === sessionId) {
        setQr(null);
        setStatus('READY');
        addLog('WhatsApp session is ready and connected!');
      }
    });

    socket.on('whatsapp:status', (data: any) => {
      if (data.sessionId === sessionId) {
        setStatus(data.status);
        if (data.status === 'FAILED') {
          setError(data.error || 'Connection failed');
          addLog(`Error: ${data.error || 'Connection failed'}`);
        }
      }
    });

    socket.on('whatsapp:disconnected', (data: any) => {
      if (data.sessionId === sessionId) {
        setStatus('DISCONNECTED');
        addLog(`Disconnected: ${data.reason}`);
      }
    });

    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
      socket.off('whatsapp:qr');
      socket.off('whatsapp:ready');
      socket.off('whatsapp:status');
      socket.off('whatsapp:disconnected');
      clearInterval(timer);
    };
  }, [id]);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));
  };

  const retryInit = async () => {
    setStatus('INITIALIZING');
    setError(null);
    setQr(null);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4005';
      await fetch(`${backendUrl}/api/whatsapp/sessions/${id}/init`, {
        method: 'POST'
      });
      addLog('Retrying session initialization...');
    } catch (err) {
      setError('Failed to reach server');
      addLog('Retry failed: Could not reach server');
    }
  };

  const deleteSession = async () => {
    if (!confirm('Are you sure you want to delete this session?')) return;
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4005';
      await fetch(`${backendUrl}/api/whatsapp/sessions/${id}`, {
        method: 'DELETE',
      });
      window.location.href = '/sessions';
    } catch (err) {
      alert('Delete failed');
    }
  };

  return (
    <div className="animate-fade-in session-details">
      <header className="details-header">
        <div className="header-top">
          <Link href="/sessions" className="back-link">← Back to Sessions</Link>
          <div className="actions-dropdown">
            <button className="btn-icon" onClick={() => setShowDropdown(!showDropdown)}>⋮</button>
            {showDropdown && (
              <>
                <div className="dropdown-overlay" onClick={() => setShowDropdown(false)}></div>
                <div className="dropdown-menu">
                  <button onClick={deleteSession} className="dropdown-item delete">Delete Session</button>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="header-main">
          <div className="title-section">
            <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>Session: {id}</h1>
            <span className={`badge ${status === 'READY' ? 'badge-success' : status === 'FAILED' ? 'badge-danger' : 'badge-warning'}`}>{status}</span>
          </div>
          <p style={{ color: 'var(--text-muted)', margin: '8px 0 0' }}>Manage your enterprise WhatsApp connection and automation.</p>
        </div>
      </header>

      <div className="details-grid">
        <div className={`glass-card status-card ${status === 'READY' ? 'success' : ''}`}>
          <h3 style={{ marginBottom: '24px', fontWeight: 600 }}>Connection Status</h3>
          
          {status === 'QR_READY' && qr ? (
            <div className="qr-section">
              <p style={{ marginBottom: '24px', color: 'var(--text-muted)' }}>Scan the QR code below using your WhatsApp app to link this account.</p>
              <div className="qr-wrapper">
                <img src={qr} alt="WhatsApp QR" />
              </div>
              <div className="timer-wrapper">
                <span>The QR code will automatically refresh in: </span>
                <span className={`timer-text ${timeLeft < 10 ? 'danger' : ''}`}>
                  {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>
          ) : status === 'READY' ? (
            <div className="connected-section">
              <div className="success-icon-wrapper">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
              </div>
              <h2 style={{ marginBottom: '12px' }}>Connected Successfully</h2>
              <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto' }}>This session is active and processing messages for your organization.</p>
            </div>
          ) : status === 'FAILED' ? (
            <div className="failed-section">
              <div className="error-icon-wrapper">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="white"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
              </div>
              <h2 style={{ marginBottom: '12px', color: '#ef4444' }}>Initialization Failed</h2>
              <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto 24px' }}>
                {error || 'The WhatsApp browser process closed unexpectedly. This can happen due to resource limits.'}
              </p>
              <button onClick={retryInit} className="btn-primary" style={{ background: '#ef4444' }}>
                Retry Connection
              </button>
            </div>
          ) : (
            <div className="initializing-section">
              <div className="spinner"></div>
              <p style={{ color: 'var(--text-muted)', marginTop: '20px' }}>Waiting for session initialization...</p>
            </div>
          )}
        </div>

        <div className="glass-card logs-card">
          <h3 style={{ marginBottom: '16px', fontWeight: 600 }}>Activity Logs</h3>
          <div className="logs-container">
            {logs.length > 0 ? logs.map((log, i) => (
              <div key={i} className="log-entry">
                {log}
              </div>
            )) : <p style={{ color: 'var(--text-muted)' }}>No activity yet.</p>}
          </div>
        </div>
      </div>

      <style jsx>{`
        .session-details { padding-bottom: 60px; }
        .details-header { margin-bottom: 40px; }
        .header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .back-link { color: var(--primary); text-decoration: none; font-size: 0.875rem; font-weight: 500; }
        .header-main { display: flex; flex-direction: column; }
        .title-section { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
        .details-grid { display: grid; grid-template-columns: 1fr; gap: 24px; }
        @media (min-width: 1024px) { .details-grid { grid-template-columns: 1fr 400px; } }
        .status-card { padding: 32px; min-height: 480px; display: flex; flex-direction: column; }
        .status-card.success { background: linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(34, 197, 94, 0) 100%); border-color: rgba(34, 197, 94, 0.2); }
        .qr-section, .connected-section, .initializing-section, .failed-section { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
        .qr-wrapper { background: white; padding: 16px; border-radius: 20px; display: inline-block; box-shadow: 0 20px 50px rgba(0,0,0,0.3); margin-bottom: 24px; }
        .qr-wrapper img { width: 280px; height: 280px; display: block; }
        .timer-wrapper { font-size: 0.875rem; color: var(--text-muted); }
        .timer-text { font-weight: 600; color: var(--primary); }
        .timer-text.danger { color: #ef4444; }
        .success-icon-wrapper, .error-icon-wrapper { width: 88px; height: 88px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 24px; }
        .success-icon-wrapper { background: var(--primary); box-shadow: 0 0 30px rgba(34, 197, 94, 0.4); }
        .error-icon-wrapper { background: #ef4444; box-shadow: 0 0 30px rgba(239, 68, 68, 0.4); }
        .logs-container { height: 440px; overflow-y: auto; background: rgba(0,0,0,0.2); border-radius: 12px; padding: 16px; font-size: 0.8125rem; font-family: 'monospace'; color: #94a3b8; }
        .log-entry { margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.05); line-height: 1.5; }
        .spinner { width: 48px; height: 48px; border: 3px solid rgba(255,255,255,0.05); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .actions-dropdown { position: relative; }
        .btn-icon { width: 36px; height: 36px; background: transparent; border: 1px solid var(--border); border-radius: 8px; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
        .dropdown-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 100; }
        .dropdown-menu { position: absolute; right: 0; top: 100%; margin-top: 8px; background: #1e293b; border: 1px solid var(--border); border-radius: 10px; padding: 6px; z-index: 101; min-width: 160px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        .dropdown-item { width: 100%; padding: 10px 16px; text-align: left; background: transparent; border: none; color: var(--text-main); cursor: pointer; border-radius: 6px; font-size: 0.875rem; transition: background 0.2s; }
        .dropdown-item:hover { background: rgba(255,255,255,0.05); }
        .dropdown-item.delete { color: #ef4444; }
        .dropdown-item.delete:hover { background: rgba(239, 68, 68, 0.1); }
      `}</style>
    </div>
  );
}
