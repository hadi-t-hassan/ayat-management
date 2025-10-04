# Ayat Events Management - VPS Deployment Guide

## 🚀 **Deployment Overview**

This guide will help you deploy the Ayat Events Management System to your VPS using the subdomain `ayat.pingtech.dev`.

### **Architecture**
- **Domain**: `ayat.pingtech.dev`
- **Backend API**: `ayat.pingtech.dev/api/`
- **Frontend**: `ayat.pingtech.dev/`
- **Admin Panel**: `ayat.pingtech.dev/admin/`

## 📋 **Prerequisites**

### **VPS Requirements**
- Ubuntu 20.04+ or Debian 10+
- 2GB RAM minimum (4GB recommended)
- 20GB storage minimum
- Root or sudo access

### **Domain Configuration**
- Point `ayat.pingtech.dev` to your VPS IP address
- SSL certificate (Let's Encrypt recommended)

## 🛠️ **Step-by-Step Deployment**

### **Step 1: Connect to Your VPS**
```bash
ssh root@your-vps-ip
# or
ssh username@your-vps-ip
```

### **Step 2: Clone the Repository**
```bash
git clone https://github.com/hadi-t-hassan/ayat-management.git /var/www/ayat-management
cd /var/www/ayat-management
```

### **Step 3: Run the Deployment Script**
```bash
chmod +x deploy.sh
./deploy.sh
```

### **Step 4: Configure SSL (Let's Encrypt)**
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d ayat.pingtech.dev

# Test auto-renewal
sudo certbot renew --dry-run
```

### **Step 5: Configure Environment Variables**
```bash
# Edit production settings
sudo nano /var/www/ayat-management/backend/quran_events_backend/settings_production.py

# Update SECRET_KEY
SECRET_KEY = 'your-very-secure-secret-key-here'
```

## 🔧 **Manual Configuration (Alternative)**

### **Backend Setup**
```bash
# Navigate to backend
cd /var/www/ayat-management/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

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
# Navigate to frontend
cd /var/www/ayat-management/quran-event-orchestrator

# Install dependencies
npm install

# Build for production
npm run build

# Copy build files
sudo cp -r dist/* /var/www/ayat-management/frontend/
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

## 🔒 **Security Configuration**

### **Firewall Setup**
```bash
# Install UFW
sudo apt install ufw

# Configure firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### **SSL/TLS Configuration**
- Use Let's Encrypt for free SSL certificates
- Configure strong SSL ciphers
- Enable HSTS headers
- Set up automatic certificate renewal

## 📊 **Monitoring & Maintenance**

### **Service Management**
```bash
# Check service status
sudo systemctl status ayat-backend
sudo systemctl status nginx

# View logs
sudo journalctl -u ayat-backend -f
sudo tail -f /var/log/nginx/error.log

# Restart services
sudo systemctl restart ayat-backend
sudo systemctl restart nginx
```

### **Database Backup**
```bash
# Create backup script
cat > /var/www/ayat-management/backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
cp /var/www/ayat-management/backend/db.sqlite3 /var/www/ayat-management/backups/db_$DATE.sqlite3
find /var/www/ayat-management/backups/ -name "db_*.sqlite3" -mtime +7 -delete
EOF

chmod +x /var/www/ayat-management/backup.sh

# Add to crontab for daily backups
echo "0 2 * * * /var/www/ayat-management/backup.sh" | sudo crontab -
```

### **Log Rotation**
```bash
# Configure log rotation
sudo nano /etc/logrotate.d/ayat-backend

# Add:
/var/log/ayat-backend/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
}
```

## 🚀 **Performance Optimization**

### **Gunicorn Configuration**
```bash
# Edit service file for more workers
sudo nano /etc/systemd/system/ayat-backend.service

# Update ExecStart line:
ExecStart=/var/www/ayat-management/venv/bin/gunicorn --bind 127.0.0.1:8000 --workers 4 --timeout 120 --max-requests 1000 --max-requests-jitter 100 quran_events_backend.wsgi:application
```

### **Nginx Optimization**
```bash
# Edit Nginx configuration
sudo nano /etc/nginx/sites-available/ayat.pingtech.dev

# Add performance optimizations:
# - Enable gzip compression
# - Set appropriate cache headers
# - Configure worker processes
```

## 🔄 **Updates & Maintenance**

### **Application Updates**
```bash
# Pull latest changes
cd /var/www/ayat-management
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
sudo cp -r dist/* ../frontend/
sudo systemctl reload nginx
```

### **System Updates**
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Restart services after system updates
sudo systemctl restart ayat-backend
sudo systemctl restart nginx
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

#### **Database Issues**
```bash
# Check database permissions
ls -la /var/www/ayat-management/backend/db.sqlite3

# Reset database (WARNING: This will delete all data)
sudo rm /var/www/ayat-management/backend/db.sqlite3
cd /var/www/ayat-management/backend
source ../venv/bin/activate
python manage.py migrate --settings=quran_events_backend.settings_production
```

#### **Static Files Issues**
```bash
# Recollect static files
cd /var/www/ayat-management/backend
source ../venv/bin/activate
python manage.py collectstatic --noinput --settings=quran_events_backend.settings_production

# Check permissions
sudo chown -R www-data:www-data /var/www/ayat-management/backend/staticfiles/
```

## ✅ **Verification**

### **Check Application Status**
1. **Backend API**: `https://ayat.pingtech.dev/api/`
2. **Frontend**: `https://ayat.pingtech.dev/`
3. **Admin Panel**: `https://ayat.pingtech.dev/admin/`
4. **Health Check**: `https://ayat.pingtech.dev/health/`

### **Test Features**
- User authentication
- Event creation and management
- Language switching (RTL/LTR)
- Responsive design
- API endpoints

## 🎉 **Success!**

Your Ayat Events Management System is now deployed and accessible at `https://ayat.pingtech.dev`!

### **Next Steps**
1. Configure your domain DNS
2. Set up SSL certificates
3. Create your first admin user
4. Test all functionality
5. Set up monitoring and backups

For support, check the logs and ensure all services are running properly.
