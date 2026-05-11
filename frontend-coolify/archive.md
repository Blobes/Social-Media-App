export interface Cached {
post: IPost;
lastViewed: Date;
}
export const cachePost = async (post: IPost) => {
const now = new Date();

// Parallel fetch for speed
const [savedPost, authorDict] = await Promise.all([
get("cached-posts") as Promise<Cached[] | undefined>,
get("cached-authors") as Promise<Record<string, IPostAuthor>>,
]);

const postList = savedPost || [];
const authors = authorDict || {};

// PERFORMANCE CHECK: Does this post and its author already exist?
const alreadyCached = postList.find((item) => item.post.\_id === post.\_id);
const authorExists = authors[post.authorId];

if (alreadyCached && authorExists) return;

// Update Feed Map (Upsert logic)
const postMap = new Map<string, Cached>();
postList.forEach((item) => postMap.set(item.post.\_id, item));
postMap.set(post.\_id, { post, lastViewed: now });

// Cache Author
authors[post.authorId] = post.author;

// Save immediate changes
await Promise.all([
set("cached-posts", Array.from(postMap.values())),
set("cached-authors", authors),
]);
};

export const getCachedPosts = async (): Promise<IPost[]> => {
try {
const cachedPost = (await get("cached-posts")) as Cached[] | undefined;

    if (!cachedPost || !Array.isArray(cachedPost)) {
      return [];
    }
    // Sort and map to return just the Post objects
    return cachedPost
      .sort((a, b) => {
        // Ensure we compare timestamps correctly
        const timeA = new Date(a.lastViewed).getTime();
        const timeB = new Date(b.lastViewed).getTime();
        return timeB - timeA; // Descending order (newest first)
      })
      .map((item) => item.post);

} catch (error) {
console.error("Error retrieving offline posts:", error);
return [];
}
};

export const cleanupCache = async () => {
const now = new Date();
const DAY*IN_MS = 1000 * 60 \_ 60 \* 24;
const EXPIRY_DAYS = 7;

// 1. Retrieve current data
const savedPosts = ((await get("cached-posts")) as Cached[]) || [];
const authorDictionary = (await get("cached-authors")) || {};

// 2. Filter posts older than 7 days
const activePosts = savedPosts.filter((item) => {
const lastViewed = new Date(item.lastViewed);
const diffInDays = (now.getTime() - lastViewed.getTime()) / DAY_IN_MS;
return diffInDays <= EXPIRY_DAYS;
});

// 3. Author Cleanup: Only keep authors who have at least one post remaining
const activeAuthorIds = new Set(
activePosts.map((item) => item.post.authorId),
);

const updatedAuthors: Record<string, IPostAuthor> = {};
Object.keys(authorDictionary).forEach((id) => {
if (activeAuthorIds.has(id)) {
updatedAuthors[id] = authorDictionary[id];
}
});

// 4. Atomic update
await Promise.all([
set("cached-posts", activePosts),
set("cached-authors", updatedAuthors),
]);
console.log(`Cache Cleanup Sync: Kept ${activePosts.length} posts today.`);
};

export const getCachedAuthor = async (
authorId: string,
): Promise<IPostAuthor | undefined> => {
try {
// 1. Fetch the entire dictionary from IndexedDB
const cachedAuthors =
await get<Record<string, IPostAuthor>>("cached-authors");
// 2. Return the specific author or null if they don't exist
return cachedAuthors && cachedAuthors[authorId];
} catch (error) {
console.error(`Error fetching author ${authorId} from cache:`, error);
return;
}
};

services:

# --- THE SHELL (Main Entry Point) ---

shell-app:
build:
context: .
args: # This pulls the value from Coolify's env and passes it to the Docker build process - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
      dockerfile_inline: |
        FROM node:20-alpine AS builder
        # We must declare ARGs in every stage that needs them
        ARG NEXT_PUBLIC_API_URL
        ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

        WORKDIR /app
        RUN corepack enable && corepack prepare pnpm@latest --activate
        COPY . .
        RUN pnpm install --frozen-lockfile
        # Next.js will now find the ENV variable during this build step
        RUN pnpm --filter @repo/shell build

        FROM node:20-alpine AS runner
        WORKDIR /app
        ENV NODE_ENV production
        # Standalone copy logic (Exactly as you had it)
        COPY --from=builder /app/apps/shell/.next/standalone ./
        COPY --from=builder /app/apps/shell/.next/static ./apps/shell/.next/static
        COPY --from=builder /app/apps/shell/public ./apps/shell/public
        EXPOSE 3000
        CMD ["node", "apps/shell/server.js"]
    environment:
      - PORT=3000
      - AUTH_URL=http://auth-app:3002
      - POST_URL=http://post-app:3003
      - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.shell.rule=Host(`funstakes.net`) || Host(`www.funstakes.net`)"
      - "traefik.http.routers.shell.entrypoints=https"
      - "traefik.http.routers.shell.tls=true"
      - "coolify.exposed_port=3000"
    networks:
      - coolify

# --- AUTH MFE ---

auth-app:
build:
context: .
args: - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
      dockerfile_inline: |
        FROM node:20-alpine AS builder
        ARG NEXT_PUBLIC_API_URL
        ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY . .
RUN pnpm install && pnpm --filter @repo/auth build
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3002
COPY --from=builder /app/apps/auth/.next/standalone ./
COPY --from=builder /app/apps/auth/.next/static ./apps/auth/.next/static
CMD ["node", "apps/auth/server.js"]
environment: - PORT=3002 - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
networks: - coolify

# --- POST MFE ---

post-app:
build:
context: .
args: - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
      dockerfile_inline: |
        FROM node:20-alpine AS builder
        ARG NEXT_PUBLIC_API_URL
        ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY . .
RUN pnpm install && pnpm --filter @repo/post build
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3003
COPY --from=builder /app/apps/post/.next/standalone ./
COPY --from=builder /app/apps/post/.next/static ./apps/post/.next/static
CMD ["node", "apps/post/server.js"]
environment: - PORT=3003 - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
networks: - coolify

networks:
coolify:
external: true

"use client";

import React, { useEffect, useRef } from "react";
import { IGist, IPost, PostType, IStake } from "@repo/core";
import { cachePost } from "@repo/helpers";
import { Box } from "@mui/material";

interface ObserverProps {
post: IGist | IStake;
type: PostType;
children: React.ReactNode;
}

export const PostObserver = ({ post, type, children }: ObserverProps) => {
const elementRef = useRef<HTMLDivElement>(null);
const postData = { ...post, postType: type } as IPost;

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
{ threshold: 0.5 }, // Trigger when 50% of the post is visible
);

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();

}, [post]);

return <Box ref={elementRef}>{children}</Box>;
};
