#!/bin/bash
set -euo pipefail

# Configuration
APP_PATH="apps/shell"
DIST_PATH="local_prod_test"
ENV_SOURCE=""

if [ -f ".env.production" ]; then
    ENV_SOURCE=".env.production"
elif [ -f ".env.development" ]; then
    ENV_SOURCE=".env.development"
fi

if [ -n "$ENV_SOURCE" ]; then
    set -a
    . "$ENV_SOURCE"
    set +a
    echo "✓ Loaded $ENV_SOURCE"
else
    echo "⚠ No env file found. Continuing without exported env vars."
fi

echo "Step 1: Building the production bundle..."
pnpm --filter @repo/shell build

echo "Step 2: Deep cleaning..."
rm -rf $DIST_PATH
mkdir -p $DIST_PATH

echo "Step 3: Copying standalone files..."
# This brings over the server.js, node_modules, and the root .next runtime bundle.
cp -RP $APP_PATH/.next/standalone/. $DIST_PATH/

echo "Step 4: Flattening the Metadata (The Fix for 'No Build ID')..."
# Next.js 15 reads the execution root for the runtime metadata.
# Exclude .next/standalone here because it was already copied into DIST_PATH in Step 2.
mkdir -p $DIST_PATH/.next
rsync -a --exclude 'standalone' $APP_PATH/.next/ $DIST_PATH/.next/

echo "Step 5: Aligning Assets and App Metadata..."
# The standalone server also resolves manifests relative to apps/shell/.next.
# Mirror the built metadata there so files like routes-manifest.json are available.
mkdir -p $DIST_PATH/$APP_PATH/.next
rsync -a --exclude 'standalone' $APP_PATH/.next/ $DIST_PATH/$APP_PATH/.next/
cp -RP $APP_PATH/public/. $DIST_PATH/$APP_PATH/public/

# Step 6: Environment Variables
if [ -n "$ENV_SOURCE" ]; then
    cp "$ENV_SOURCE" $DIST_PATH/.env
    cp "$ENV_SOURCE" $DIST_PATH/$APP_PATH/.env
    echo "✓ Staged $ENV_SOURCE"
fi

echo "Step 7: Executing from the ROOT..."
cd $DIST_PATH

# We run the command from the DIST_PATH root. 
# This ensures ./.next/BUILD_ID is found immediately.
PORT="${PORT:-3000}" HOSTNAME="${HOSTNAME:-0.0.0.0}" node $APP_PATH/server.js

# Run with: ./run-prod.sh
