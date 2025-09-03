import React, { useMemo, useState, useEffect } from "react";
import { Copy, LogOut, Users, Wifi, WifiOff, ChevronDown, ChevronRight, History as HistoryIcon, MessageSquare, FolderOpen, ChevronsLeft, Settings, Menu } from "lucide-react";
import { useEditor } from "../context/EditorContext";
import { copyText } from "../utils/clipboard";

import Chat from "./Chat";
import VersionHistory from "./VersionHistory";
import LocalFiles from "./LocalFiles";

const Sidebar = ({ userData, onLeave, onCollapse }) => {
  const { connected, users } = useEditor();
  const [copied, setCopied] = useState(false);
  const [activePanel, setActivePanel] = useState('explorer');
  const connectedUsers = useMemo(() => {
    const me = userData?.username;
    return (users || []).filter((u) => (me ? u !== me : true));
  }, [users, userData?.username]);

  useEffect(() => {
    const handler = (e) => {
      const id = e?.detail;
      if (typeof id === 'string') setActivePanel(id);
    };
    window.addEventListener('codesync:set-panel', handler);
    return () => window.removeEventListener('codesync:set-panel', handler);
  }, []);

  const handleCopyRoomId = async () => {
    const toCopy = userData?.roomId || "default";
    const ok = await copyText(toCopy);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return;
    }
    try {
      // final fallback: show prompt so user can copy manually
      window.prompt("Copy room ID", toCopy);
    } catch (_) {}
  };

  const handleLeave = () => {
    if (window.confirm("Are you sure you want to leave this room?")) {
      onLeave();
    }
  };

  return (
    <div className="h-full flex flex-row bg-slate-900 border-r border-slate-800">
      {/* Activity bar (VS Code style) */}
      <div className="w-14 h-full flex flex-col items-center justify-between bg-slate-950 border-r border-slate-800 p-4">
        <div className="flex flex-col items-center gap-2">
          {/* Toggle/collapse button at the top */}
          <button
            onClick={onCollapse}
            title="Toggle Panels"
            className="w-10 h-10 rounded-md cursor-pointer flex items-center justify-center text-slate-200 bg-slate-800/70 hover:bg-slate-700"
          >
            <Menu size={18} />
          </button>
          <div className="h-2 w-auto" />
          <button onClick={() => setActivePanel('explorer')} className={`w-10 h-10 rounded-md  cursor-pointer flex items-center justify-center ${activePanel==='explorer' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800/70'}`} title="Explorer"><FolderOpen size={18} /></button>
          <button onClick={() => setActivePanel('users')} className={`w-10 h-10 rounded-md cursor-pointer flex items-center justify-center ${activePanel==='users' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800/70'}`} title="Users"><Users size={18} /></button>
          <button onClick={() => setActivePanel('chat')} className={`w-10 h-10 rounded-md cursor-pointer flex items-center justify-center ${activePanel==='chat' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800/70'}`} title="Chat"><MessageSquare size={18} /></button>
          <button onClick={() => setActivePanel('history')} className={`w-10 h-10 rounded-md cursor-pointer flex items-center justify-center ${activePanel==='history' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800/70'}`} title="History"><HistoryIcon size={18} /></button>
          <button onClick={() => setActivePanel('settings')} className={`w-10 h-10 rounded-md cursor-pointer flex items-center justify-center ${activePanel==='settings' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800/70'}`} title="Settings"><Settings size={18} /></button>
        </div>
        <div />
      </div>

      {/* Side panel */}
      <div className=" flex flex-col bg-slate-900">
        {/* Panel header */}
        <div className="h-12 flex items-center justify-between px-4 bg-slate-900 border-b border-slate-800">
          <div className="text-sm font-semibold text-slate-200">
            {activePanel === 'explorer' && 'EXPLORER'}
            {activePanel === 'users' && 'USERS'}
            {activePanel === 'chat' && 'CHAT'}
            {activePanel === 'history' && 'HISTORY'}
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} title={connected ? 'Connected' : 'Disconnected'} />
            <span className="text-xs text-slate-400 font-mono">{(connectedUsers?.length||0)+1}</span>
          </div>
        </div>

        {/* Panel content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activePanel === 'explorer' && <LocalFiles />}

          {activePanel === 'users' && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-600/20 border border-blue-500/30">
                <div className="w-8 h-8 flex items-center justify-center rounded-full text-white font-bold bg-blue-600 text-sm shadow-lg">
                  {userData?.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1">
                  <div className="text-white font-medium">{userData?.username || 'User'}</div>
                  <div className="text-blue-400 text-xs">(You)</div>
                </div>
              </div>
              {connectedUsers.length > 0 ? (
                connectedUsers.map((user, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700">
                    <div className="w-8 h-8 flex items-center justify-center rounded-full text-white font-bold bg-slate-600 text-sm">
                      {user[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="text-white font-medium truncate">{user}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-400 text-sm bg-slate-800 rounded-lg border border-slate-700">
                  <Users size={20} className="mx-auto mb-2 text-gray-500" />
                  <div>No other users connected</div>
                </div>
              )}
            </div>
          )}

          {activePanel === 'chat' && (
            <Chat userData={userData} />
          )}

          {activePanel === 'history' && (
            <VersionHistory roomId={userData?.roomId || 'default'} />
          )}

          {activePanel === 'settings' && (
            <div className="space-y-3">
              <div className="text-sm font-semibold text-slate-200">Theme</div>
              <div className="grid grid-cols-1 gap-2">
                <button onClick={() => window.dispatchEvent(new CustomEvent('codesync:set-theme', { detail: 'vs-dark' }))} className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-left cursor-pointer">Dark</button>
                <button onClick={() => window.dispatchEvent(new CustomEvent('codesync:set-theme', { detail: 'vs-light' }))} className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-left cursor-pointer">Light</button>
                <button onClick={() => window.dispatchEvent(new CustomEvent('codesync:set-theme', { detail: 'hc-black' }))} className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-left cursor-pointer">High Contrast</button>
              </div>
              <div className="text-xs text-slate-400">Changes apply immediately</div>
            </div>
          )}
        </div>

        {/* Panel footer (room actions) */}
        <div className="p-3 border-t border-slate-800 space-y-2 bg-slate-900/80">
          <div className="flex items-center gap-2">
            <div className="text-[10px] text-slate-400 font-semibold">ROOM ID</div>
            <button onClick={handleCopyRoomId} className="ml-auto text-xs text-blue-300 hover:text-white cursor-pointer">
              <Copy size={14} className="inline mr-1" /> {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <div className="text-blue-300 font-mono text-[11px] break-all bg-slate-950 px-2 py-2 rounded border border-slate-800">
            {userData?.roomId || 'default'}
          </div>
          <button
            onClick={handleLeave}
            className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 cursor-pointer text-white py-2.5 rounded-lg transition-all font-medium"
          >
            <LogOut size={16} /> Leave Room
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
