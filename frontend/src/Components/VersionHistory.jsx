import React, { useEffect, useState } from 'react';

const VersionHistory = ({ roomId }) => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const API_BASE = '';

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/history/${roomId}`);
      const data = await res.json();
      setVersions(data.versions || []);
    } catch (_) {}
    setLoading(false);
  };

  const restore = async (index) => {
    if (!confirm('Restore this version?')) return;
    try {
      await fetch(`${API_BASE}/api/history/${roomId}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index })
      });
      // server will broadcast updated content
      await load();
    } catch (_) {}
  };

  useEffect(() => { load(); }, [roomId]);

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-md p-3 text-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-white font-semibold">Version History</span>
        <button onClick={load} className="text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded cursor-pointer">Refresh</button>
      </div>
      {loading ? (
        <div className="text-gray-400">Loading…</div>
      ) : versions.length === 0 ? (
        <div className="text-gray-400">No versions yet.</div>
      ) : (
        <ul className="space-y-2 max-h-56 overflow-auto">
          {versions.map((v) => (
            <li key={v.index} className="flex items-center justify-between bg-slate-700/50 hover:bg-slate-700 transition p-2 rounded">
              <span className="text-gray-200">{new Date(v.createdAt).toLocaleString()} • {v.size} chars</span>
              <button onClick={() => restore(v.index)} className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded cursor-pointer">Restore</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default VersionHistory;
