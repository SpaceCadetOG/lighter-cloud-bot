#!/bin/bash
set -euo pipefail

APP_DIR="/opt/lighter"
REPO_URL="https://github.com/SpaceCadetOG/lighter-cloud-bot.git"

echo "[1/6] Update + install prerequisites"
apt-get update -y
apt-get install -y ca-certificates curl gnupg git

echo "[2/6] Install Docker"
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg \
  | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/debian bookworm stable" \
  > /etc/apt/sources.list.d/docker.list

apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable docker
systemctl start docker

echo "[3/6] Install app repo"
mkdir -p "$APP_DIR"
if [ ! -d "$APP_DIR/.git" ]; then
  git clone "$REPO_URL" "$APP_DIR"
else
  cd "$APP_DIR"
  git pull
fi

echo "[4/6] Ensure backend env exists"
cd "$APP_DIR"
if [ ! -f backend/.env ]; then
  cat > backend/.env <<'EOF'
# REQUIRED
LIGHTER_L1_ADDRESS=0xYOURADDRESS
LIGHTER_API_BASE=https://mainnet.zklighter.elliot.ai/api/v1

# OPTIONAL throttle (ms)
POLL_INTERVAL_MS=2500
EOF
fi

echo "[5/6] Compose up"
docker compose -f docker-compose.prod.yml up -d --build

echo "[6/6] Done. Containers:"
docker ps