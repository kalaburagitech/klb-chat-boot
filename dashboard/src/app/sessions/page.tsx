'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSocket } from '@/utils/socket';

interface Session {
  _id: string;
  sessionId: string;
  name: string;
  status: string;
  phoneNumber?: string;
}

export default function SessionsListPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
    const socket = getSocket();

    socket.on('whatsapp:status', (data: any) => {
      setSessions(prev => prev.map(s => 
        s.sessionId === data.sessionId ? { ...s, status: data.status } : s
      ));
    });

    return () => {
      socket.off('whatsapp:status');
    };
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4005'}/api/whatsapp/sessions/klb-connect`);
      const data = await res.json();
      setSessions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4005'}/api/whatsapp/sessions/${sessionId}`, {
        method: 'DELETE',
      });
      setSessions(prev => prev.filter(s => s.sessionId !== sessionId));
    } catch (err) {
      alert('Delete failed');
    }
  };

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>WhatsApp Sessions</h1>
        <p style={{ color: 'var(--text-muted)' }}>Manage all your enterprise connections.</p>
      </header>

      <div className="glass-card">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
              <th style={{ padding: '16px' }}>Name</th>
              <th style={{ padding: '16px' }}>Session ID</th>
              <th style={{ padding: '16px' }}>Status</th>
              <th style={{ padding: '16px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <tr key={session._id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '16px', fontWeight: 500 }}>{session.name}</td>
                <td style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>{session.sessionId}</td>
                <td style={{ padding: '16px' }}>
                  <span className={`badge ${session.status === 'READY' ? 'badge-success' : 'badge-warning'}`}>{session.status}</span>
                </td>
                <td style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <Link href={`/sessions/${session.sessionId}`}>
                      <button style={{ padding: '6px 12px', background: 'var(--primary)', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }}>Manage</button>
                    </Link>
                    <button 
                      onClick={() => deleteSession(session.sessionId)}
                      style={{ padding: '6px 12px', background: 'transparent', border: '1px solid #ef4444', borderRadius: '4px', color: '#ef4444', cursor: 'pointer' }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && sessions.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>No sessions found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
