# VPS Setup Guide for Ayat Events Management

## 🎯 **Your VPS Configuration**

**Project Path**: `/home/ubuntu/projects/ayat-management-system/ayat-management`
**Domain**: `ayat.pingtech.dev`
**User**: `ubuntu`

## 🚀 **Quick Setup Steps**

### **Step 1: Connect to Your VPS**
```bash
ssh ubuntu@your-vps-ip
```

### **Step 2: Navigate to Project Directory**
```bash
cd /home/ubuntu/projects/ayat-management-system/ayat-management
```

### **Step 3: Make Deployment Script Executable**
```bash
chmod +x deploy_vps.sh
```

### **Step 4: Run Deployment**
```bash
./deploy_vps.sh
```

## 📁 **Directory Structure After Deployment**

```
/home/ubuntu/projects/ayat-management-system/ayat-management/
├── backend/                    # Django backend
│   ├── staticfiles/           # Django static files
│   ├── media/                 # Media files
│   └── db.sqlite3            # Database
├── quran-event-orchestrator/  # React source
│   └── dist/                  # React build
├── frontend/                  # Nginx serves from here
│   ├── index.html
│   ├── assets/
│   └── ...
├── venv/                      # Python virtual environment
└── deploy_vps.sh             # Deployment script
```

## 🔧 **Manual Configuration (If Needed)**

### **Backend Setup**
```bash
cd /home/ubuntu/projects/ayat-management-system/ayat-management/backend

# Create virtual environment
python3 -m venv ../venv
source ../venv/bin/activate

# Install dependencies
pip install -r requirements_production.txt

# Run migrations
python manage.py migrate --settings=quran_events_backend.settings_production

# Collect static files
python manage.py collectstatic --noinput --settings=quran_events_backend.settings_production

# Create superuser
python manage.py createsuperuser --settings=quran_events_backend.settings_production
```

### **Frontend Setup**
```bash
cd /home/ubuntu/projects/ayat-management-system/ayat-management/quran-event-orchestrator

# Install dependencies
npm install

# Build for production
npm run build

# Copy to frontend directory
mkdir -p ../frontend
cp -r dist/* ../frontend/
```

### **Nginx Configuration**
```bash
# Copy Nginx config
sudo cp nginx_ayat.conf /etc/nginx/sites-available/ayat.pingtech.dev

# Enable site
sudo ln -s /etc/nginx/sites-available/ayat.pingtech.dev /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### **Systemd Service**
```bash
# Copy service file
sudo cp ayat-backend.service /etc/systemd/system/

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable ayat-backend
sudo systemctl start ayat-backend
```

## 🔒 **SSL Configuration (Let's Encrypt)**

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d ayat.pingtech.dev

# Test auto-renewal
sudo certbot renew --dry-run
```

## 📊 **Service Management**

### **Check Status**
```bash
# Backend service
sudo systemctl status ayat-backend

# Nginx service
sudo systemctl status nginx

# View logs
sudo journalctl -u ayat-backend -f
sudo tail -f /var/log/nginx/error.log
```

### **Restart Services**
```bash
# Restart backend
sudo systemctl restart ayat-backend

# Restart Nginx
sudo systemctl restart nginx
```

## 🔄 **Updates**

### **Update Application**
```bash
cd /home/ubuntu/projects/ayat-management-system/ayat-management

# Pull latest changes
git pull origin main

# Update backend
cd backend
source ../venv/bin/activate
pip install -r requirements_production.txt
python manage.py migrate --settings=quran_events_backend.settings_production
python manage.py collectstatic --noinput --settings=quran_events_backend.settings_production
sudo systemctl restart ayat-backend

# Update frontend
cd ../quran-event-orchestrator
npm install
npm run build
cp -r dist/* ../frontend/
sudo systemctl reload nginx
```

## 🆘 **Troubleshooting**

### **Common Issues**

#### **Service Won't Start**
```bash
# Check service status
sudo systemctl status ayat-backend

# View detailed logs
sudo journalctl -u ayat-backend -f

# Check configuration
sudo nginx -t
```

#### **Permission Issues**
```bash
# Fix permissions
sudo chown -R ubuntu:ubuntu /home/ubuntu/projects/ayat-management-system/ayat-management
sudo chmod -R 755 /home/ubuntu/projects/ayat-management-system/ayat-management
```

#### **Static Files Not Loading**
```bash
# Recollect static files
cd /home/ubuntu/projects/ayat-management-system/ayat-management/backend
source ../venv/bin/activate
python manage.py collectstatic --noinput --settings=quran_events_backend.settings_production
```

## ✅ **Verification**

### **Test URLs**
- **Frontend**: `https://ayat.pingtech.dev/`
- **API**: `https://ayat.pingtech.dev/api/`
- **Admin**: `https://ayat.pingtech.dev/admin/`
- **Health**: `https://ayat.pingtech.dev/health/`

### **Test Features**
- User login/logout
- Event creation
- Language switching
- Responsive design

## 🎉 **Success!**

Your Ayat Events Management System should now be running at `https://ayat.pingtech.dev`!

### **Default Admin Credentials**
- **Username**: `admin`
- **Password**: `admin123`

**⚠️ Important**: Change the admin password after first login!
