"use client";

import { useEffect, useRef } from "react";
import { IAuthor, IGist, IPost, IPostType, IStake, IUser } from "@repo/types";
import { cachePost } from "@repo/helpers";
import { Box } from "@mui/material";

interface ObserverProps {
    post: IGist | IStake;
    type: IPostType;
    children: React.ReactNode;
}

export const PostObserver = ({ post, type, children }: ObserverProps) => {
    const elementRef = useRef<HTMLDivElement>(null);
    const postData = { ...post, type } as IPost

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    // The user has scrolled to this post!
                    cachePost(postData);
                    // Once cached, stop observing this specific instance
                    observer.unobserve(entries[0].target);
                }
            },
            { threshold: 0.5 } // Trigger when 50% of the post is visible
        );

        if (elementRef.current) {
            observer.observe(elementRef.current);
        }

        return () => observer.disconnect();
    }, [post]);

    return <Box ref={elementRef}>{children}</Box>;
};