#!/bin/bash

# Fix Pillow installation issue on Python 3.13
# This script installs system dependencies and uses a compatible Pillow version

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔧 Fixing Pillow installation for Python 3.13...${NC}"

# Install system dependencies for Pillow
echo -e "${YELLOW}📦 Installing system dependencies for Pillow...${NC}"
sudo apt update
sudo apt install -y \
    libjpeg-dev \
    zlib1g-dev \
    libpng-dev \
    libfreetype6-dev \
    liblcms2-dev \
    libwebp-dev \
    libharfbuzz-dev \
    libfribidi-dev \
    libxcb1-dev

# Navigate to project directory
PROJECT_DIR="/home/ubuntu/projects/ayat-management-system/ayat-management"
cd $PROJECT_DIR/backend

# Activate virtual environment
echo -e "${YELLOW}🐍 Activating virtual environment...${NC}"
source ../venv/bin/activate

# Upgrade pip and setuptools
echo -e "${YELLOW}📦 Upgrading pip and setuptools...${NC}"
pip install --upgrade pip setuptools wheel

# Install Pillow with specific version that works with Python 3.13
echo -e "${YELLOW}📦 Installing compatible Pillow version...${NC}"
pip install Pillow==10.4.0

# Install other dependencies
echo -e "${YELLOW}📦 Installing other Python dependencies...${NC}"
pip install Django==4.2.7
pip install djangorestframework==3.14.0
pip install djangorestframework-simplejwt==5.3.0
pip install django-cors-headers==4.3.1
pip install python-decouple==3.8
pip install gunicorn==21.2.0
pip install django-environ==0.11.2

echo -e "${GREEN}✅ Pillow installation fixed!${NC}"
echo -e "${YELLOW}📝 You can now continue with the deployment:${NC}"
echo -e "${YELLOW}   cd /home/ubuntu/projects/ayat-management-system/ayat-management${NC}"
echo -e "${YELLOW}   ./deploy_fixed.sh${NC}"
