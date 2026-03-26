import React, { useEffect } from 'react';
import useStore from '../store';
import { MessageSquare, Hash, Settings, Wifi, WifiOff } from 'lucide-react';
import clsx from 'clsx';
import { getBackendUrl } from '../lib/socket';

import UserProfile from './UserProfile';
import { useState } from 'react';

export function Sidebar() {
  const [showProfile, setShowProfile] = useState(false);
  const { user, token, chats, setChats, activeChatId, setActiveChat, socketStatus } = useStore();
  const BACKEND_URL = getBackendUrl();

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/chats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) setChats(await res.json());
      } catch (e) {
        console.error('Failed to load chats');
      }
    };
    if (token) fetchChats();
  }, [token, setChats]);

  return (
    <div className="w-80 h-full bg-black/40 backdrop-blur-md border-r border-white/5 flex flex-col relative">
      {showProfile && <UserProfile onClose={() => setShowProfile(false)} />}
      
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between group/header">
        <div 
          onClick={() => setShowProfile(true)}
          className="flex items-center space-x-3 cursor-pointer p-1 -m-1 rounded-lg hover:bg-white/5 transition-colors flex-1 min-w-0 mr-2"
        >
          <div className="relative flex-shrink-0">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-[0_0_15px_rgba(79,70,229,0.5)] overflow-hidden border border-white/10">
              {user?.avatar ? (
                <img src={`${BACKEND_URL}${user.avatar}`} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                (user?.nickname?.[0] || user?.username[0])?.toUpperCase()
              )}
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#1a1a1c] rounded-full z-10"></div>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-white font-semibold leading-tight truncate">{user?.nickname || user?.username}</h2>
            <div className="flex items-center space-x-1 text-[10px] text-white/50 truncate mt-0.5">
              {socketStatus === 'connected' ? <Wifi className="w-3 h-3 text-green-400 flex-shrink-0" /> : <WifiOff className="w-3 h-3 text-red-400 flex-shrink-0" />}
              <span className="truncate">{socketStatus === 'connected' ? 'Network Synced' : 'Reconnecting...'}</span>
            </div>
          </div>
        </div>
        <button onClick={() => setShowProfile(true)} className="text-white/50 hover:text-white transition-colors flex-shrink-0">
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Search */}
      <div className="p-4">
        <div className="bg-white/5 rounded-xl flex items-center px-3 py-2 border border-white/5 focus-within:border-indigo-500/50 focus-within:bg-white/10 transition-all">
          <Hash className="w-4 h-4 text-white/40 mr-2" />
          <input 
            type="text" 
            placeholder="Search network..." 
            className="bg-transparent text-sm text-white placeholder-white/40 w-full outline-none"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-1 scrollbar-hide">
        {chats.map(chat => (
          <div 
            key={chat.id}
            onClick={() => setActiveChat(chat.id)}
            className={clsx(
              "flex items-center p-3 rounded-xl cursor-pointer transition-all duration-200 group relative",
              activeChatId === chat.id ? "bg-indigo-500/20 shadow-[inset_0_0_20px_rgba(99,102,241,0.1)] border border-indigo-500/30" : "hover:bg-white/5 border border-transparent"
            )}
          >
            <div className="w-12 h-12 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center mr-3 relative text-white">
              {chat.name.includes('Global') ? <MessageSquare className="w-6 h-6 text-indigo-400" /> : chat.name[0].toUpperCase()}
              {/* Fake Unread Badge */}
              {chat.id === 1 && <div className="absolute -top-1 -right-1 bg-red-500 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-[#1a1a1c]">3</div>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline mb-1">
                <h3 className="text-sm font-semibold text-white/90 truncate">{chat.name}</h3>
                <span className="text-[10px] text-white/40">12:34</span>
              </div>
              <p className="text-xs text-white/50 truncate">
                {chat.name.includes('Global') ? "Welcome to the central node." : "End-to-end encrypted session established."}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer / Folders */}
      <div className="p-4 border-t border-white/5 bg-black/20 backdrop-blur-xl">
        <div className="flex justify-between">
          {['All', 'Direct', 'Groups', 'Bots'].map((folder, i) => (
            <button key={folder} className={clsx(
              "text-xs font-medium px-3 py-1.5 rounded-lg transition-colors",
              i === 0 ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white hover:bg-white/5"
            )}>
              {folder}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
