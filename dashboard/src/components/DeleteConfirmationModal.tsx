'use client';

import React from 'react';

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  sessionName: string;
}

export default function DeleteConfirmationModal({ isOpen, onClose, onConfirm, sessionName }: DeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="glass-card modal-content animate-scale-up" style={{ maxWidth: '400px', width: '100%', padding: '32px', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '20px' }}>⚠️</div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '12px' }}>Delete WhatsApp Session?</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '0.9rem', lineHeight: '1.6' }}>
          This will disconnect <b>{sessionName}</b> from WhatsApp, stop all chatbot automations, and permanently remove stored session data.
        </p>

        <div style={{ display: 'flex', gap: '16px' }}>
          <button onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
          <button onClick={onConfirm} className="btn-danger" style={{ flex: 1 }}>Delete Session</button>
        </div>

        <style jsx>{`
          .modal-overlay {
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(8px);
            display: flex; justify-content: center; align-items: center;
            z-index: 1100;
          }
          .btn-secondary {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid var(--border);
            color: white;
            padding: 12px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
          }
          .btn-danger {
            background: #ef4444;
            border: none;
            color: white;
            padding: 12px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
          }
          @keyframes scale-up {
            from { transform: scale(0.95); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          .animate-scale-up { animation: scale-up 0.2s ease-out forwards; }
        `}</style>
      </div>
    </div>
  );
}
