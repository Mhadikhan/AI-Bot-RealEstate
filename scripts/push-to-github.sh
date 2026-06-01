#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

REMOTE="git@github.com:Mhadikhan/AI-Bot-RealEstate.git"
KEY="$HOME/.ssh/id_ed25519_github"

echo ""
echo "=== PropertyConnect — GitHub push ==="

eval "$(ssh-agent -s)" >/dev/null
ssh-add "$KEY" 2>/dev/null || true

echo ""
echo "Testing GitHub SSH..."
if ! ssh -T git@github.com 2>&1 | tee /dev/stderr | grep -q "Hi Mhadikhan"; then
  echo ""
  echo "SSH failed. Add this key at https://github.com/settings/keys :"
  cat "${KEY}.pub"
  echo ""
  ssh-keygen -lf "${KEY}.pub"
  exit 1
fi

git remote set-url origin "$REMOTE"
echo "Remote: $REMOTE"
echo ""
echo "Pushing main..."
git push --force-with-lease origin main
echo ""
echo "Done: https://github.com/Mhadikhan/AI-Bot-RealEstate"
