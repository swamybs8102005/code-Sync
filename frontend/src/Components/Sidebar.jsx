import React, { useMemo, useState } from "react";
import { Copy, LogOut, Users, Wifi, WifiOff, ChevronDown, ChevronRight, History as HistoryIcon, MessageSquare, FolderOpen, ChevronsLeft } from "lucide-react";
import { useEditor } from "../context/EditorContext";
import { copyText } from "../utils/clipboard";

import Chat from "./Chat";
import VersionHistory from "./VersionHistory";
import LocalFiles from "./LocalFiles";

const Sidebar = ({ userData, onLeave, onCollapse }) => {
  const { connected, users } = useEditor();
  const [copied, setCopied] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showLocal, setShowLocal] = useState(false);
  const connectedUsers = useMemo(() => {
    const me = userData?.username;
    return (users || []).filter((u) => (me ? u !== me : true));
  }, [users, userData?.username]);

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
    <div className="w-64 h-full flex-shrink-0 bg-slate-800 flex flex-col justify-between shadow-lg">
      {/* Room Info */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <div className="text-white font-semibold">Room</div>
          {onCollapse && (
            <button onClick={onCollapse} className="text-gray-300 hover:text-white cursor-pointer" title="Hide panels">
              <ChevronsLeft size={18} />
            </button>
          )}
        </div>
        <div className="bg-slate-700 p-3 rounded-lg">
          <h3 className="text-white text-sm font-medium mb-2">Room ID</h3>
          <p className="text-green-400 font-mono text-xs break-all">
            {userData?.roomId || "default"}
          </p>
          <div className="flex items-center gap-2 mt-2">
            {connected ? (
              <Wifi size={14} className="text-green-400" />
            ) : (
              <WifiOff size={14} className="text-red-400" />
            )}
            <span
              className={`text-xs ${
                connected ? "text-green-400" : "text-red-400"
              }`}
            >
              {connected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>
      </div>

      {/* Explorer only */}
      <div className="flex-1 p-4 overflow-y-auto">
        <LocalFiles />
      </div>

      {/* Bottom icon panels */}
      <div className="px-4">
        <div className="flex items-center justify-around py-2 bg-slate-700/60 rounded-md">
          <button onClick={() => setActivePanel(activePanel === 'users' ? null : 'users')} className="text-gray-200 hover:text-white cursor-pointer" title="Users">
            <Users size={18} />
          </button>
          <button onClick={() => setActivePanel(activePanel === 'chat' ? null : 'chat')} className="text-gray-200 hover:text-white cursor-pointer" title="Chat">
            <MessageSquare size={18} />
          </button>
          <button onClick={() => setActivePanel(activePanel === 'history' ? null : 'history')} className="text-gray-200 hover:text-white cursor-pointer" title="History">
            <HistoryIcon size={18} />
          </button>
        </div>
        {activePanel === 'users' && (
          <div className="mt-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-600/20 border border-blue-500/30 mb-2">
              <div className="w-8 h-8 flex items-center justify-center rounded-full text-white font-bold bg-blue-600">
                {userData?.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className="text-white flex-1">{userData?.username || 'User'}</span>
              <span className="text-blue-400 text-xs">(You)</span>
            </div>
            {connectedUsers.length > 0 ? (
              connectedUsers.map((user, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-slate-700 hover:bg-slate-600 transition">
                  <div className="w-8 h-8 flex items-center justify-center rounded-full text-white font-bold bg-slate-600">
                    {user[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-white flex-1">{user}</span>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-400 text-sm">No other users connected</div>
            )}
          </div>
        )}
        {activePanel === 'chat' && (
          <div className="mt-3">
            <Chat userData={userData} />
          </div>
        )}
        {activePanel === 'history' && (
          <div className="mt-3">
            <VersionHistory roomId={userData?.roomId || 'default'} />
          </div>
        )}
      </div>

      {/* Bottom actions */}
      <div className="p-4 border-t border-slate-700 flex flex-col gap-3">
        <button
          onClick={handleCopyRoomId}
          className={`flex items-center cursor-pointer justify-center gap-2 py-2 rounded-lg transition ${
            copied
              ? "bg-green-600 text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          <Copy size={18} /> {copied ? "Copied!" : "Copy Room ID"}
        </button>
        <button
          onClick={handleLeave}
          className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 cursor-pointer text-white py-2 rounded-lg transition"
        >
          <LogOut size={18} /> Leave Room
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
