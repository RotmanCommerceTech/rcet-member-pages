#!/usr/bin/env bash
# Bulk-invite workshop participants as repo collaborators.
#
#   scripts/add-collaborators.sh --from-teams               # everyone in teams.json
#   scripts/add-collaborators.sh participants.txt          # a plain list
#   DRY_RUN=1 scripts/add-collaborators.sh --from-teams     # preview only
#
# participants.txt: one GitHub username per line. Blank lines and lines
# starting with # are ignored. Re-running is safe — existing collaborators
# and pending invites are skipped.
#
# Collaborators skip the fork step entirely (clone -> branch -> push -> PR)
# and their CI runs without an admin clicking "Approve and run".
set -uo pipefail

REPO="${REPO:-RotmanCommerceTech/rcet-member-pages}"
FILE="${1:?usage: $0 <file-with-usernames> | --from-teams}"
PERM="${PERM:-push}"

command -v gh >/dev/null || { echo "gh CLI not found"; exit 1; }
if [ "$FILE" = "--from-teams" ]; then
  FILE="$(mktemp)"
  node -e "const r=JSON.parse(require('fs').readFileSync('$(dirname "$0")/../teams.json','utf8'));console.log([...new Set(r.teams.flatMap(t=>t.members))].join('\n'))" > "$FILE"
  [ -s "$FILE" ] || { echo "No members listed in teams.json yet."; exit 1; }
fi
[ -f "$FILE" ] || { echo "No such file: $FILE"; exit 1; }

invited=0; skipped=0; failed=0

while IFS= read -r raw || [ -n "$raw" ]; do
  user="$(printf '%s' "$raw" | tr -d '[:space:]')"
  [ -z "$user" ] && continue
  case "$user" in \#*) continue ;; esac
  user="${user#@}"                      # tolerate @handle
  user="${user##*/}"                    # tolerate a pasted profile URL

  if gh api "repos/${REPO}/collaborators/${user}" --silent 2>/dev/null; then
    printf '  = %-24s already a collaborator\n' "$user"
    skipped=$((skipped + 1)); continue
  fi

  if [ -n "${DRY_RUN:-}" ]; then
    printf '  + %-24s would invite (%s)\n' "$user" "$PERM"
    invited=$((invited + 1)); continue
  fi

  if gh api -X PUT "repos/${REPO}/collaborators/${user}" \
        -f permission="$PERM" --silent 2>/dev/null; then
    printf '  + %-24s invited\n' "$user"
    invited=$((invited + 1))
  else
    printf '  ! %-24s FAILED (bad username?)\n' "$user"
    failed=$((failed + 1))
  fi
done < "$FILE"

echo
echo "invited=${invited}  already=${skipped}  failed=${failed}"
[ "$failed" -gt 0 ] && echo "Check the failed usernames — GitHub logins are exact." 
echo
echo "NOTE: invitations must be ACCEPTED before anyone can push."
echo "Each person gets an email + a banner at https://github.com/${REPO}"
echo "Send these the day BEFORE the workshop, not during it."
exit 0
