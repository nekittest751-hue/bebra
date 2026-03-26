import React, { useEffect, useState, useRef } from 'react';
import useStore from '../store';
import { getSocket } from '../lib/socket';
import { Send, Smile, Paperclip, Mic, Video, Phone, MoreVertical, ShieldAlert, Check, CheckCheck } from 'lucide-react';
import { CallOverlay } from './CallOverlay';
import { format } from 'date-fns';
import clsx from 'clsx';

const BACKEND_URL = window.location.origin.includes('localhost') ? 'http://localhost:10000' : '';

export function ChatArea() {
  const { activeChatId, chats, messages, user, token, setMessages, typingUsers } = useStore();
  const [input, setInput] = useState('');
  const [isCalling, setIsCalling] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const activeChat = chats.find(c => c.id === activeChatId);
  const chatMessages = activeChatId ? (messages[activeChatId] || []) : [];
  const currentTyping = activeChatId ? (typingUsers[activeChatId] || []) : [];

  useEffect(() => {
    if (activeChatId && token) {
      // Fetch history
      fetch(`${BACKEND_URL}/api/chats/${activeChatId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        setMessages(activeChatId, data);
        setTimeout(scrollToBottom, 100);
      });
      // Join socket room
      const socket = getSocket();
      if (socket) socket.emit('chat:join', activeChatId);
    }
  }, [activeChatId, token, setMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, currentTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeChatId) return;
    const socket = getSocket();
    if (socket) {
      socket.emit('message:send', { chat_id: activeChatId, content: input });
      setInput('');
      socket.emit('typing:stop', activeChatId);
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    const socket = getSocket();
    if (socket && activeChatId) {
      if (e.target.value.length > 0) socket.emit('typing:start', activeChatId);
      else socket.emit('typing:stop', activeChatId);
    }
  };

  if (!activeChat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0a0a0c] relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.05)_0%,transparent_50%)]"></div>
        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 animate-pulse border border-white/10">
          <ShieldAlert className="w-10 h-10 text-white/20" />
        </div>
        <h2 className="text-2xl font-bold text-white/80 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Bebra Secure Channel</h2>
        <p className="text-white/40 mt-2 max-w-sm text-center text-sm">Select a network node from the sidebar to establish an encrypted connection.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#0a0a0c] relative z-0 shadow-[-20px_0_30px_rgba(0,0,0,0.5)]">
      {/* Background Effect */}
      <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none mix-blend-overlay z-0"></div>

      {isCalling && <CallOverlay chatName={activeChat.name} onClose={() => setIsCalling(false)} />}
      
      {/* Header */}
      <div className="h-16 bg-white/5 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-6 z-10 sticky top-0">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.2)]">
            {activeChat.name[0].toUpperCase()}
          </div>
          <div>
            <h2 className="text-white font-semibold flex items-center">
              {activeChat.name}
              {activeChat.name.includes('Global') && <ShieldAlert className="w-4 h-4 ml-2 text-indigo-400" />}
            </h2>
            <p className="text-xs text-indigo-300/70">
              {currentTyping.length > 0 ? (
                <span className="text-indigo-400 animate-pulse">{currentTyping.join(', ')} is typing...</span>
              ) : '🟢 Active Node'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4 text-white/50">
          <button onClick={() => setIsCalling(true)} className="hover:text-indigo-400 transition-colors bg-white/5 p-2 rounded-lg hover:bg-indigo-500/10"><Phone className="w-5 h-5" /></button>
          <button onClick={() => setIsCalling(true)} className="hover:text-purple-400 transition-colors bg-white/5 p-2 rounded-lg hover:bg-purple-500/10"><Video className="w-5 h-5" /></button>
          <div className="w-px h-6 bg-white/10"></div>
          <button className="hover:text-white transition-colors"><MoreVertical className="w-5 h-5" /></button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth z-10">
        {chatMessages.length === 0 && (
          <div className="text-center text-white/30 text-sm mt-10 p-4 border border-white/5 rounded-xl bg-white/5 backdrop-blur-sm mx-auto max-w-sm">
            End-to-End Encrypted Session. Messages are secured by Bebra Protocol v2.
          </div>
        )}

        {chatMessages.map((msg, idx) => {
          const isMe = msg.sender_id === user?.id;
          const isSystem = msg.type === 'system' || msg.sender_username === 'bebra-zashita-bot';
          const showAvatar = !isMe && (idx === 0 || chatMessages[idx - 1].sender_id !== msg.sender_id);

          if (isSystem) {
            return (
              <div key={msg.id} className="flex justify-center my-4">
                <div className="bg-red-500/10 border border-red-500/20 backdrop-blur-md px-4 py-2 rounded-2xl text-red-400 text-xs flex items-center shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                  <ShieldAlert className="w-4 h-4 mr-2" />
                  {msg.content}
                </div>
              </div>
            );
          }

          return (
            <div key={msg.id} className={clsx("flex flex-col group", isMe ? "items-end" : "items-start")}>
              {!isMe && showAvatar && (
                <span className="text-xs text-white/40 ml-12 mb-1 flex items-center">
                  {msg.sender_nickname || msg.sender_username}
                  {msg.sender_username === 'bebra-zashita-bot' && <span className="ml-2 text-[9px] bg-indigo-500/30 text-indigo-300 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider border border-indigo-500/30">BOT</span>}
                </span>
              )}
              <div className={clsx("flex max-w-[75%] relative", isMe ? "flex-row-reverse" : "flex-row")}>
                {!isMe && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 flex-shrink-0 mr-3 mt-auto mb-1 flex items-center justify-center text-xs font-bold text-white shadow-lg overflow-hidden border border-white/5">
                    {msg.sender_avatar ? (
                      <img src={`${BACKEND_URL}${msg.sender_avatar}`} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      (msg.sender_nickname?.[0] || msg.sender_username[0])?.toUpperCase()
                    )}
                  </div>
                )}
                
                <div className={clsx(
                  "px-5 py-3 shadow-xl backdrop-blur-md relative group/bubble transition-all",
                  isMe 
                    ? "bg-gradient-to-br from-indigo-600/90 to-purple-600/90 text-white rounded-[24px] rounded-br-[8px] border border-white/10" 
                    : "bg-white/10 text-white/90 rounded-[24px] rounded-bl-[8px] border border-white/5"
                )}>
                  <p className="leading-relaxed break-words text-[15px]">{msg.content}</p>
                  
                  <div className={clsx(
                    "flex items-center space-x-1 mt-1.5 opacity-60 text-[10px] select-none",
                    isMe ? "justify-end" : "justify-start"
                  )}>
                    <span>{format(new Date(msg.created_at || Date.now()), 'HH:mm')}</span>
                    {isMe && (
                      msg.status === 'read' ? <CheckCheck className="w-3 h-3 text-blue-300" /> :
                      msg.status === 'delivered' ? <CheckCheck className="w-3 h-3" /> :
                      <Check className="w-3 h-3" />
                    )}
                  </div>

                  {/* Reaction Popup (Hidden by default, shown on hover) */}
                  <div className={clsx(
                    "absolute top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover/bubble:opacity-100 transition-opacity bg-black/60 backdrop-blur-md p-1 rounded-full border border-white/10",
                    isMe ? "-left-16" : "-right-16"
                  )}>
                    <span className="cursor-pointer hover:scale-125 transition-transform text-sm">👍</span>
                    <span className="cursor-pointer hover:scale-125 transition-transform text-sm">❤️</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white/5 backdrop-blur-xl border-t border-white/10 z-10">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto relative flex items-end bg-black/40 border border-white/10 rounded-2xl p-2 focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
          <button type="button" className="p-3 text-white/40 hover:text-white transition-colors flex-shrink-0">
            <Paperclip className="w-5 h-5" />
          </button>
          
          <input
            type="text"
            value={input}
            onChange={handleTyping}
            placeholder="Broadcast message..."
            className="flex-1 bg-transparent border-none text-white placeholder-white/30 focus:outline-none px-2 py-3 max-h-32 text-[15px]"
          />
          
          <div className="flex items-center pr-1 flex-shrink-0">
            <button type="button" className="p-3 text-white/40 hover:text-yellow-400 transition-colors">
              <Smile className="w-5 h-5" />
            </button>
            {input.trim() ? (
              <button type="submit" className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl text-white shadow-lg shadow-indigo-500/25 hover:scale-105 transition-transform">
                <Send className="w-5 h-5 ml-0.5" />
              </button>
            ) : (
              <button type="button" className="p-3 text-white/40 hover:text-red-400 transition-colors rounded-xl">
                <Mic className="w-5 h-5" />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
