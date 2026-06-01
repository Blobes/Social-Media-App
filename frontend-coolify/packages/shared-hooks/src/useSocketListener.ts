"use client";

import { useEffect, useRef } from "react";
import { useSocketStore } from "./store/useSocketStore";

/**
 * Attaches a persistent event listener to the active WebSocket gateway session.
 */
export const useSocketListener = <T = any>(
  eventName: string,
  callback: (data: T) => void,
): void => {
  const savedCallback = useRef<(data: T) => void>(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    const socket = useSocketStore.getState().socket;
    if (!socket) return;

    const listenerHandler = (data: T) => {
      savedCallback.current(data);
    };

    socket.on(eventName, listenerHandler);

    return () => {
      socket.off(eventName, listenerHandler);
    };
  }, [eventName]);
};
