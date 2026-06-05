"use client";
import { useEffect, useState } from "react";

export default function DebugPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const org = "klb-connect";

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/whatsapp/sessions/${org}`);
      const data = await res.json();
      setSessions(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSessions(); }, []);

  const createSession = async () => {
    const name = prompt("Session name") || "test";
    await fetch(`/api/whatsapp/sessions/${org}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
    fetchSessions();
  };

  const initSession = async (sessionId: string) => {
    await fetch(`/api/whatsapp/sessions/${org}/${sessionId}/init`, { method: 'POST' });
    fetchSessions();
  };

  const deleteSession = async (sessionId: string) => {
    if (!confirm('Delete session?')) return;
    await fetch(`/api/whatsapp/sessions/${org}/${sessionId}`, { method: 'DELETE' });
    fetchSessions();
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Debug — Sessions</h2>
      <div style={{ marginBottom: 12 }}>
        <button onClick={createSession}>Create session</button>
        <button onClick={fetchSessions} style={{ marginLeft: 8 }}>{loading ? 'Refreshing...' : 'Refresh'}</button>
      </div>
      <ul>
        {sessions.map(s => (
          <li key={s.sessionId} style={{ marginBottom: 8 }}>
            <strong>{s.name}</strong> — {s.status}
            <div>
              <button onClick={() => initSession(s.sessionId)}>Init</button>
              <button onClick={() => deleteSession(s.sessionId)} style={{ marginLeft: 8 }}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
