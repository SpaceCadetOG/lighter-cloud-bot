#!/bin/bash
set -euo pipefail

APP_DIR="/opt/lighter-cloud-bot"
REPO_URL="https://github.com/SpaceCadetOG/lighter-cloud-bot.git"
BRANCH="main"

# ---- base packages ----
apt-get update -y
apt-get install -y git curl ca-certificates gnupg

# ---- docker install ----
if ! command -v docker >/dev/null 2>&1; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian bookworm stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  systemctl enable docker
  systemctl start docker
fi

# ---- app user ----
id -u appuser >/dev/null 2>&1 || useradd -m -s /bin/bash appuser
usermod -aG docker appuser

# ---- clone / update repo ----
mkdir -p "$APP_DIR"
if [ ! -d "$APP_DIR/.git" ]; then
  git clone -b "$BRANCH" "$REPO_URL" "$APP_DIR"
else
  cd "$APP_DIR"
  git fetch origin
  git reset --hard "origin/$BRANCH"
fi

cd "$APP_DIR"

# ---- env file (edit after boot if needed) ----
if [ ! -f backend/.env ]; then
cat > backend/.env <<'EOF'
LIGHTER_BASE_URL=https://mainnet.zklighter.elliot.ai
LIGHTER_L1_ADDRESS=0x4BAa6b3DC50b0cA44B525C06A4B6CB67B87a6Eb1
PORT=8080
EOF
fi

# ---- run compose ----
docker compose -f docker-compose.prod.yml up -d --build
docker ps