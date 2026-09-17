#!/usr/bin/env bash
# Claude Code PostToolUse hook: format (Prettier) and lint-fix (ESLint) the file
# the agent just wrote/edited. Shared with the team via .claude/settings.json.
#
# Receives the tool-call JSON on stdin; we only care about the edited file path.
# Runs from the repo root ($CLAUDE_PROJECT_DIR) so Prettier/ESLint find their config.
set -euo pipefail

file="$(jq -r '.tool_input.file_path // empty')"
[ -z "$file" ] && exit 0
[ -f "$file" ] || exit 0

# Only touch files these tools actually handle.
case "$file" in
  *.ts|*.tsx|*.js|*.jsx|*.mjs|*.cjs|*.json|*.jsonc|*.css|*.md|*.mts|*.cts) ;;
  *) exit 0 ;;
esac

cd "${CLAUDE_PROJECT_DIR:-.}"

# Format first (Prettier owns layout), then apply ESLint's auto-fixable rules.
# --no-warn-ignored keeps ESLint quiet for files it's configured to ignore.
npx --no-install prettier --write --ignore-unknown "$file" >/dev/null 2>&1 || true
case "$file" in
  *.ts|*.tsx|*.js|*.jsx|*.mjs|*.cjs|*.mts|*.cts)
    npx --no-install eslint --fix --no-warn-ignored "$file" >/dev/null 2>&1 || true
    ;;
esac

exit 0
