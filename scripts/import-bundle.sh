#!/usr/bin/env bash
# Admin tool: publish a page bundle a team sent you (zip or folder) as a pull request.
#
#   scripts/import-bundle.sh <team-slug> <bundle.zip | folder> [--as <github-login>]
#
# What it does:
#   1. unzips/copies the bundle into teams/<slug>/ on a fresh branch (replacing what was there)
#   2. if the bundle is a built Vite/React project (dist/index.html), uses dist/
#   3. strips junk (node_modules, .git, __MACOSX, .DS_Store)
#   4. runs the same validator CI runs, then pushes and opens the PR
# --as records who actually made the page in the PR body (they may not have a GitHub account).
set -euo pipefail

REPO="${REPO:-Slimebro1231/rcet-member-pages}"
SLUG="${1:?usage: $0 <team-slug> <bundle.zip|folder> [--as <github-login>]}"
SRC="${2:?usage: $0 <team-slug> <bundle.zip|folder> [--as <github-login>]}"
AS=""; [ "${3:-}" = "--as" ] && AS="${4:-}"

cd "$(dirname "$0")/.."
command -v gh >/dev/null || { echo "gh CLI not found"; exit 1; }
node -e "const r=JSON.parse(require('fs').readFileSync('teams.json','utf8'));if(!r.teams.some(t=>t.slug==='$SLUG')){console.error('\"$SLUG\" is not in teams.json');process.exit(1)}"
[ -z "$(git status --porcelain)" ] || { echo "Working tree is not clean — commit or stash first."; exit 1; }

TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
if [ -d "$SRC" ]; then
  cp -R "$SRC/." "$TMP/"
elif [ -f "$SRC" ]; then
  case "$SRC" in *.zip) unzip -q "$SRC" -d "$TMP" ;; *) echo "Bundle must be a .zip or a folder"; exit 1 ;; esac
else
  echo "No such file or folder: $SRC"; exit 1
fi

# Descend through a single wrapping folder (zips usually have one), then prefer a built dist/.
rm -rf "$TMP/__MACOSX"
shopt -s dotglob nullglob
entries=("$TMP"/*); shopt -u dotglob nullglob
if [ "${#entries[@]}" -eq 1 ] && [ -d "${entries[0]}" ] && [ ! -f "$TMP/index.html" ]; then TMP_SRC="${entries[0]}"; else TMP_SRC="$TMP"; fi
if [ ! -f "$TMP_SRC/index.html" ] && [ -f "$TMP_SRC/dist/index.html" ]; then echo "Using built output from dist/"; TMP_SRC="$TMP_SRC/dist"; fi
[ -f "$TMP_SRC/index.html" ] || { echo "Bundle has no index.html (looked in the root and in dist/)."; exit 1; }
find "$TMP_SRC" \( -name node_modules -o -name .git -o -name __MACOSX \) -type d -prune -exec rm -rf {} + 2>/dev/null || true
find "$TMP_SRC" -name '.DS_Store' -delete 2>/dev/null || true
# Vite builds reference /assets/... — rewrite to relative so the page works under /teams/<slug>/.
grep -rlE '(src|href)="/(assets|static)/' "$TMP_SRC" --include='*.html' 2>/dev/null | while read -r f; do
  sed -i.bak -E 's#(src|href)="/(assets|static)/#\1="./\2/#g' "$f" && rm -f "$f.bak"; done

BRANCH="import/${SLUG}-$(date +%Y%m%d-%H%M)"
git fetch -q origin main
git checkout -q -b "$BRANCH" origin/main
rm -rf "teams/$SLUG"; mkdir -p "teams/$SLUG"
cp -R "$TMP_SRC/." "teams/$SLUG/"
git add -A "teams/$SLUG"
git commit -q -m "Import ${SLUG} page bundle${AS:+ (from @$AS)}" -m "Imported with scripts/import-bundle.sh"

echo; echo "Validating as an admin (folder rules still apply)…"; echo
ADMIN="$(gh api user --jq .login)"
if ! AUTHOR="$ADMIN" BASE_SHA=origin/main HEAD_SHA=HEAD node scripts/validate-pr.mjs; then
  echo; echo "Fix the problems in teams/$SLUG/ on branch $BRANCH, commit, then: git push -u origin $BRANCH && gh pr create --fill"; exit 1
fi

git push -q -u origin "$BRANCH"
gh pr create --repo "$REPO" --base main --head "$BRANCH" \
  --title "Import ${SLUG} page" \
  --body "Page bundle for **${SLUG}**${AS:+, made by @$AS}, imported by @${ADMIN} with \`scripts/import-bundle.sh\`.

Preview: build locally with \`node scripts/serve.mjs\` and open /teams/${SLUG}/."
git checkout -q main
