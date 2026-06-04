'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from "convex/react";

export default function TemplatesPage() {
  const templates = useQuery("templates:getByOrg" as any, { organizationSlug: 'klb-connect' });
  const createTemplate = useMutation("templates:createTemplate" as any);
  const updateTemplate = useMutation("templates:updateTemplate" as any);
  const deleteTemplate = useMutation("templates:deleteTemplate" as any);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', category: 'MARKETING', content: '' });

  const loading = templates === undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateTemplate({
          templateId: editingId,
          name: formData.name,
          category: formData.category,
          content: formData.content,
        });
      } else {
        await createTemplate({
          organizationSlug: 'klb-connect',
          ...formData
        });
      }
      closeModal();
    } catch (e: any) {
      alert(`Failed to save template: ${e.message || e}`);
    }
  };

  const handleEdit = (tpl: any) => {
    setEditingId(tpl._id);
    setFormData({ name: tpl.name, category: tpl.category, content: tpl.content });
    setIsModalOpen(true);
  };

  const handleDelete = async (templateId: string) => {
    if (confirm("Are you sure you want to delete this template?")) {
      try {
        await deleteTemplate({ templateId });
      } catch (e: any) {
        alert(`Failed to delete template: ${e.message || e}`);
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: '', category: 'MARKETING', content: '' });
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Message Templates</h1>
          <p className="page-subtitle">Manage dynamic text templates for campaigns and auto-replies.</p>
        </div>
        <button className="btn-primary" onClick={() => {
          setEditingId(null);
          setFormData({ name: '', category: 'MARKETING', content: '' });
          setIsModalOpen(true);
        }}>
          + Create Template
        </button>
      </div>

      {loading ? (
        <div className="loading-state">Loading templates...</div>
      ) : templates.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📄</div>
          <h3>No templates found</h3>
          <p>Create your first template to use in rules and schedules.</p>
        </div>
      ) : (
        <div className="grid">
          {templates?.map((tpl: any) => (
            <div key={tpl._id} className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">{tpl.name}</h3>
                  <span className={`badge ${tpl.active ? 'badge-active' : 'badge-inactive'}`}>
                    {tpl.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="card-actions">
                  <button className="btn-icon" onClick={() => handleEdit(tpl)}>✏️</button>
                  <button className="btn-icon" onClick={() => handleDelete(tpl._id)}>🗑️</button>
                </div>
              </div>
              <div className="card-meta">Category: {tpl.category}</div>
              <div className="card-body">
                <pre>{tpl.content}</pre>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{editingId ? "Edit Template" : "Create Template"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Template Name</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  placeholder="e.g. welcome_message"
                  required
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select 
                  value={formData.category} 
                  onChange={e => setFormData({...formData, category: e.target.value})}
                >
                  <option value="MARKETING">Marketing</option>
                  <option value="UTILITY">Utility</option>
                  <option value="AUTHENTICATION">Authentication</option>
                </select>
              </div>
              <div className="form-group">
                <label>Content (Use {"{{var}}"} for variables)</label>
                <textarea 
                  rows={5}
                  value={formData.content} 
                  onChange={e => setFormData({...formData, content: e.target.value})}
                  placeholder="Hello {{name}}, welcome to KLB Connect!"
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn-primary">{editingId ? "Update Template" : "Save Template"}</button>
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
        
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px; }
        
        .card { background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 12px; }
        .card-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
        .card-title { margin: 0 0 8px; font-size: 1.1rem; color: var(--text-main); font-weight: 600; }
        .card-meta { font-size: 0.8rem; color: var(--text-muted); }
        .card-body pre { background: rgba(0,0,0,0.2); padding: 12px; border-radius: 6px; font-size: 0.85rem; color: var(--text-main); white-space: pre-wrap; font-family: inherit; margin: 0; }
        
        .card-actions { display: flex; gap: 4px; }
        .btn-icon { background: rgba(255,255,255,0.05); border: 1px solid var(--border); border-radius: 6px; padding: 6px; cursor: pointer; transition: 0.2s; font-size: 0.9rem; }
        .btn-icon:hover { background: rgba(255,255,255,0.1); transform: translateY(-1px); }
        
        .badge { padding: 4px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; }
        .badge-active { background: rgba(74, 222, 128, 0.2); color: #4ade80; }
        .badge-inactive { background: rgba(248, 113, 113, 0.2); color: #f87171; }
        
        .loading-state, .empty-state { text-align: center; padding: 60px 20px; color: var(--text-muted); }
        .empty-icon { font-size: 3rem; margin-bottom: 16px; opacity: 0.5; }
        
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-content { background: #0f172a; padding: 32px; border-radius: 16px; width: 100%; max-width: 500px; border: 1px solid var(--border); }
        .modal-content h2 { margin: 0 0 24px; color: var(--text-main); }
        
        .form-group { margin-bottom: 20px; display: flex; flex-direction: column; gap: 8px; }
        .form-group label { font-size: 0.85rem; font-weight: 600; color: var(--text-muted); }
        .form-group input, .form-group select, .form-group textarea { background: rgba(0,0,0,0.2); border: 1px solid var(--border); padding: 12px; border-radius: 8px; color: var(--text-main); width: 100%; font-family: inherit; }
        .form-group input:focus, .form-group select:focus, .form-group textarea:focus { outline: none; border-color: var(--primary); }
        
        .modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 32px; }
      `}</style>
    </div>
  );
}
