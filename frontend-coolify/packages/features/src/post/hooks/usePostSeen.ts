"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CachedItem, IPost } from "@repo/core";

/**
 * Marks a post as viewed with a timestamp.
 * Guarded against unnecessary cache updates that cause scroll jumping.
 */
export const usePostSeen = (post: CachedItem<IPost>, queryKey: string[]) => {
  const queryClient = useQueryClient();
  const elementRef = useRef<HTMLElement | null>(null);

  // Use a ref to track if we've already handled this specific ID in this mount cycle
  const hasSeen = useRef(false);

  useEffect(() => {
    // If the post already has a timestamp or we've processed it, don't bother
    if (post.lastViewed || hasSeen.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;

        if (entry.isIntersecting && !hasSeen.current) {
          hasSeen.current = true;
          const specificKey = [...queryKey, post.data._id];

          /**
           * Use an updater function that checks if changes are actually needed.
           * This prevents triggering a re-render if the data is identical.
           */
          queryClient.setQueryData(
            specificKey,
            (oldData: CachedItem<IPost> | undefined) => {
              if (oldData?.lastViewed) return oldData;

              return {
                ...(oldData || post),
                lastViewed: new Date(),
              };
            },
          );

          if (elementRef.current) {
            observer.unobserve(elementRef.current);
          }
        }
      },
      { threshold: 0.5 },
    );

    const currentElement = elementRef.current;
    if (currentElement) {
      observer.observe(currentElement);
    }

    return () => {
      observer.disconnect();
    };
    // Removed 'post' from dependencies to prevent observer cycles
    // Only re-run if the ID or query target changes
  }, [post.data._id, queryKey, queryClient]);

  return { elementRef };
};
