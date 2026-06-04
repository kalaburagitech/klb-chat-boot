'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from "convex/react";

export default function SchedulesPage() {
  const schedules = useQuery("schedules:getByOrg" as any, { organizationSlug: 'klb-connect' });
  const createSchedule = useMutation("schedules:createSchedule" as any);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ 
    jobName: '', 
    targetType: 'BROADCAST', 
    scheduledAt: '', 
    content: '' 
  });

  const loading = schedules === undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createSchedule({
        organizationSlug: 'klb-connect',
        name: formData.jobName,
        type: 'ONCE',
        targetGroup: formData.targetType,
        messageContent: formData.content
      });
      setIsModalOpen(false);
      setFormData({ jobName: '', targetType: 'BROADCAST', scheduledAt: '', content: '' });
    } catch (e: any) {
      alert(`Failed to create schedule: ${e.message || e}`);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Message Schedules</h1>
          <p className="page-subtitle">Schedule broadcasts, reminders, or future templates.</p>
        </div>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          + New Schedule
        </button>
      </div>

      {loading ? (
        <div className="loading-state">Loading schedules...</div>
      ) : schedules.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">⏰</div>
          <h3>No upcoming schedules</h3>
          <p>Create a schedule to broadcast a message to your users.</p>
        </div>
      ) : (
        <div className="grid">
          {schedules?.map((schedule: any) => (
            <div key={schedule._id} className="card">
              <div className="card-header">
                <h3 className="card-title">{schedule.name}</h3>
                <span className={`badge ${schedule.active ? 'badge-active' : 'badge-inactive'}`}>
                  {schedule.active ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
              <div className="card-meta">
                Scheduled for: {schedule.executeAt ? new Date(schedule.executeAt).toLocaleString() : 'N/A'}
              </div>
              <div className="card-body">
                <span className="badge badge-neutral">{schedule.targetGroup}</span>
                <p style={{ marginTop: '12px', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                  {schedule.messageContent ? schedule.messageContent : 'No text content attached.'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Create Schedule</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Job Name</label>
                <input 
                  type="text" 
                  value={formData.jobName} 
                  onChange={e => setFormData({...formData, jobName: e.target.value})} 
                  placeholder="e.g. Diwali Broadcast"
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Target Audience</label>
                  <select 
                    value={formData.targetType} 
                    onChange={e => setFormData({...formData, targetType: e.target.value})}
                  >
                    <option value="BROADCAST">All Active Users</option>
                    <option value="SINGLE">Single Number</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Date & Time</label>
                  <input 
                    type="datetime-local" 
                    value={formData.scheduledAt} 
                    onChange={e => setFormData({...formData, scheduledAt: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Message Content</label>
                <textarea 
                  rows={4}
                  value={formData.content} 
                  onChange={e => setFormData({...formData, content: e.target.value})}
                  placeholder="Enter the broadcast message..."
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Schedule</button>
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
        .card-header { display: flex; justify-content: space-between; align-items: flex-start; }
        .card-title { margin: 0; font-size: 1.1rem; color: var(--text-main); font-weight: 600; }
        .card-meta { font-size: 0.8rem; color: var(--text-muted); }
        
        .badge { padding: 4px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; }
        .badge-active { background: rgba(74, 222, 128, 0.2); color: #4ade80; }
        .badge-warning { background: rgba(250, 204, 21, 0.2); color: #facc15; }
        .badge-neutral { background: rgba(255, 255, 255, 0.1); color: var(--text-muted); }
        
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
