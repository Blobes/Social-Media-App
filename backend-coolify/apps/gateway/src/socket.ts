import { Server } from "socket.io";
import { AuthenticatedSocket } from "@repo/shared";

/**
 * Registers global Gateway socket listeners for connected clients.
 */
export const registerSocketListeners = (io: Server): void => {
  io.on("connection", (socket: AuthenticatedSocket) => {
    const user = socket.user;
    console.log(
      `📡 Socket connected to Gateway: User ${user?.id} (${user?.username})`,
    );

    // Responds to heartbeats or latency checks from connected clients.
    socket.on("ping_server", (data: any) => {
      socket.emit("pong_server", {
        message: "Gateway connection active",
        timestamp: Date.now(),
      });
    });
  });
};
