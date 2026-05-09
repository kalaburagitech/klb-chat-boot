'use client';

import React, { useEffect, useState } from 'react';
import { getSocket } from '@/utils/socket';
import Link from 'next/link';
import QRModal from '@/components/QRModal';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';

interface Session {
  _id: string;
  sessionId: string;
  name: string;
  status: string;
  phoneNumber?: string;
}

export default function DashboardPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [statsData, setStatsData] = useState({
    activeSessions: '0',
    messagesSent: '0',
    totalLeads: '0',
    aiReplies: '0%'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<{ id: string, name: string } | null>(null);

  const stats = [
    { label: 'Active Sessions', value: statsData.activeSessions, color: 'var(--primary)' },
    { label: 'Messages Sent (24h)', value: statsData.messagesSent, color: 'var(--secondary)' },
    { label: 'Total Leads', value: statsData.totalLeads, color: '#a855f7' },
    { label: 'AI Replies', value: statsData.aiReplies, color: '#f59e0b' },
  ];

  useEffect(() => {
    fetchSessions();
    fetchStats();
    const socket = getSocket();
    
    // Join the organization room
    socket.emit('join:org', 'klb-connect');

    socket.on('whatsapp:status', (data: any) => {
      setSessions(prev => prev.map(s => 
        s.sessionId === data.sessionId ? { ...s, status: data.status } : s
      ));
      fetchStats(); 
    });

    socket.on('whatsapp:ready', (data: any) => {
      setSessions(prev => prev.map(s => 
        s.sessionId === data.sessionId ? { ...s, status: 'READY' } : s
      ));
    });

    socket.on('whatsapp:deleted', (data: any) => {
      setSessions(prev => prev.filter(s => s.sessionId !== data.sessionId));
      fetchStats();
    });

    return () => {
      socket.off('whatsapp:status');
      socket.off('whatsapp:ready');
      socket.off('whatsapp:deleted');
    };
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    setError(null);
    await Promise.all([fetchSessions(), fetchStats()]);
    setIsRetrying(false);
  };

  const fetchSessions = async () => {
    try {
      let backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      
      // Smart Fallback for Production
      if (!backendUrl && typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
        backendUrl = 'https://klb-chat-boot-production.up.railway.app';
      }
      
      backendUrl = backendUrl || 'http://localhost:4005';
      
      const res = await fetch(`${backendUrl}/api/whatsapp/sessions/klb-connect`);
      
      if (!res.ok) {
        throw new Error(`Failed to fetch sessions: ${res.statusText}`);
      }

      const data = await res.json();
      setSessions(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch sessions:', err);
      setError(err.message || 'Failed to connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      let backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
      
      if (!backendUrl && typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
        backendUrl = 'https://klb-chat-boot-production.up.railway.app';
      }
      
      backendUrl = backendUrl || 'http://localhost:4005';
      
      const res = await fetch(`${backendUrl}/api/whatsapp/stats/klb-connect`);
      
      if (!res.ok) {
        throw new Error(`Failed to fetch stats: ${res.statusText}`);
      }

      const data = await res.json();
      setStatsData({
        activeSessions: data.activeSessions?.toString() || '0',
        messagesSent: data.messagesSent?.toLocaleString() || '0',
        totalLeads: data.totalLeads?.toLocaleString() || '0',
        aiReplies: data.aiReplies || '0%'
      });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const addSession = async () => {
    const name = prompt('Enter session name:');
    if (!name) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4005'}/api/whatsapp/sessions/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const newSession = await res.json();
      setSessions(prev => [...prev, newSession]);
      
      setSelectedSession(newSession.sessionId);
      setIsModalOpen(true);
    } catch (err) {
      alert('Failed to add session');
    }
  };

  const confirmDelete = (sessionId: string, name: string) => {
    setSessionToDelete({ id: sessionId, name });
    setIsDeleteModalOpen(true);
  };

  const deleteSession = async () => {
    if (!sessionToDelete) return;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4005'}/api/whatsapp/sessions/${sessionToDelete.id}`, {
        method: 'DELETE',
      });
      // Real-time update will be handled by socket event, but we can optimistically update here too
      setSessions(prev => prev.filter(s => s.sessionId !== sessionToDelete.id));
      setIsDeleteModalOpen(false);
      setSessionToDelete(null);
    } catch (err) {
      alert('Failed to delete session');
    }
  };

  const handleScanQR = (sessionId: string) => {
    setSelectedSession(sessionId);
    setIsModalOpen(true);
  };

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px' }}>Enterprise Overview</h1>
        <p style={{ color: 'var(--text-muted)' }}>Welcome back, Admin. Here is your platform status.</p>
      </header>

      {error && (
        <div className="glass-card" style={{ 
          border: '1px solid #ef4444', 
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          marginBottom: '32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{ color: '#ef4444', marginBottom: '4px' }}>Connection Error</h3>
            <p style={{ fontSize: '0.875rem' }}>{error}. Check if backend is running on port 4005.</p>
          </div>
          <button 
            className="btn-primary" 
            onClick={handleRetry}
            disabled={isRetrying}
            style={{ backgroundColor: '#ef4444' }}
          >
            {isRetrying ? 'Retrying...' : 'Retry Connection'}
          </button>
        </div>
      )}

      <div className="grid" style={{ marginBottom: '48px' }}>
        {stats.map((stat, i) => (
          <div key={i} className="glass-card">
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '8px' }}>{stat.label}</p>
            <h3 style={{ fontSize: '2rem', fontWeight: 700, color: stat.color }}>{stat.value}</h3>
          </div>
        ))}
      </div>

      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Active WhatsApp Sessions</h2>
          <button className="btn-primary" onClick={addSession}>+ Add New Session</button>
        </div>

        {loading ? (
          <p>Loading sessions...</p>
        ) : (
          <div className="grid">
            {sessions.map((session) => (
              <SessionCard 
                key={session._id}
                session={session}
                onScan={() => handleScanQR(session.sessionId)}
                onDelete={() => confirmDelete(session.sessionId, session.name)}
              />
            ))}
            {sessions.length === 0 && (
              <p style={{ color: 'var(--text-muted)' }}>No sessions found. Add one to get started.</p>
            )}
          </div>
        )}
      </section>

      <QRModal 
        sessionId={selectedSession || ''} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={deleteSession}
        sessionName={sessionToDelete?.name || ''}
      />
    </div>
  );
}

function SessionCard({ session, onScan, onDelete }: { session: Session, onScan: () => void, onDelete: () => void }) {
  const { name, sessionId, status, phoneNumber } = session;
  const statusClass = status === 'READY' ? 'badge-success' : status === 'QR_READY' ? 'badge-warning' : 'badge-danger';
  
  return (
    <div className="glass-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <h3 style={{ fontWeight: 600, marginBottom: '4px' }}>{name}</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {sessionId}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span className={`badge ${statusClass}`}>{status}</span>
          <button 
            onClick={onDelete}
            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem', padding: '0 4px' }}
            title="Delete Session"
          >
            &times;
          </button>
        </div>
      </div>
      <p style={{ fontSize: '0.875rem', marginBottom: '20px' }}>{phoneNumber || 'Scanning required...'}</p>
      <div style={{ display: 'flex', gap: '12px' }}>
        <Link href={`/sessions/${sessionId}`} style={{ flex: 1 }}>
          <button style={{ width: '100%', padding: '8px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-main)', cursor: 'pointer' }}>Manage</button>
        </Link>
        {status === 'QR_READY' && (
          <button 
            onClick={onScan}
            style={{ flex: 1, padding: '8px', background: 'var(--primary)', border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer' }}
          >
            Scan QR
          </button>
        )}
      </div>
    </div>
  );
}
