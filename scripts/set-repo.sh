#!/usr/bin/env bash
# After transferring this repo to an organization (or renaming it), point every
# reference — docs, scripts, the directory page — at the new owner/name.
#
#   scripts/set-repo.sh RotmanCommerceTech/rcet-member-pages
#
# Then review `git diff`, commit, push. Personal handles in CODEOWNERS and
# teams.json "admins" are left alone: those are people, not the repo.
set -euo pipefail
NEW="${1:?usage: $0 <new-owner/repo>}"
cd "$(dirname "$0")/.."

OLD="$(git remote get-url origin | sed -E 's#.*github\.com[:/]##; s#\.git$##')"
[ "$OLD" != "$NEW" ] || { echo "Already $NEW"; exit 0; }
lc() { printf '%s' "$1" | tr '[:upper:]' '[:lower:]'; }
OLD_OWNER="${OLD%%/*}"; OLD_REPO="${OLD##*/}"; NEW_OWNER="${NEW%%/*}"; NEW_REPO="${NEW##*/}"

files="$(grep -rlI --exclude-dir=.git --exclude-dir=dist --exclude-dir=node_modules \
  -e "$OLD" -e "$(lc "$OLD_OWNER").github.io" . || true)"
for f in $files; do
  perl -pi -e "s#\Q$OLD\E#$NEW#g; s#\Q$(lc "$OLD_OWNER").github.io/$OLD_REPO\E#$(lc "$NEW_OWNER").github.io/$NEW_REPO#g; s#\Q$(lc "$OLD_OWNER").github.io\E#$(lc "$NEW_OWNER").github.io#g" "$f"
  echo "  updated $f"
done
git remote set-url origin "https://github.com/$NEW.git"
echo
echo "Remote now points at https://github.com/$NEW — review with: git diff"
echo "Then: git commit -am 'Move to $NEW' && git push"
echo "If GitHub Pages shows as disabled after the transfer:"
echo "  gh api -X POST repos/$NEW/pages -f build_type=workflow && gh workflow run 'Deploy site'"
