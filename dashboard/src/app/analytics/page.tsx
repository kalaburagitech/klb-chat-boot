'use client';

import React from 'react';
import { useQuery } from "convex/react";

export default function AnalyticsPage() {
  const statsResponse = useQuery("sessions:getStats" as any, { organizationSlug: 'klb-connect' });

  const loading = statsResponse === undefined;
  
  // Transform to match old format temporarily
  const data = statsResponse ? {
    metrics: {
      totalConversations: statsResponse.totalLeads || 0,
      failedInputs: 0,
      menuUsage: [],
      keywords: []
    }
  } : null;

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Real-time Analytics</h1>
          <p className="page-subtitle">Monitor performance and message volume across all sessions.</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Loading metrics...</div>
      ) : !data ? (
        <div className="empty-state">No analytics data found.</div>
      ) : (
        <>
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-title">Total Conversations</div>
              <div className="metric-value">{data.metrics.totalConversations}</div>
            </div>
            <div className="metric-card">
              <div className="metric-title">Failed Inputs</div>
              <div className="metric-value error-text">{data.metrics.failedInputs}</div>
            </div>
          </div>

          <div className="charts-grid">
            <div className="chart-card">
              <h3>Top Menus Accessed</h3>
              {data.metrics.menuUsage.length === 0 ? (
                <p className="empty-text">No menu data yet.</p>
              ) : (
                <ul className="rank-list">
                  {data.metrics.menuUsage.map((m: any, i: number) => (
                    <li key={i}>
                      <span className="rank-name">{m._id}</span>
                      <span className="rank-count">{m.count} uses</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="chart-card">
              <h3>Top Keywords Triggered</h3>
              {data.metrics.keywords.length === 0 ? (
                <p className="empty-text">No keyword data yet.</p>
              ) : (
                <ul className="rank-list">
                  {data.metrics.keywords.map((k: any, i: number) => (
                    <li key={i}>
                      <span className="rank-name">{k._id}</span>
                      <span className="rank-count">{k.count} matches</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        .page-container { padding: 24px; max-width: 1200px; margin: 0 auto; }
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
        .page-title { font-size: 1.8rem; font-weight: 700; color: var(--text-main); margin: 0 0 8px; }
        .page-subtitle { color: var(--text-muted); margin: 0; }
        
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 24px; margin-bottom: 32px; }
        .metric-card { background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 12px; padding: 24px; }
        .metric-title { font-size: 0.9rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; margin-bottom: 12px; }
        .metric-value { font-size: 2.5rem; font-weight: 700; color: var(--text-main); }
        .error-text { color: #f87171; }
        
        .charts-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 24px; }
        .chart-card { background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 12px; padding: 24px; }
        .chart-card h3 { margin: 0 0 20px; font-size: 1.1rem; color: var(--text-main); }
        
        .rank-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px; }
        .rank-list li { display: flex; justify-content: space-between; padding: 12px; background: rgba(0,0,0,0.2); border-radius: 8px; border: 1px solid rgba(255,255,255,0.05); }
        .rank-name { font-weight: 600; color: var(--text-main); }
        .rank-count { color: var(--primary); font-weight: 700; font-size: 0.9rem; }
        
        .empty-text { color: var(--text-muted); font-style: italic; }
        .loading-state, .empty-state { text-align: center; padding: 60px 20px; color: var(--text-muted); }
      `}</style>
    </div>
  );
}
