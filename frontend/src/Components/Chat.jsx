import React, { useMemo, useRef, useEffect, useState } from 'react';
import { useEditor } from '../context/EditorContext';

const Chat = ({ userData }) => {
  const { messages, sendChat } = useEditor();
  const [text, setText] = useState('');
  const listRef = useRef(null);
  const roomId = userData?.roomId || 'default';
  const username = userData?.username || 'User';

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const onSend = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    sendChat(roomId, username, text.trim());
    setText('');
  };

  return (
    <div className="flex flex-col h-60 bg-slate-800 border border-slate-700 rounded-md overflow-hidden">
      <div ref={listRef} className="flex-1 overflow-auto p-3 space-y-2">
        {messages.map((m, i) => (
          <div key={i} className="text-sm">
            <span className="text-blue-300 font-semibold">{m.username}:</span>{' '}
            <span className="text-gray-200">{m.message}</span>
            <span className="text-xs text-gray-500 ml-2">{new Date(m.timestamp || Date.now()).toLocaleTimeString()}</span>
          </div>
        ))}
      </div>
      <form onSubmit={onSend} className="flex p-2 gap-2 border-t border-slate-700">
        <input
          className="flex-1 bg-slate-700 text-white rounded-md px-3 py-2 text-sm border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm cursor-pointer">Send</button>
      </form>
    </div>
  );
};

export default Chat;
