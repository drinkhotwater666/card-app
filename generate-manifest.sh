#!/bin/bash
# Run this script once from the folder containing index.html, tarot/, and lenormand/
# Usage: bash generate-manifest.sh

TAROT_DIR="tarot"
LENORMAND_DIR="lenormand"
OUTPUT="cards-manifest.json"

tarot_files=()
lenormand_files=()

if [ -d "$TAROT_DIR" ]; then
  while IFS= read -r -d '' file; do
    filename=$(basename "$file")
    tarot_files+=("\"tarot/$filename\"")
  done < <(find "$TAROT_DIR" -maxdepth 1 -type f \( -iname "*.png" -o -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.webp" \) -print0 | sort -z)
fi

if [ -d "$LENORMAND_DIR" ]; then
  while IFS= read -r -d '' file; do
    filename=$(basename "$file")
    lenormand_files+=("\"lenormand/$filename\"")
  done < <(find "$LENORMAND_DIR" -maxdepth 1 -type f \( -iname "*.png" -o -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.webp" \) -print0 | sort -z)
fi

tarot_json=$(IFS=,; echo "${tarot_files[*]}")
lenormand_json=$(IFS=,; echo "${lenormand_files[*]}")

cat > "$OUTPUT" << JSONEOF
{
  "tarot": [$tarot_json],
  "lenormand": [$lenormand_json]
}
JSONEOF

echo "✅ Generated $OUTPUT"
echo "   Tarot:     ${#tarot_files[@]} cards"
echo "   Lenormand: ${#lenormand_files[@]} cards"
