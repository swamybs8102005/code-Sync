import React, { useEffect, useState } from 'react';
import { History, RefreshCw, RotateCcw, Clock, FileText } from 'lucide-react';

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
    } catch (error) {
      console.error('Failed to load version history:', error);
    }
    setLoading(false);
  };

  const restore = async (index) => {
    if (!confirm('Are you sure you want to restore this version? This will overwrite the current content.')) return;
    try {
      await fetch(`${API_BASE}/api/history/${roomId}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index })
      });
      // server will broadcast updated content
      await load();
    } catch (error) {
      console.error('Failed to restore version:', error);
    }
  };

  useEffect(() => { load(); }, [roomId]);

  const formatFileSize = (chars) => {
    if (chars < 1024) return `${chars} chars`;
    if (chars < 1024 * 1024) return `${(chars / 1024).toFixed(1)} KB`;
    return `${(chars / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-sm shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-white font-semibold">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <History size={18} className="text-blue-400" />
          </div>
          <span className="text-lg">Version History</span>
        </div>
        <button 
          onClick={load} 
          className="px-3 py-2 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded-lg cursor-pointer transition-colors flex items-center gap-2"
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-8 text-gray-400">
          <RefreshCw size={32} className="mx-auto mb-2 text-gray-500 animate-spin" />
          <div className="text-sm">Loading versions...</div>
        </div>
      ) : versions.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <History size={32} className="mx-auto mb-2 text-gray-500" />
          <div className="text-sm">No versions yet</div>
          <div className="text-xs text-gray-500 mt-1">Start editing to create versions</div>
        </div>
      ) : (
        <div className="space-y-3 max-h-64 overflow-auto">
          {versions.map((v) => (
            <div 
              key={v.index} 
              className="flex items-center justify-between bg-slate-700/50 hover:bg-slate-700 transition-all p-3 rounded-lg border border-slate-600 hover:border-slate-500"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="p-2 bg-slate-600 rounded-lg">
                  <FileText size={16} className="text-gray-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-gray-200 font-medium truncate">
                    Version {v.index + 1}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      {formatDate(v.createdAt)}
                    </div>
                    <div className="flex items-center gap-1">
                      <span>•</span>
                      {formatFileSize(v.size)}
                    </div>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => restore(v.index)} 
                className="px-3 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors flex items-center gap-2 font-medium shadow-md hover:shadow-lg"
                title="Restore this version"
              >
                <RotateCcw size={14} />
                Restore
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Footer Info */}
      {versions.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-600">
          <div className="text-xs text-gray-400 text-center">
            {versions.length} version{versions.length !== 1 ? 's' : ''} available
          </div>
        </div>
      )}
    </div>
  );
};

export default VersionHistory;
