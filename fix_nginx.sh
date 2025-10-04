#!/bin/bash

# Quick fix for Nginx configuration issues

echo "🔧 Fixing Nginx configuration..."

# Remove any conflicting sites
rm -f /etc/nginx/sites-enabled/arc.pingtech.dev

# Create a simple HTTP-only configuration
cat > /etc/nginx/sites-available/ayat.pingtech.dev << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name ayat.pingtech.dev;
    
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
    gzip_proxied expired no-cache no-store private auth;
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

# Enable the site
ln -sf /etc/nginx/sites-available/ayat.pingtech.dev /etc/nginx/sites-enabled/

# Test configuration
nginx -t

# Restart Nginx
systemctl restart nginx

echo "✅ Nginx configuration fixed!"
echo "🌐 Your application should now be available at: http://ayat.pingtech.dev"
