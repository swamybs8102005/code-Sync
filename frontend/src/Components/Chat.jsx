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
    <div className="flex flex-col h-60 bg-slate-800 rounded-md overflow-hidden">
      <div ref={listRef} className="flex-1 overflow-auto px-4 py-3 space-y-2">
        {messages.map((m, i) => {
          const isMe = m.username === username;
          const bubble = `max-w-[85%] w-fit px-3 py-2 text-sm shadow rounded-2xl leading-relaxed ${isMe ? 'bg-emerald-600 text-white rounded-br-md mr-4' : 'bg-slate-700 text-gray-100 rounded-bl-md ml-4'}`;
          const timeCls = `text-[10px] mt-1 ${isMe ? 'text-emerald-200/80 text-right' : 'text-gray-400'}`;
          return (
            <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'} px-1`}>
              {!isMe && (
                <div className="mr-2 mt-1 w-7 h-7 flex items-center justify-center rounded-full bg-slate-600 text-white text-xs font-bold flex-shrink-0">
                  {m.username?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <div className={bubble}>
                {!isMe && <div className="text-[11px] text-blue-300 font-semibold mb-0.5">{m.username}</div>}
                <div className="whitespace-pre-wrap break-words">{m.message}</div>
                <div className={timeCls}>{new Date(m.timestamp || Date.now()).toLocaleTimeString()}</div>
              </div>
            </div>
          );
        })}
      </div>
      <form onSubmit={onSend} className="flex p-2 gap-2">
        <input
          className="flex-1 bg-slate-700 text-white rounded-full px-4 py-2 text-sm border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Message"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(e); } }}
        />
        <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-sm cursor-pointer">Send</button>
      </form>
    </div>
  );
};

export default Chat;
