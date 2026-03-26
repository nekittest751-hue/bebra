import { create } from 'zustand';

interface User {
  id: number;
  username: string;
  nickname?: string;
  avatar?: string;
  subscription?: string;
  role: string;
  status: string;
  last_seen?: string;
}

interface Message {
  id: number;
  chat_id: number;
  sender_id: number;
  sender_username: string;
  sender_nickname?: string;
  sender_avatar?: string;
  content: string;
  status: 'sent' | 'delivered' | 'read';
  type: string;
  created_at: string;
}

interface Chat {
  id: number;
  name: string;
  type: string;
}

interface StoreState {
  user: User | null;
  token: string | null;
  socketStatus: 'connected' | 'disconnected' | 'error' | 'connecting';
  
  language: string;
  serverType: 'main' | 'local' | 'custom';
  customServerUrl: string;
  useProxy: boolean;
  proxySettings: { host: string; port: string; user: string; pass: string; };
  
  chats: Chat[];
  activeChatId: number | null;
  messages: Record<number, Message[]>;
  typingUsers: Record<number, string[]>;
  usersStatus: Record<number, { status: string; last_seen?: string }>;

  setServerSettings: (settings: { serverType?: 'main' | 'local' | 'custom', customServerUrl?: string, useProxy?: boolean }) => void;
  setProxySettings: (settings: { host?: string; port?: string; user?: string; pass?: string }) => void;
  setLanguage: (lang: string) => void;
  setUser: (user: User | null, token?: string) => void;
  setSocketStatus: (status: 'connected' | 'disconnected' | 'error' | 'connecting') => void;
  setChats: (chats: Chat[]) => void;
  setActiveChat: (id: number) => void;
  setMessages: (chatId: number, msgs: Message[]) => void;
  addMessage: (msg: Message) => void;
  updateMessageStatus: (msgId: number, status: 'sent' | 'delivered' | 'read') => void;
  setTyping: (chatId: number, userId: number, username: string, isTyping: boolean) => void;
  updateUserStatus: (userId: number, status: string, last_seen?: string) => void;
  updateUserProfile: (userId: number, nickname: string | undefined, avatar: string | undefined) => void;
  logout: () => void;
}

const useStore = create<StoreState>((set) => ({
  user: null,
  token: null,
  socketStatus: 'disconnected',
  
  language: localStorage.getItem('bebra_lang') || 'ru',
  serverType: (localStorage.getItem('bebra_server_type') as 'main' | 'local' | 'custom') || 'main',
  customServerUrl: localStorage.getItem('bebra_custom_url') || '',
  useProxy: localStorage.getItem('bebra_use_proxy') === 'true',
  proxySettings: JSON.parse(localStorage.getItem('bebra_proxy_settings') || '{"host":"","port":"","user":"","pass":""}'),
  
  chats: [],
  activeChatId: null,
  messages: {},
  typingUsers: {},
  usersStatus: {},

  setServerSettings: (settings) => set((state) => {
    if (settings.serverType) localStorage.setItem('bebra_server_type', settings.serverType);
    if (settings.customServerUrl !== undefined) localStorage.setItem('bebra_custom_url', settings.customServerUrl);
    if (settings.useProxy !== undefined) localStorage.setItem('bebra_use_proxy', String(settings.useProxy));
    return { ...settings };
  }),
  setProxySettings: (settings) => set((state) => {
    const newSettings = { ...state.proxySettings, ...settings };
    localStorage.setItem('bebra_proxy_settings', JSON.stringify(newSettings));
    return { proxySettings: newSettings };
  }),
  setLanguage: (lang) => {
    localStorage.setItem('bebra_lang', lang);
    set({ language: lang });
  },
  setUser: (user, token) => set({ user, token: token || null }),
  setSocketStatus: (socketStatus) => set({ socketStatus }),
  setChats: (chats) => set({ chats }),
  setActiveChat: (id) => set({ activeChatId: id }),
  setMessages: (chatId, msgs) => set((state) => ({
    messages: { ...state.messages, [chatId]: msgs }
  })),
  addMessage: (msg) => set((state) => {
    const chatMsgs = state.messages[msg.chat_id] || [];
    // Prevent duplicate messages in UI by checking ID
    if (chatMsgs.find(m => m.id === msg.id)) return state;
    return {
      messages: { ...state.messages, [msg.chat_id]: [...chatMsgs, msg] }
    };
  }),
  updateMessageStatus: (msgId, status) => set((state) => {
    const newMsgs = { ...state.messages };
    for (const chatId in newMsgs) {
      newMsgs[chatId] = newMsgs[chatId].map(m => m.id === msgId ? { ...m, status } : m);
    }
    return { messages: newMsgs };
  }),
  setTyping: (chatId, userId, username, isTyping) => set((state) => {
    const currentTyping = state.typingUsers[chatId] || [];
    const newTyping = isTyping 
      ? Array.from(new Set([...currentTyping, username]))
      : currentTyping.filter(u => u !== username);
    return { typingUsers: { ...state.typingUsers, [chatId]: newTyping } };
  }),
  updateUserStatus: (userId, status, last_seen) => set((state) => ({
    usersStatus: { ...state.usersStatus, [userId]: { status, last_seen } }
  })),
  updateUserProfile: (userId, nickname, avatar) => set((state) => {
    let newUser = state.user;
    if (state.user?.id === userId) {
      newUser = { ...state.user, nickname, avatar };
    }
    const newMsgs = { ...state.messages };
    for (const chatId in newMsgs) {
      newMsgs[chatId] = newMsgs[chatId].map(m => m.sender_id === userId ? { ...m, sender_nickname: nickname, sender_avatar: avatar } : m);
    }
    return { user: newUser, messages: newMsgs };
  }),
  logout: () => set({ user: null, token: null, chats: [], activeChatId: null })
}));

export default useStore;
