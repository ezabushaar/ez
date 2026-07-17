#!/usr/bin/env bash
# One-command installer for the Marsa Fragrance Matcher on a fresh Ubuntu/Debian VPS.
#
# On your server, run:
#   curl -fsSL https://raw.githubusercontent.com/ezabushaar/ez/claude/fragrance-perfume-matcher-vd2ww6/deploy.sh -o deploy.sh && bash deploy.sh
#
# It installs Docker, clones the app, asks for your settings, and starts everything.
set -euo pipefail

REPO="https://github.com/ezabushaar/ez.git"
BRANCH="claude/fragrance-perfume-matcher-vd2ww6"
DIR="${MARSA_DIR:-$HOME/marsa-matcher}"

say() { printf '\n\033[1;33m%s\033[0m\n' "$*"; }

ask() { # ask VAR "Prompt" [allow_empty]
  local var="$1" prompt="$2" allow_empty="${3:-no}" val=""
  while true; do
    read -rp "$prompt" val </dev/tty || val=""
    if [ -n "$val" ] || [ "$allow_empty" = "yes" ]; then break; fi
    echo "  This one is required."
  done
  printf -v "$var" '%s' "$val"
}

say "1/4 Installing Docker (if needed)…"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi

say "2/4 Fetching the app…"
if [ -d "$DIR/.git" ]; then
  git -C "$DIR" fetch origin "$BRANCH"
  git -C "$DIR" checkout "$BRANCH"
  git -C "$DIR" pull --ff-only origin "$BRANCH"
else
  git clone --branch "$BRANCH" "$REPO" "$DIR"
fi
cd "$DIR"

say "3/4 Configuration…"
if [ -f .env ]; then
  echo "Existing .env found — keeping it. (Delete $DIR/.env and re-run to reconfigure.)"
else
  echo "Answer a few questions (press Enter to skip optional ones — you can add them to $DIR/.env later):"
  ask ADMIN_PW    "  Admin password for /admin (required): "
  ask WOO_URL_IN  "  WordPress store URL, e.g. https://yourstore.com (optional): " yes
  WOO_KEY_IN=""; WOO_SECRET_IN=""
  if [ -n "$WOO_URL_IN" ]; then
    ask WOO_KEY_IN    "  WooCommerce consumer key (ck_…): "
    ask WOO_SECRET_IN "  WooCommerce consumer secret (cs_…): "
  fi
  ask AI_KEY_IN "  Anthropic API key for AI features (optional): " yes

  cat > .env <<ENV
ADMIN_PASSWORD=$ADMIN_PW
WOO_URL=$WOO_URL_IN
WOO_CONSUMER_KEY=$WOO_KEY_IN
WOO_CONSUMER_SECRET=$WOO_SECRET_IN
ANTHROPIC_API_KEY=$AI_KEY_IN
ENV
  chmod 600 .env
fi

say "4/4 Building and starting (first build takes a few minutes)…"
docker compose up -d --build

IP=$(curl -fsS --max-time 5 https://ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
say "Done! The app is running."
echo "  Customer app : http://$IP:3000"
echo "  Admin area   : http://$IP:3000/admin"
echo
echo "Next steps:"
echo "  - If the page doesn't load, open port 3000: ufw allow 3000"
echo "  - Sign in to /admin and click 'Sync WooCommerce products'"
echo "  - For a domain + HTTPS, see DEPLOY.md section 6 in $DIR"
