use("funstakes");

print(
  "🛠️ Starting Smart Index Registration (Checking for existing indexes)...",
);

/**
 * Helper to check if an index with specific keys already exists
 */
const indexExists = (collection, keys) => {
  const existing = db.getCollection(collection).getIndexes();
  const targetKeysJson = JSON.stringify(keys);

  return existing.some((idx) => {
    return JSON.stringify(idx.key) === targetKeysJson;
  });
};

/**
 * Enhanced helper to safely create indexes only if missing
 */
const safeCreateIndex = (collection, keys, options = {}) => {
  try {
    // Ensure collection exists
    if (!db.getCollectionNames().includes(collection)) {
      db.createCollection(collection);
      print(`📦 Created new collection: ${collection}`);
    }

    // Check if index already exists
    if (indexExists(collection, keys)) {
      print(
        `ℹ️ [${collection}] Index already exists: ${JSON.stringify(keys)} (Skipping)`,
      );
      return;
    }
    // Create the index
    db.getCollection(collection).createIndex(keys, options);
    print(`✅ [${collection}] Index created: ${JSON.stringify(keys)}`);
  } catch (err) {
    print(
      `❌ [${collection}] FAILED for ${JSON.stringify(keys)}: ${err.message}`,
    );
  }
};

// ---- INDEXES DEFINED ----

// --- 1. USER IDENTITY & VERIFICATION ---
print("--- Configuring Users ---");
safeCreateIndex("users", { email: 1 }, { unique: true });
safeCreateIndex("users", { username: 1 }, { unique: true, sparse: true });
safeCreateIndex(
  "users",
  { usernameCanonical: 1 },
  { unique: true, sparse: true },
);
safeCreateIndex("users", { phoneNumber: 1 }, { unique: true, sparse: true });
safeCreateIndex("users", { isDeactivated: 1 });
safeCreateIndex("users", { createdAt: 1 });
safeCreateIndex("users", { followersCount: 1 });
safeCreateIndex("users", {
  meritsVerification: 1,
  isPublicFigure: 1,
  isEmailVerified: 1,
});

// Deactivated Accounts model
safeCreateIndex("deactivated_accounts", { userId: 1 });
safeCreateIndex("deactivated_accounts", { reason: 1 });
safeCreateIndex("deactivated_accounts", { deactivatedAt: 1 });

//User logs model
safeCreateIndex("user_logs", { userId: 1, createdAt: -1 });
safeCreateIndex("user_logs", { category: 1, createdAt: -1 });
safeCreateIndex("user_logs", { action: 1 });

// Error logs model
safeCreateIndex("error_logs", { errorCode: 1 });
safeCreateIndex("error_logs", { statusCode: 1, createdAt: -1 });

// --- 2. SOCIAL & RELATIONSHIPS ---
print("--- Configuring Social & Relationships ---");
// Follows
safeCreateIndex("follows", { followerId: 1, followingId: 1 }, { unique: true });
safeCreateIndex("follows", { followingId: 1 });
// Blocking
safeCreateIndex(
  "blocked_users",
  { blockerId: 1, blockedId: 1 },
  { unique: true },
);

// --- 3. POST & ENGAGEMENT ---
print("--- Configuring Gists ---");
safeCreateIndex("gists", { status: 1, authorId: 1, createdAt: -1 });
safeCreateIndex("gists", { tags: 1 });
safeCreateIndex("gists", { "location.coordinates": "2dsphere" });
// Engagement
safeCreateIndex("gist_likes", { userId: 1, gistId: 1 }, { unique: true });
safeCreateIndex("bookmarks", { userId: 1, postId: 1 }, { unique: true });
safeCreateIndex("post_views", { postId: 1, userId: 1 }, { unique: true });

// --- 4. MEDIA & CONTENT ---
print("--- Configuring Media & Content ---");
// Media
safeCreateIndex("media", { sourceId: 1, sourceType: 1, order: 1 });
safeCreateIndex("media", { ownerId: 1, createdAt: -1 });
// Captions
safeCreateIndex("post_captions", { postId: 1, isLatest: 1 });
safeCreateIndex("post_captions", { postId: 1, version: -1 });

// --- 5. MODERATION & REPORTING ---
print("--- Configuring Moderation ---");
// Flagged Posts
safeCreateIndex("flagged_posts", { reviewStatus: 1, createdAt: -1 });
safeCreateIndex("flagged_posts", { postId: 1, postType: 1 });
safeCreateIndex("flagged_posts", { violationSummary: 1 });

// Reports
safeCreateIndex(
  "post_reports",
  { flaggedPostId: 1, reporterId: 1 },
  { unique: true, sparse: true },
);

// DEVICE
safeCreateIndex("devices", { lastSeenAt: 1, isPrimary: 1 });

print("🚀 Full system index registration finished!");
