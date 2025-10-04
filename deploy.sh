#!/bin/bash

# Ayat Events Management - Complete Deployment Script
# Handles all deployment tasks including Node.js conflicts, Pillow issues, and full setup

set -e

# Configuration
PROJECT_DIR="/home/ubuntu/projects/ayat-management-system/ayat-management"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/quran-event-orchestrator"
VENV_DIR="$PROJECT_DIR/venv"
REPO_URL="https://github.com/hadi-t-hassan/ayat-management.git"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Ayat Events Management - Complete Deployment${NC}"
echo -e "${BLUE}📁 Project Directory: $PROJECT_DIR${NC}"
echo -e "${BLUE}🌐 Domain: ayat.pingtech.dev${NC}"

# Check if running as root or ubuntu
if [ "$EUID" -eq 0 ]; then
    USER="root"
else
    USER="ubuntu"
fi

echo -e "${YELLOW}👤 Running as: $USER${NC}"

# Update system packages
echo -e "${YELLOW}📦 Updating system packages...${NC}"
apt update

# Install essential packages
echo -e "${YELLOW}📦 Installing essential packages...${NC}"
apt install -y nginx python3 python3-pip python3-venv git curl

# Fix Node.js conflicts if they exist
echo -e "${YELLOW}🔧 Checking Node.js installation...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js version: $NODE_VERSION${NC}"
    
    if ! command -v npm &> /dev/null; then
        echo -e "${YELLOW}📦 Installing npm...${NC}"
        curl -L https://npmjs.org/install.sh | sh
    else
        NPM_VERSION=$(npm --version)
        echo -e "${GREEN}✅ npm version: $NPM_VERSION${NC}"
    fi
else
    echo -e "${YELLOW}📦 Installing Node.js from NodeSource...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt install -y nodejs
fi

# Install system dependencies for Pillow
echo -e "${YELLOW}📦 Installing system dependencies for Pillow...${NC}"
apt install -y \
    libjpeg-dev \
    zlib1g-dev \
    libpng-dev \
    libfreetype6-dev \
    liblcms2-dev \
    libwebp-dev \
    libharfbuzz-dev \
    libfribidi-dev \
    libxcb1-dev

# Create project directory if it doesn't exist
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${YELLOW}📁 Creating project directory...${NC}"
    mkdir -p $PROJECT_DIR
fi

# Clone or update repository
if [ -d "$PROJECT_DIR/.git" ]; then
    echo -e "${YELLOW}🔄 Updating existing repository...${NC}"
    cd $PROJECT_DIR
    git stash || true
    git pull origin main
else
    echo -e "${YELLOW}📥 Cloning repository...${NC}"
    git clone $REPO_URL $PROJECT_DIR
    cd $PROJECT_DIR
fi

# Backend Setup
echo -e "${YELLOW}🐍 Setting up Django backend...${NC}"
cd $BACKEND_DIR

# Create virtual environment
if [ ! -d "$VENV_DIR" ]; then
    echo -e "${YELLOW}📦 Creating Python virtual environment...${NC}"
    python3 -m venv $VENV_DIR
fi

# Activate virtual environment and install dependencies
echo -e "${YELLOW}📦 Installing Python dependencies...${NC}"
source $VENV_DIR/bin/activate

# Upgrade pip and setuptools
pip install --upgrade pip setuptools wheel

# Install dependencies with Pillow fix
echo -e "${YELLOW}📦 Installing Django dependencies (with Pillow fix)...${NC}"
pip install Django==4.2.7
pip install djangorestframework==3.14.0
pip install djangorestframework-simplejwt==5.3.0
pip install django-cors-headers==4.3.1
pip install Pillow==10.4.0
pip install python-decouple==3.8
pip install gunicorn==21.2.0
pip install django-environ==0.11.2

# Run Django migrations
echo -e "${YELLOW}🗄️ Running Django migrations...${NC}"
python manage.py migrate --settings=quran_events_backend.settings_production

# Collect static files
echo -e "${YELLOW}📁 Collecting static files...${NC}"
python manage.py collectstatic --noinput --settings=quran_events_backend.settings_production

# Create superuser
echo -e "${YELLOW}👤 Creating superuser...${NC}"
python manage.py shell --settings=quran_events_backend.settings_production << EOF
from accounts.models import User
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    print('Superuser created')
else:
    print('Superuser already exists')
EOF

# Frontend Setup
echo -e "${YELLOW}⚛️ Setting up React frontend...${NC}"
cd $FRONTEND_DIR

# Clear npm cache
echo -e "${YELLOW}🧹 Clearing npm cache...${NC}"
npm cache clean --force

# Install Node.js dependencies
echo -e "${YELLOW}📦 Installing Node.js dependencies...${NC}"
npm install --legacy-peer-deps

# Build React application
echo -e "${YELLOW}🔨 Building React application...${NC}"
npm run build

# Create frontend directory for Nginx
echo -e "${YELLOW}📁 Creating frontend directory...${NC}"
mkdir -p $PROJECT_DIR/frontend
cp -r $FRONTEND_DIR/dist/* $PROJECT_DIR/frontend/

# Nginx Configuration
echo -e "${YELLOW}🌐 Configuring Nginx...${NC}"
cat > /etc/nginx/sites-available/ayat.pingtech.dev << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name ayat.pingtech.dev;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ayat.pingtech.dev;

    # SSL Configuration (placeholder - will be updated by Certbot)
    ssl_certificate /etc/letsencrypt/live/ayat.pingtech.dev/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ayat.pingtech.dev/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;
    
    # Client Max Body Size
    client_max_body_size 20M;
    
    # Static files for Django
    location /static/ {
        alias /home/ubuntu/projects/ayat-management-system/ayat-management/backend/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Media files for Django
    location /media/ {
        alias /home/ubuntu/projects/ayat-management-system/ayat-management/backend/media/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API routes - proxy to Django backend
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }
    
    # React frontend - serve static files
    location / {
        root /home/ubuntu/projects/ayat-management-system/ayat-management/frontend;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
EOF

# Enable Nginx site
ln -sf /etc/nginx/sites-available/ayat.pingtech.dev /etc/nginx/sites-enabled/
nginx -t

# Systemd Service Configuration
echo -e "${YELLOW}🔧 Configuring systemd service...${NC}"
cat > /etc/systemd/system/ayat-backend.service << EOF
[Unit]
Description=Ayat Events Management Backend
After=network.target

[Service]
Type=notify
User=ubuntu
Group=ubuntu
WorkingDirectory=/home/ubuntu/projects/ayat-management-system/ayat-management/backend
Environment=DJANGO_SETTINGS_MODULE=quran_events_backend.settings_production
Environment=SECRET_KEY=your-production-secret-key-here
ExecStart=/home/ubuntu/projects/ayat-management-system/ayat-management/venv/bin/gunicorn --bind 127.0.0.1:8000 --workers 3 --timeout 120 quran_events_backend.wsgi:application
ExecReload=/bin/kill -s HUP \$MAINPID
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

# Enable and start services
systemctl daemon-reload
systemctl enable ayat-backend
systemctl start ayat-backend

# Set proper permissions
echo -e "${YELLOW}🔐 Setting permissions...${NC}"
chown -R ubuntu:ubuntu $PROJECT_DIR
chmod -R 755 $PROJECT_DIR

# Restart services
echo -e "${YELLOW}🔄 Restarting services...${NC}"
systemctl restart nginx
systemctl restart ayat-backend

# Check service status
echo -e "${YELLOW}📊 Checking service status...${NC}"
systemctl status ayat-backend --no-pager
systemctl status nginx --no-pager

# SSL Setup Instructions
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${GREEN}🌐 Your application is now available at: http://ayat.pingtech.dev${NC}"
echo -e "${YELLOW}📝 Next steps:${NC}"
echo -e "${YELLOW}   1. Install SSL certificate:${NC}"
echo -e "${YELLOW}      apt install certbot python3-certbot-nginx${NC}"
echo -e "${YELLOW}      certbot --nginx -d ayat.pingtech.dev${NC}"
echo -e "${YELLOW}   2. Update SECRET_KEY in production settings${NC}"
echo -e "${YELLOW}   3. Test the application functionality${NC}"
echo -e "${GREEN}🎉 Ayat Events Management is ready!${NC}"