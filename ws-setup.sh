#!/bin/bash
TEAM=$1

# Initialize or re-verify cone mode
git sparse-checkout init --cone

if [ "$TEAM" == "frontend" ]; then
    echo "Setting up Frontend Feature Workspace..."
    git sparse-checkout set .github frontend

elif [ "$TEAM" == "frontend-shell" ]; then
    echo "Setting up Frontend Shell Workspace"
    git sparse-checkout set .github frontend/apps/shell frontend/public frontend/libs frontend/package.json frontend/package-lock.json frontend/next.config.js
  
elif [ "$TEAM" == "backend" ]; then
    echo "Setting up Backend Feature Workspace..."
    git sparse-checkout set .github backend
else
    echo "Please specify 'frontend' or 'backend'"
fi