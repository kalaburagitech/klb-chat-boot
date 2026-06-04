'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation } from "convex/react";
import QRModal from '@/components/QRModal';

interface Session {
  _id: string;
  sessionId: string;
  name: string;
  status: string;
  phoneNumber?: string;
}

export default function SessionsListPage() {
  const sessions = useQuery("sessions:getByOrg" as any, { organizationSlug: 'klb-connect' });
  const deleteSessionMutation = useMutation("sessions:deleteSession" as any);
  
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const deleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session?')) return;
    try {
      await deleteSessionMutation({ organizationSlug: 'klb-connect', sessionId });
    } catch (err) {
      alert('Delete failed');
    }
  };

  const loading = sessions === undefined;

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>WhatsApp Sessions</h1>
        <p style={{ color: 'var(--text-muted)' }}>Manage all your enterprise connections.</p>
      </header>

      <div className="sessions-container">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading sessions...</div>
        ) : (
          <div className="sessions-grid">
            {sessions.map((session: any) => (
              <SessionListItem 
                key={session._id} 
                session={session} 
                onDelete={() => deleteSession(session.sessionId)}
                onScan={() => {
                  setSelectedSession(session.sessionId);
                  setIsModalOpen(true);
                }}
              />
            ))}
            {sessions.length === 0 && (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>No sessions found.</div>
            )}
          </div>
        )}
      </div>

      <QRModal 
        sessionId={selectedSession || ''} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />

      <style jsx>{`
        .sessions-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }
      `}</style>
    </div>
  );
}

function SessionListItem({ session, onDelete, onScan }: { session: Session, onDelete: () => void, onScan: () => void }) {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div className="glass-card session-list-item">
      <div className="session-info">
        <div className={`status-icon ${session.status === 'READY' ? 'ready' : 'waiting'}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        <div className="details">
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>{session.name}</h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>ID: {session.sessionId}</p>
        </div>
      </div>
      
      <div className="actions-wrapper">
        <span className={`badge ${session.status === 'READY' ? 'badge-success' : 'badge-warning'}`}>{session.status}</span>
        
        <div className="button-group">
          {session.status === 'QR_READY' && (
            <button onClick={onScan} className="btn-primary-sm">Scan QR</button>
          )}
          <Link href={`/sessions/${session.sessionId}`}>
            <button className="btn-secondary-sm">Manage</button>
          </Link>
          
          <div className="dropdown-container">
            <button 
              className="btn-icon"
              onClick={() => setShowDropdown(!showDropdown)}
              aria-label="More options"
            >
              ⋮
            </button>
            {showDropdown && (
              <>
                <div className="dropdown-overlay" onClick={() => setShowDropdown(false)}></div>
                <div className="dropdown-menu">
                  <button 
                    onClick={() => { onDelete(); setShowDropdown(false); }}
                    className="dropdown-item delete"
                  >
                    Delete Session
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .session-list-item {
          padding: 16px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: transform 0.2s;
        }
        .session-list-item:hover {
          transform: translateY(-2px);
        }
        .session-info {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .status-icon {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.2);
        }
        .status-icon.ready {
          background: rgba(34, 197, 94, 0.1);
          color: #22c55e;
        }
        .status-icon.waiting {
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
        }
        .actions-wrapper {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .button-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .btn-primary-sm {
          padding: 6px 14px;
          background: var(--primary);
          border: none;
          border-radius: 6px;
          color: white;
          font-size: 0.8125rem;
          font-weight: 500;
          cursor: pointer;
        }
        .btn-secondary-sm {
          padding: 6px 14px;
          background: transparent;
          border: 1px solid var(--border);
          border-radius: 6px;
          color: var(--text-main);
          font-size: 0.8125rem;
          cursor: pointer;
        }
        .btn-icon {
          width: 32px;
          height: 32px;
          background: transparent;
          border: 1px solid var(--border);
          border-radius: 6px;
          color: var(--text-main);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
        }
        .dropdown-container {
          position: relative;
        }
        .dropdown-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          z-index: 100;
        }
        .dropdown-menu {
          position: absolute;
          right: 0;
          top: 100%;
          margin-top: 8px;
          background: #1e293b;
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 4px;
          z-index: 101;
          minWidth: 140px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
        }
        .dropdown-item {
          width: 100%;
          padding: 10px 16px;
          text-align: left;
          background: transparent;
          border: none;
          color: var(--text-main);
          cursor: pointer;
          border-radius: 6px;
          font-size: 0.875rem;
        }
        .dropdown-item:hover {
          background: rgba(255,255,255,0.05);
        }
        .dropdown-item.delete {
          color: #ef4444;
        }
        .dropdown-item.delete:hover {
          background: rgba(239, 68, 68, 0.1);
        }

        @media (max-width: 768px) {
          .session-list-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
            padding: 20px;
          }
          .actions-wrapper {
            width: 100%;
            justify-content: space-between;
          }
          .session-info {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
