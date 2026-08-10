use("funstakes");

// Create Collections
const collections = [
  "users",
  "follows",
  "gists",
  "gist_likes",
  "post_captions",
  "bookmarks",
];

collections.forEach((col) => {
  if (!db.getCollectionNames().includes(col)) {
    db.createCollection(col);
    print(`✅ Created collection: ${col}`);
  } else {
    print(`ℹ️ Collection ${col} already exists.`);
  }
});

// 3. Final Seed
db.system_init.updateOne(
  { id: "version_control" },
  {
    $set: {
      project: "Funstakes",
      initDate: new Date(),
      region: "AWS Cape Town",
    },
  },
  { upsert: true },
);

// Drop old ones first (Optional cleanup)
try {
  db.users.dropIndex("username_1");
  db.users.dropIndex("phoneNumber_1");
  print("🗑️ Dropped old user indexes.");
} catch (e) {
  print("🗑️ User indexes already deleted");
}

db.users.deleteMany({});

print("🚀 Funstakes database initialized!");
