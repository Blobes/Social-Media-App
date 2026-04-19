"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { IPost } from "@repo/core";

/**
 * Marks a post as viewed by updating its timestamp within a specific, granular query key.
 * This prevents the entire feed from re-rendering by avoiding broad key updates.
 */
export const usePostSeen = <T extends IPost>(post: T, queryKey: string[]) => {
  const queryClient = useQueryClient();
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // Target only the specific post using a unique query key. Format: [...baseKey, postId]
          const specificKey = [...queryKey, post._id];

          queryClient.setQueryData(specificKey, (oldData: any) => {
            // Update the existing item or create a new entry with the timestamp
            const updatedItem = oldData ? { ...oldData } : { ...post };
            return {
              ...updatedItem,
              lastViewed: new Date(),
            };
          });

          // Stop observing once the view is recorded to save resources
          if (elementRef.current) {
            observer.unobserve(elementRef.current);
          }
        }
      },
      { threshold: 0.5 },
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [post._id, queryKey, queryClient, post]);

  return { elementRef };
};
