import { create } from "zustand";
import { io, Socket } from "socket.io-client";

interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  initializeSocket: (token: string) => void;
  disconnectSocket: () => void;
}

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Global store for managing the active real-time Socket.IO connection instance.
 */
export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,

  initializeSocket: (token: string) => {
    // Prevent duplicate connections if already active
    if (get().socket?.connected) return;

    const socketInstance = io(SOCKET_URL, {
      auth: {
        token: `Bearer ${token}`,
      },
      withCredentials: true,
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstance.on("connect", () => {
      set({ isConnected: true });
    });

    socketInstance.on("disconnect", () => {
      set({ isConnected: false });
    });

    set({ socket: socketInstance });
  },

  disconnectSocket: () => {
    const currentSocket = get().socket;
    if (currentSocket) {
      currentSocket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },
}));
