#!/bin/bash
# Script to update pnpm lockfile before building
set -e

echo "Updating pnpm lockfile..."
pnpm install --lockfile-only

echo "Building project..."
vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "Build completed successfully!"
