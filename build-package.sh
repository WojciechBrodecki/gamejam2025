#!/bin/bash
set -e

# Usage: ./build-package.sh <user> <host>
# Example: ./build-package.sh wojtek vg-test.wojtek.com

if [ "$#" -lt 2 ]; then
    echo "Usage: $0 <user> <host>"
    echo "Example: $0 wojtek vg-test.wojtek.com"
    exit 1
fi

REMOTE_USER="$1"
REMOTE_HOST="$2"
REMOTE_DIR="~/casino-game"

echo "=========================================="
echo "  Casino Game - Build & Deploy Script"
echo "=========================================="
echo "Target: ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

PACKAGE_NAME="casino-game"
VERSION=$(date +%Y%m%d_%H%M%S)
OUTPUT_DIR="./release"
PACKAGE_DIR="${OUTPUT_DIR}/${PACKAGE_NAME}"

echo -e "${YELLOW}Step 1: Cleaning previous builds...${NC}"
rm -rf "$OUTPUT_DIR"
rm -rf ./backend/dist
rm -rf ./frontend/dist

echo -e "${YELLOW}Step 2: Installing dependencies...${NC}"
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

echo -e "${YELLOW}Step 3: Building backend...${NC}"
cd backend && npm run build && cd ..

echo -e "${YELLOW}Step 4: Building frontend...${NC}"
cd frontend && npm run build && cd ..

echo -e "${YELLOW}Step 5: Creating package structure...${NC}"
mkdir -p "$PACKAGE_DIR"
mkdir -p "${PACKAGE_DIR}/backend/dist"
mkdir -p "${PACKAGE_DIR}/frontend/dist"

# Copy backend dist and package.json for dependencies
cp -r ./backend/dist/* "${PACKAGE_DIR}/backend/dist/"
cp ./backend/package.json "${PACKAGE_DIR}/backend/"

# Copy frontend dist
cp -r ./frontend/dist/* "${PACKAGE_DIR}/frontend/dist/"

# Copy ecosystem config
cp ./ecosystem.config.js "${PACKAGE_DIR}/"

# Create start/stop scripts for user-level PM2
cat > "${PACKAGE_DIR}/start.sh" << 'START_EOF'
#!/bin/bash
cd "$(dirname "${BASH_SOURCE[0]}")"

echo "Starting Casino Game..."

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js 18+"
    exit 1
fi

# Install backend dependencies if needed
if [ ! -d "backend/node_modules" ]; then
    echo "Installing backend dependencies..."
    cd backend && npm install --production && cd ..
fi

# Check/install PM2 locally if not available
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
fi

# Stop if already running
pm2 delete casino-backend 2>/dev/null || true

# Start backend
pm2 start ecosystem.config.js

echo ""
echo "Casino Game started!"
echo "Backend running on port 3001"
echo ""
echo "PM2 commands:"
echo "  pm2 status    - Check status"
echo "  pm2 logs      - View logs"  
echo "  pm2 restart casino-backend - Restart"
echo "  pm2 stop casino-backend    - Stop"
START_EOF

cat > "${PACKAGE_DIR}/stop.sh" << 'STOP_EOF'
#!/bin/bash
echo "Stopping Casino Game..."
pm2 delete casino-backend 2>/dev/null || true
echo "Stopped."
STOP_EOF

cat > "${PACKAGE_DIR}/logs.sh" << 'LOGS_EOF'
#!/bin/bash
pm2 logs casino-backend
LOGS_EOF

chmod +x "${PACKAGE_DIR}/start.sh"
chmod +x "${PACKAGE_DIR}/stop.sh"
chmod +x "${PACKAGE_DIR}/logs.sh"

# Create nginx config with dynamic user path
# This runs on port 11115 and receives traffic from main nginx proxy at /casino/
cat > "${PACKAGE_DIR}/nginx-casino.conf" << NGINX_EOF
# Casino Game - Local Nginx (port 11115)
# Receives proxied traffic from main nginx at /casino/

server {
    listen 11115;
    server_name _;

    # Frontend - static files (served under /casino/ prefix)
    location /casino/ {
        alias /home/${REMOTE_USER}/casino-game/frontend/dist/;
        index index.html;
        try_files \$uri \$uri/ /casino/index.html;
    }

    # Backend API proxy
    location /casino/api/ {
        proxy_pass http://127.0.0.1:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }

    # WebSocket proxy
    location /casino/ws {
        proxy_pass http://127.0.0.1:3001/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }

    # Uploads proxy
    location /casino/uploads/ {
        proxy_pass http://127.0.0.1:3001/uploads/;
    }
    
    # Redirect root to /casino/
    location = / {
        return 301 /casino/;
    }
}
NGINX_EOF

# Create README
cat > "${PACKAGE_DIR}/README.md" << 'README_EOF'
# Casino Game - Deployment

## Twoja konfiguracja proxy (już masz):
```nginx
location /casino/ {
    proxy_pass http://ctp/;
    ...
}
upstream ctp {
    server 127.0.0.1:11115 fail_timeout=0;
}
```

## Kroki do wykonania na serwerze:

### 1. Uruchom backend
```bash
cd ~/casino-game
./start.sh
```

### 2. Skonfiguruj lokalny nginx (port 11115)
```bash
# Skopiuj konfigurację
sudo cp ~/casino-game/nginx-casino.conf /etc/nginx/sites-available/casino-local

# Utwórz symlink
sudo ln -sf /etc/nginx/sites-available/casino-local /etc/nginx/sites-enabled/casino-local

# Sprawdź konfigurację
sudo nginx -t

# Przeładuj nginx
sudo systemctl reload nginx
```

### 3. Gotowe!
Aplikacja dostępna pod: https://TWOJ_SERWER/casino/

## Zarządzanie

```bash
./start.sh   # Uruchom backend
./stop.sh    # Zatrzymaj backend
./logs.sh    # Zobacz logi

pm2 status   # Status PM2
pm2 restart casino-backend  # Restart
```

## Konfiguracja

Edytuj `ecosystem.config.js` aby zmienić:
- MONGODB_URI - adres bazy MongoDB
- JWT_SECRET - zmień na własny sekret!
- ROUND_DURATION_MS, MIN_BET, MAX_BET - ustawienia gry
README_EOF

echo -e "${YELLOW}Step 6: Creating tar.gz package...${NC}"
cd "$OUTPUT_DIR"
TARBALL="${PACKAGE_NAME}-${VERSION}.tar.gz"
tar -czvf "$TARBALL" "$PACKAGE_NAME"

echo -e "${YELLOW}Step 7: Uploading to ${REMOTE_HOST}...${NC}"
cd "$SCRIPT_DIR"

# Upload via sftp
sftp "${REMOTE_USER}@${REMOTE_HOST}" << SFTP_EOF
mkdir casino-game
put ${OUTPUT_DIR}/${TARBALL} casino-game/
bye
SFTP_EOF

echo -e "${YELLOW}Step 8: Extracting and starting on remote server...${NC}"
ssh "${REMOTE_USER}@${REMOTE_HOST}" << SSH_EOF
cd ~/casino-game
tar -xzf ${TARBALL} --strip-components=1
rm -f ${TARBALL}
chmod +x start.sh stop.sh logs.sh
./start.sh
SSH_EOF

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "Deployed to: ${REMOTE_USER}@${REMOTE_HOST}:~/casino-game"
echo ""
echo "Backend: http://127.0.0.1:3001 (on remote server)"
echo "Frontend files: ~/casino-game/frontend/dist/"
echo ""
echo "SSH commands:"
echo "  ssh ${REMOTE_USER}@${REMOTE_HOST} '~/casino-game/start.sh'  - Start"
echo "  ssh ${REMOTE_USER}@${REMOTE_HOST} '~/casino-game/stop.sh'   - Stop"
echo "  ssh ${REMOTE_USER}@${REMOTE_HOST} '~/casino-game/logs.sh'   - Logs"
echo ""
echo -e "${YELLOW}Remember to configure nginx manually on the server!${NC}"
