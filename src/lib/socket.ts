import { io, Socket } from 'socket.io-client';
import useStore from '../store';

let socket: Socket | null = null;

export const getBackendUrl = () => {
  const state = useStore.getState();
  if (state.serverType === 'custom') {
    return state.customServerUrl;
  }
  if (state.serverType === 'local') {
    return 'http://localhost:10000';
  }
  // Main server
  return window.location.origin.includes('localhost') ? 'http://localhost:10000' : '';
};

export const connectSocket = (token: string) => {
  if (socket) socket.disconnect();
  
  const url = getBackendUrl();
  const state = useStore.getState();
  
  // NORM specific logic (mock proxy logic for socket if useProxy is true)
  const socketOptions: any = {
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  };

  if (state.useProxy && state.user?.subscription === 'NORM') {
    socketOptions.extraHeaders = {
      'x-bebra-proxy': 'enabled'
    };
  }
  
  socket = io(url, socketOptions);

  socket.on('connect', () => {
    useStore.getState().setSocketStatus('connected');
  });

  socket.on('disconnect', () => {
    useStore.getState().setSocketStatus('disconnected');
  });

  socket.on('connect_error', () => {
    useStore.getState().setSocketStatus('error');
  });

  socket.on('message:receive', (msg) => {
    useStore.getState().addMessage(msg);
  });

  socket.on('message:status', ({ id, status }) => {
    useStore.getState().updateMessageStatus(id, status);
  });

  socket.on('user:status', ({ id, status, last_seen }) => {
    useStore.getState().updateUserStatus(id, status, last_seen);
  });

  socket.on('user:update', ({ userId, nickname, avatar }) => {
    useStore.getState().updateUserProfile(userId, nickname, avatar);
  });

  socket.on('typing:update', ({ chatId, userId, username, isTyping }) => {
    useStore.getState().setTyping(chatId, userId, username, isTyping);
  });

  return socket;
};

export const getSocket = () => socket;
