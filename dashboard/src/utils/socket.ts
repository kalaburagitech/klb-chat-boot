import { io, Socket } from 'socket.io-client';

// Socket.io is deprecated in favor of Convex
export const getSocket = () => {
  return {
    on: () => {},
    off: () => {},
    emit: () => {},
    disconnect: () => {}
  } as any;
};
