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
const DAY_IN_MS = 1000 _ 60 _ 60 \* 24;
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
console.log(`Cache Cleanup Sync: Kept ${activePosts.length} posts.`);
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
