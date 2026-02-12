#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
EXT_DIR="$SCRIPT_DIR/extension"
OUTPUT_DIR="$SCRIPT_DIR/dist"

mkdir -p "$OUTPUT_DIR"

# Find Chrome binary
if [[ "$OSTYPE" == "darwin"* ]]; then
  CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
else
  CHROME="google-chrome"
fi

if [ ! -x "$CHROME" ] && ! command -v "$CHROME" &> /dev/null; then
  echo "Error: Google Chrome not found at $CHROME"
  exit 1
fi

# Pack the extension
# --pack-extension produces a .crx and .pem in the parent directory
"$CHROME" --pack-extension="$EXT_DIR" --pack-extension-key="$OUTPUT_DIR/extension.pem" 2>/dev/null || \
"$CHROME" --pack-extension="$EXT_DIR"

# Move outputs to dist/
mv -f "$SCRIPT_DIR/extension.crx" "$OUTPUT_DIR/" 2>/dev/null || true
# The .pem is only created on first run
mv -f "$SCRIPT_DIR/extension.pem" "$OUTPUT_DIR/" 2>/dev/null || true

echo "Build complete:"
ls -la "$OUTPUT_DIR/"
