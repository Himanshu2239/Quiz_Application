#!/bin/bash
# Custom build script for Vercel deployment

# Create the directory structure
echo "Creating directory structure..."
mkdir -p dist/client
mkdir -p dist/server

# Build the frontend (client-side code)
echo "Building frontend..."
npm run build
# Move client files to their proper location
mv dist/assets dist/client/
mv dist/index.html dist/client/

# Build the server components (TypeScript files)
echo "Building server components..."
npx esbuild server/**/*.ts --platform=node --packages=external --bundle --format=cjs --outdir=dist/server

# Copy API files to the root directory
# These will be deployed separately by Vercel as serverless functions
echo "API files already in place, no need to copy them"

echo "Build completed successfully"