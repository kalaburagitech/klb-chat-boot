import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    let backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

    // Smart Fallback for Production
    if (!backendUrl && typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      backendUrl = 'https://klb-chat-boot-production.up.railway.app';
    }

    backendUrl = backendUrl || 'http://localhost:4005';
    socket = io(backendUrl);
  }
  return socket;
};
