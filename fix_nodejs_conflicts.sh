#!/bin/bash

# Fix Node.js and npm conflicts on VPS
# Run this script to resolve package conflicts

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔧 Fixing Node.js and npm conflicts...${NC}"

# Remove conflicting packages
echo -e "${YELLOW}🗑️ Removing conflicting packages...${NC}"
sudo apt remove --purge -y npm nodejs-doc || true

# Clean package cache
echo -e "${YELLOW}🧹 Cleaning package cache...${NC}"
sudo apt autoremove -y
sudo apt autoclean

# Reinstall Node.js from NodeSource (if needed)
echo -e "${YELLOW}📦 Checking Node.js installation...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}📦 Installing Node.js from NodeSource...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt install -y nodejs
fi

# Install npm separately to avoid conflicts
echo -e "${YELLOW}📦 Installing npm separately...${NC}"
if ! command -v npm &> /dev/null; then
    # Use Node.js built-in npm or install via curl
    curl -L https://npmjs.org/install.sh | sh
fi

# Verify installations
echo -e "${YELLOW}✅ Verifying installations...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js version: $NODE_VERSION${NC}"
else
    echo -e "${RED}❌ Node.js installation failed${NC}"
    exit 1
fi

if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✅ npm version: $NPM_VERSION${NC}"
else
    echo -e "${RED}❌ npm installation failed${NC}"
    exit 1
fi

# Clear npm cache
echo -e "${YELLOW}🧹 Clearing npm cache...${NC}"
npm cache clean --force

echo -e "${GREEN}✅ Node.js conflicts fixed!${NC}"
echo -e "${YELLOW}📝 You can now run the deployment script:${NC}"
echo -e "${YELLOW}   chmod +x deploy_fixed.sh${NC}"
echo -e "${YELLOW}   ./deploy_fixed.sh${NC}"
