#!/bin/bash

# Ayat Events Management Deployment Script
# This script deploys both Django backend and React frontend to VPS

set -e

# Configuration
PROJECT_DIR="/var/www/ayat-management"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"
VENV_DIR="$PROJECT_DIR/venv"
REPO_URL="https://github.com/hadi-t-hassan/ayat-management.git"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Ayat Events Management Deployment${NC}"

# Update system packages
echo -e "${YELLOW}📦 Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y

# Install required packages
echo -e "${YELLOW}📦 Installing required packages...${NC}"
sudo apt install -y nginx python3 python3-pip python3-venv nodejs npm git

# Create project directory
echo -e "${YELLOW}📁 Creating project directory...${NC}"
sudo mkdir -p $PROJECT_DIR
sudo chown -R $USER:$USER $PROJECT_DIR

# Clone or update repository
if [ -d "$PROJECT_DIR/.git" ]; then
    echo -e "${YELLOW}🔄 Updating existing repository...${NC}"
    cd $PROJECT_DIR
    git pull origin main
else
    echo -e "${YELLOW}📥 Cloning repository...${NC}"
    git clone $REPO_URL $PROJECT_DIR
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
pip install --upgrade pip
pip install -r requirements_production.txt

# Run Django migrations
echo -e "${YELLOW}🗄️ Running Django migrations...${NC}"
python manage.py migrate --settings=quran_events_backend.settings_production

# Collect static files
echo -e "${YELLOW}📁 Collecting static files...${NC}"
python manage.py collectstatic --noinput --settings=quran_events_backend.settings_production

# Create superuser if it doesn't exist
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

# Install Node.js dependencies
echo -e "${YELLOW}📦 Installing Node.js dependencies...${NC}"
npm install

# Build React application
echo -e "${YELLOW}🔨 Building React application...${NC}"
npm run build

# Nginx Configuration
echo -e "${YELLOW}🌐 Configuring Nginx...${NC}"
sudo cp $PROJECT_DIR/nginx_ayat.conf /etc/nginx/sites-available/ayat.pingtech.dev
sudo ln -sf /etc/nginx/sites-available/ayat.pingtech.dev /etc/nginx/sites-enabled/
sudo nginx -t

# Systemd Service
echo -e "${YELLOW}🔧 Configuring systemd service...${NC}"
sudo cp $PROJECT_DIR/ayat-backend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable ayat-backend
sudo systemctl start ayat-backend

# Set proper permissions
echo -e "${YELLOW}🔐 Setting permissions...${NC}"
sudo chown -R www-data:www-data $PROJECT_DIR
sudo chmod -R 755 $PROJECT_DIR

# Restart services
echo -e "${YELLOW}🔄 Restarting services...${NC}"
sudo systemctl restart nginx
sudo systemctl restart ayat-backend

# Check service status
echo -e "${YELLOW}📊 Checking service status...${NC}"
sudo systemctl status ayat-backend --no-pager
sudo systemctl status nginx --no-pager

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${GREEN}🌐 Your application is now available at: https://ayat.pingtech.dev${NC}"
echo -e "${YELLOW}📝 Don't forget to:${NC}"
echo -e "${YELLOW}   1. Configure SSL certificates${NC}"
echo -e "${YELLOW}   2. Update SECRET_KEY in production settings${NC}"
echo -e "${YELLOW}   3. Configure your domain DNS${NC}"
