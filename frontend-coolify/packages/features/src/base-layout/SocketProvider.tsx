"use client";

import React, { useEffect } from "react";
import { useGlobalStore, useSocketStore } from "@repo/shared-hooks";

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const token = useGlobalStore((state) => state.accessToken);
  const initializeSocket = useSocketStore((state) => state.initializeSocket);
  const disconnectSocket = useSocketStore((state) => state.disconnectSocket);

  useEffect(() => {
    if (token) {
      initializeSocket(token);
    } else {
      disconnectSocket();
    }

    return () => {
      disconnectSocket();
    };
  }, [token, initializeSocket, disconnectSocket]);

  return <>{children}</>;
}
