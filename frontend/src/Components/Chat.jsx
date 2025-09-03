import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Send, MessageSquare } from 'lucide-react';
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
    <div className="flex flex-col h-80 bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-lg">
      {/* Chat Header */}
      <div className="bg-slate-700/50 px-4 py-3 border-b border-slate-600">
        <div className="flex items-center gap-2 text-white font-semibold">
          <MessageSquare size={18} className="text-blue-400" />
          Team Chat
        </div>
        <div className="text-xs text-gray-400 mt-1">
          {messages.length} message{messages.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Messages */}
      <div ref={listRef} className="flex-1 overflow-auto px-4 py-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <MessageSquare size={32} className="mx-auto mb-2 text-gray-500" />
            <div className="text-sm">No messages yet</div>
            <div className="text-xs text-gray-500 mt-1">Start the conversation!</div>
          </div>
        ) : (
          messages.map((m, i) => {
            const isMe = m.username === username;
            return (
              <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                {!isMe && (
                  <div className="mr-3 mt-1 w-8 h-8 flex items-center justify-center rounded-full bg-slate-600 text-white text-sm font-bold flex-shrink-0 shadow-md">
                    {m.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                <div className={`max-w-[80%] ${isMe ? 'order-2' : 'order-1'}`}>
                  {!isMe && (
                    <div className="text-xs text-blue-300 font-medium mb-1 ml-1">
                      {m.username}
                    </div>
                  )}
                  <div className={`px-4 py-2 rounded-2xl text-sm leading-relaxed ${
                    isMe 
                      ? 'bg-blue-600 text-white rounded-br-md' 
                      : 'bg-slate-700 text-gray-100 rounded-bl-md border border-slate-600'
                  }`}>
                    <div className="whitespace-pre-wrap break-words">{m.message}</div>
                  </div>
                  <div className={`text-xs text-gray-400 mt-1 px-1 ${
                    isMe ? 'text-right' : 'text-left'
                  }`}>
                    {new Date(m.timestamp || Date.now()).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={onSend} className="p-4 bg-slate-700/30 border-t border-slate-600">
        <div className="flex gap-3">
          <input
            className="flex-1 bg-slate-700 text-white rounded-xl px-4 py-3 text-sm border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-gray-400"
            placeholder="Type your message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { 
              if (e.key === 'Enter' && !e.shiftKey) { 
                e.preventDefault(); 
                onSend(e); 
              } 
            }}
          />
          <button 
            type="submit" 
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm cursor-pointer transition-colors shadow-md hover:shadow-lg flex items-center gap-2 font-medium"
            disabled={!text.trim()}
          >
            <Send size={16} />
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chat;
