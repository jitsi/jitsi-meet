#!/bin/bash
# Sync diff files to fishmeet directory
# Only sync the file paths existing in the fishmeet directory and will not create or delete files
# Checks if the source files exist and outputs warning messages if they do not

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FISHMEET_DIR="$PROJECT_DIR/fishmeet"

sync_files() {
    local source_base="$1"
    local target_base="$2"

    echo "Start syncing $target_base directory..."

    # Iterate over all files under target_base
    find "$target_base" -type f -print0 | while IFS= read -r -d '' file; do
        # Get the path of the file relative to target_base
        relative_path="${file#$target_base/}"

        # Build source file path
        source_file="$source_base/$relative_path"

        if [ -f "$source_file" ]; then
            # Compare file contents
            if ! diff "$source_file" "$file" > /dev/null 2>&1; then
                echo "✅ Syncing file (content changed): $relative_path"
                # Ensure target directory exists
                mkdir -p "$(dirname "$file")"
                # Copy file
                cp -p "$source_file" "$file"
            # else
            #     echo "⛸️ Skipping file (content unchanged): $relative_path"
            fi
        else
            echo "⚠️ Warning: Source file does not exist: $source_file"
        fi
    done

    echo "📁 Sync completed: $target_base"
}

sync_files "$PROJECT_DIR/react" "$FISHMEET_DIR/react"

sync_files "$PROJECT_DIR/css" "$FISHMEET_DIR/css"

echo "✨ All sync operations completed!"