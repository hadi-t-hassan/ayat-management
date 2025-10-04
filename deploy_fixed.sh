#!/bin/bash

# Ayat Events Management Fixed Deployment Script
# Handles Node.js conflicts and package management issues

set -e

# Configuration
PROJECT_DIR="/home/ubuntu/projects/ayat-management-system/ayat-management"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/quran-event-orchestrator"
VENV_DIR="$PROJECT_DIR/venv"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Ayat Events Management Deployment (Fixed)${NC}"
echo -e "${YELLOW}📁 Project Directory: $PROJECT_DIR${NC}"

# Check if project directory exists
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}❌ Project directory not found: $PROJECT_DIR${NC}"
    echo -e "${YELLOW}Please ensure the project is cloned to the correct location${NC}"
    exit 1
fi

# Update system packages (skip problematic ones)
echo -e "${YELLOW}📦 Updating system packages...${NC}"
sudo apt update

# Install only essential packages, skip npm to avoid conflicts
echo -e "${YELLOW}📦 Installing essential packages (skipping npm to avoid conflicts)...${NC}"
sudo apt install -y nginx python3 python3-pip python3-venv git

# Check Node.js version
echo -e "${YELLOW}🔍 Checking Node.js installation...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js version: $NODE_VERSION${NC}"
    
    # Check if npm is available
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        echo -e "${GREEN}✅ npm version: $NPM_VERSION${NC}"
    else
        echo -e "${YELLOW}⚠️ npm not found, installing npm separately...${NC}"
        # Install npm using Node.js built-in method
        curl -L https://npmjs.org/install.sh | sh
    fi
else
    echo -e "${RED}❌ Node.js not found. Please install Node.js first.${NC}"
    exit 1
fi

# Backend Setup
echo -e "${YELLOW}🐍 Setting up Django backend...${NC}"
cd $BACKEND_DIR

# Create virtual environment if it doesn't exist
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

# Clear npm cache to avoid conflicts
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
sudo chown -R ubuntu:ubuntu $PROJECT_DIR
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
echo -e "${YELLOW}📝 Next steps:${NC}"
echo -e "${YELLOW}   1. Configure SSL certificates with Let's Encrypt${NC}"
echo -e "${YELLOW}   2. Update SECRET_KEY in production settings${NC}"
echo -e "${YELLOW}   3. Test the application functionality${NC}"
