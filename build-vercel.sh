#!/usr/bin/env bash
set -e

# 1. Build the frontend
echo "▶ Building frontend…"
npm run build

# 2. Clean and recreate dist folders
echo "▶ Preparing dist directories…"
rm -rf dist
mkdir -p dist/public
mkdir -p dist/server
mkdir -p dist/shared

# 3. Copy frontend output into dist/public
echo "▶ Copying frontend assets…"
cp -R build/* dist/public/

# 4. Compile server and shared TypeScript to dist
echo "▶ Compiling server and shared TS…"
tsc --project tsconfig.json --outDir dist/server --rootDir server
tsc --project tsconfig.json --outDir dist/shared --rootDir shared

# 5. Copy any raw JS server files you might have
echo "▶ Copying extra JS server files…"
cp -r server/*.js dist/server/ 2>/dev/null || true

# 6. Ensure shared modules export correctly for Node
echo "▶ Adding module.exports to shared .js files if missing…"
for file in dist/shared/*.js; do
  if [ -f "$file" ] && ! grep -q "module.exports" "$file"; then
    exports=$(
      grep -o 'export [A-Za-z]* [A-Za-z]*' "$file" \
        | sed 's/export //g' \
        | tr '\n' ',' \
        | sed 's/,$//' \
        | sed 's/,/, /g'
    )
    echo "module.exports = { $exports };" >> "$file"
    echo "  ↳ Added exports: $exports"
  fi
done

echo "✅ build-vercel.sh completed successfully."
