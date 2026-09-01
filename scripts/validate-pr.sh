#!/usr/bin/env bash
# Validates that a pull request only adds/edits the author's own member page.
# Env: AUTHOR (github login), BASE_SHA, HEAD_SHA
#
# Runs in CI, but you can run it locally too:
#   AUTHOR=yourname BASE_SHA=main HEAD_SHA=HEAD bash scripts/validate-pr.sh
set -uo pipefail

AUTHOR_LC="$(printf '%s' "${AUTHOR:?AUTHOR not set}" | tr '[:upper:]' '[:lower:]')"
DIR="members/${AUTHOR_LC}"

MAX_FILE_BYTES=$((2 * 1024 * 1024))
MAX_DIR_BYTES=$((10 * 1024 * 1024))
MAX_FILES=40
ALLOWED_EXT="html htm css js mjs json md txt png jpg jpeg gif webp avif svg ico woff woff2 ttf otf mp3 mp4 webm vtt"

FAILED=0
fail() { printf '::error::%s\n' "$*"; FAILED=1; }

echo "PR author: ${AUTHOR}  ->  expected folder: ${DIR}/"
echo

# ---------------------------------------------------------------- ownership
changed="$(git diff --name-only "${BASE_SHA}...${HEAD_SHA}")"
if [ -z "$changed" ]; then
  fail "This PR changes no files."
  exit 1
fi

echo "Changed files:"
printf '%s\n' "$changed" | sed 's/^/  /'
echo

outside="$(printf '%s\n' "$changed" | grep -v "^${DIR}/" || true)"
if [ -n "$outside" ]; then
  fail "You may only touch files inside ${DIR}/ — these are outside it:"
  printf '%s\n' "$outside" | sed 's/^/    /'
  echo "  If your GitHub username is spelled differently, rename your folder to match it (lowercase)."
fi

# ---------------------------------------------------------------- entrypoint
if [ ! -f "${DIR}/index.html" ]; then
  fail "Missing ${DIR}/index.html — every page needs that file as its entry point."
fi

# ---------------------------------------------------------- per-file checks
if [ -d "$DIR" ]; then
  count=0
  total=0

  while IFS= read -r f; do
    [ -z "$f" ] && continue
    count=$((count + 1))
    base="$(basename "$f")"

    if [ -L "$f" ]; then
      fail "$f is a symlink — not allowed."
      continue
    fi

    case "$base" in
      .*)  fail "$f is a dotfile — not allowed."; continue ;;
      *.*) ext="$(printf '%s' "${base##*.}" | tr '[:upper:]' '[:lower:]')" ;;
      *)   ext="" ;;
    esac

    case " ${ALLOWED_EXT} " in
      *" ${ext} "*) : ;;
      *) fail "$f has a disallowed file type (${ext:+.}${ext:-no extension}). Allowed: ${ALLOWED_EXT}" ;;
    esac

    size="$(wc -c < "$f" | tr -d ' ')"
    total=$((total + size))
    if [ "$size" -gt "$MAX_FILE_BYTES" ]; then
      fail "$f is $((size / 1024)) KB — the per-file limit is $((MAX_FILE_BYTES / 1024)) KB."
    fi
  done < <(find "$DIR" \( -type f -o -type l \))

  if [ "$count" -gt "$MAX_FILES" ]; then
    fail "Your folder has ${count} files — the limit is ${MAX_FILES}."
  fi
  if [ "$total" -gt "$MAX_DIR_BYTES" ]; then
    fail "Your folder totals $((total / 1024)) KB — the limit is $((MAX_DIR_BYTES / 1024)) KB."
  fi

  echo "Folder: ${count} file(s), $((total / 1024)) KB total."
fi

echo
if [ "$FAILED" -ne 0 ]; then
  echo "Validation failed. Fix the errors above and push again to this same PR."
  exit 1
fi
echo "All checks passed. Your page goes live once a club admin merges this."
