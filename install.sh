#!/usr/bin/env bash
# Install this long-form edit-video skill into a HyperFrames Student Kit checkout.
# Usage: ./install.sh /path/to/hyperframes-student-kit
set -euo pipefail
KIT="${1:-}"
if [ -z "$KIT" ] || [ ! -d "$KIT/.claude/skills" ]; then
  echo "Usage: ./install.sh /path/to/hyperframes-student-kit"
  echo "(the folder must contain .claude/skills, i.e. a clone of github.com/nateherkai/hyperframes-student-kit)"
  exit 1
fi
HERE="$(cd "$(dirname "$0")" && pwd)"
DEST="$KIT/.claude/skills/edit-video"
if [ -d "$DEST" ]; then
  BACKUP="$KIT/edit-video.backup-$(date +%Y%m%d-%H%M%S)"
  cp -R "$DEST" "$BACKUP"
  echo "Backed up the original edit-video skill to $BACKUP"
fi
mkdir -p "$DEST/scripts"
cp "$HERE/skills/edit-video/SKILL.md" "$DEST/SKILL.md"
cp "$HERE/skills/edit-video/scripts/record-broll.mjs" "$DEST/scripts/record-broll.mjs"
(cd "$KIT" && npm run sync:skills >/dev/null && echo "Synced the Codex mirror (.agents/skills)")
echo "Installed. Open Claude Code in $KIT and run /edit-video"
