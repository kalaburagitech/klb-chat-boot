'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from "convex/react";

export default function RulesPage() {
  const rules = useQuery("rules:getByOrg" as any, { organizationSlug: 'klb-connect' });
  const templates = useQuery("templates:getByOrg" as any, { organizationSlug: 'klb-connect' });
  const createRule = useMutation("rules:createRule" as any);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ sessionId: '', trigger: '', type: 'TEXT', response: '' });

  const loading = rules === undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createRule({
        organizationSlug: 'klb-connect',
        ...formData
      });
      setIsModalOpen(false);
      setFormData({ sessionId: '', trigger: '', type: 'TEXT', response: '' });
    } catch (e: any) {
      alert(`Failed to create rule: ${e.message || e}`);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Auto-Reply Rules</h1>
          <p className="page-subtitle">Automatically trigger messages, templates, or menus based on keywords.</p>
        </div>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          + Create Rule
        </button>
      </div>

      {loading ? (
        <div className="loading-state">Loading rules...</div>
      ) : rules.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">⚡</div>
          <h3>No auto-replies configured</h3>
          <p>Create a rule to automate responses for keywords like "pricing" or "help".</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Keyword Trigger</th>
                <th>Match Type</th>
                <th>Reply Action</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rules.map(rule => (
                <tr key={rule._id}>
                  <td><strong>{rule.trigger}</strong></td>
                  <td><span className="badge badge-neutral">EXACT</span></td>
                  <td>
                    {rule.type === 'TEXT' ? (
                      <span className="text-preview">{rule.response.substring(0, 40)}...</span>
                    ) : rule.type === 'TEMPLATE' ? (
                      <span className="badge badge-info">Template ID: {rule.response}</span>
                    ) : (
                      <span className="badge badge-info">{rule.type}</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${rule.enabled ? 'badge-active' : 'badge-inactive'}`}>
                      {rule.enabled ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Create Auto-Reply Rule</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Trigger Keyword</label>
                <input 
                  type="text" 
                  value={formData.trigger} 
                  onChange={e => setFormData({...formData, trigger: e.target.value})} 
                  placeholder="e.g. pricing"
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Action Type</label>
                  <select 
                    value={formData.type} 
                    onChange={e => setFormData({...formData, type: e.target.value})}
                  >
                    <option value="TEXT">Send Text</option>
                    <option value="TEMPLATE">Send Template</option>
                    <option value="MENU">Trigger Menu</option>
                  </select>
                </div>
              </div>
              
              {formData.type === 'TEXT' && (
                <div className="form-group">
                  <label>Reply Message</label>
                  <textarea 
                    rows={4}
                    value={formData.response} 
                    onChange={e => setFormData({...formData, response: e.target.value})}
                    placeholder="Enter the automated response..."
                    required
                  />
                </div>
              )}

              {formData.type === 'TEMPLATE' && (
                <div className="form-group">
                  <label>Select Template</label>
                  <select 
                    value={formData.response} 
                    onChange={e => setFormData({...formData, response: e.target.value})}
                    required
                  >
                    <option value="" disabled>Select a template...</option>
                    {templates?.map((tpl: any) => (
                      <option key={tpl._id} value={tpl._id}>{tpl.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Rule</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .page-container { padding: 24px; max-width: 1200px; margin: 0 auto; }
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
        .page-title { font-size: 1.8rem; font-weight: 700; color: var(--text-main); margin: 0 0 8px; }
        .page-subtitle { color: var(--text-muted); margin: 0; }
        
        .btn-primary { background: var(--primary); color: #fff; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.2s; }
        .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
        .btn-secondary { background: rgba(255,255,255,0.1); color: var(--text-main); border: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.2s; }
        
        .table-container { background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
        .data-table { width: 100%; border-collapse: collapse; text-align: left; }
        .data-table th { padding: 16px; background: rgba(0,0,0,0.2); color: var(--text-muted); font-weight: 600; font-size: 0.85rem; text-transform: uppercase; border-bottom: 1px solid var(--border); }
        .data-table td { padding: 16px; border-bottom: 1px solid var(--border); color: var(--text-main); font-size: 0.95rem; }
        .data-table tr:last-child td { border-bottom: none; }
        
        .text-preview { color: var(--text-muted); font-size: 0.9rem; }
        
        .badge { padding: 4px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; }
        .badge-active { background: rgba(74, 222, 128, 0.2); color: #4ade80; }
        .badge-inactive { background: rgba(248, 113, 113, 0.2); color: #f87171; }
        .badge-neutral { background: rgba(255, 255, 255, 0.1); color: var(--text-muted); }
        .badge-info { background: rgba(56, 189, 248, 0.2); color: #38bdf8; }
        
        .loading-state, .empty-state { text-align: center; padding: 60px 20px; color: var(--text-muted); }
        .empty-icon { font-size: 3rem; margin-bottom: 16px; opacity: 0.5; }
        
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-content { background: #0f172a; padding: 32px; border-radius: 16px; width: 100%; max-width: 500px; border: 1px solid var(--border); }
        .modal-content h2 { margin: 0 0 24px; color: var(--text-main); }
        
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .form-group { margin-bottom: 20px; display: flex; flex-direction: column; gap: 8px; }
        .form-group label { font-size: 0.85rem; font-weight: 600; color: var(--text-muted); }
        .form-group input, .form-group select, .form-group textarea { background: rgba(0,0,0,0.2); border: 1px solid var(--border); padding: 12px; border-radius: 8px; color: var(--text-main); width: 100%; font-family: inherit; }
        .form-group input:focus, .form-group select:focus, .form-group textarea:focus { outline: none; border-color: var(--primary); }
        
        .modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 32px; }
      `}</style>
    </div>
  );
}
