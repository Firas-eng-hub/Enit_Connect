# ENIT-CONNECT Deployment Guide

Complete step-by-step guide to deploy ENIT-CONNECT on Ubuntu Server using Docker images from Docker Hub.

---

## Prerequisites

- Ubuntu Server (20.04 or later)
- Sudo access
- Internet connection
- Docker Hub images: `firaskali/enit-connect-backend` and `firaskali/enit-connect-frontend`

---

## Step 1: Install Docker and Docker Compose

```bash
# Update package index
sudo apt-get update

# Install prerequisites
sudo apt-get install -y ca-certificates curl gnupg

# Add Docker's official GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add current user to docker group (to run docker without sudo)
sudo usermod -aG docker $USER

# Verify installation
docker --version
docker compose version
```

**Important:** Log out and log back in for group changes to take effect.

---

## Step 2: Create Deployment Directory

```bash
# Create application directory
sudo mkdir -p /opt/enit-connect/nginx
sudo chown -R $USER:$USER /opt/enit-connect

# Navigate to directory
cd /opt/enit-connect
```

---

## Step 3: Create Configuration Files

### 3.1 Create `docker-compose.yml`

```bash
cat > /opt/enit-connect/docker-compose.yml << 'EOF'
version: '3.8'

services:
  backend:
    image: firaskali/enit-connect-backend:${TAG:-latest}
    container_name: tic-backend
    restart: unless-stopped
    env_file:
      - ./Backend/.env
    environment:
      - NODE_ENV=production
    volumes:
      - tic-uploads:/app/uploads
    networks:
      - tic-connect-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/admin/news"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  frontend:
    image: firaskali/enit-connect-frontend:${TAG:-latest}
    container_name: tic-frontend
    restart: unless-stopped
    ports:
      - "80:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro
    networks:
      - tic-connect-network
    depends_on:
      backend:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/"]
      interval: 30s
      timeout: 10s
      retries: 3

networks:
  tic-connect-network:
    name: tic-connect-network
    driver: bridge

volumes:
  tic-uploads:
    name: tic-uploads
EOF
```

### 3.2 Create Nginx Configuration

```bash
cat > /opt/enit-connect/nginx/nginx.conf << 'EOF'
upstream backend_servers {
    server tic-backend:3000;
}

# Rate limiting
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/m;
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/m;

server {
    listen 80;
    server_name localhost;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend static files
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API proxy
    location /api/ {
        # Apply rate limiting to auth endpoints
        location ~ ^/api/(auth|student/login|company/login|admin/login) {
            limit_req zone=auth_limit burst=10 nodelay;
            proxy_pass http://backend_servers;
            include proxy_params.conf;
        }

        # General API rate limiting
        limit_req zone=api_limit burst=20 nodelay;
        
        proxy_pass http://backend_servers;
        
        # Proxy headers
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        proxy_busy_buffers_size 8k;
        
        # File upload size limit
        client_max_body_size 10M;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # Deny access to hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}

# Proxy params helper file
server {
    listen 8080;
    server_name _;
    return 444;
}
EOF

# Create proxy params file
cat > /opt/enit-connect/nginx/proxy_params.conf << 'EOF'
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection 'upgrade';
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_cache_bypass $http_upgrade;
EOF
```

### 3.3 Create Backend Environment File

```bash
# Create Backend directory
mkdir -p /opt/enit-connect/Backend

# Create .env file
cat > /opt/enit-connect/Backend/.env << 'EOF'
PORT=3000
JWT_SECRET=your_jwt_secret_here_change_this
GEOCODER_API_KEY=your_geocoder_api_key
DB_USER=your_mongodb_username
DB_PASS=your_mongodb_password
DB_HOST=your_mongodb_cluster.mongodb.net
DB_DOMAIN=your_mongodb_cluster.mongodb.net
DB_NAME=your_database_name
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
BASE_URL=http://YOUR_SERVER_IP
APP_URL=http://YOUR_SERVER_IP
FRONTEND_URL=http://YOUR_SERVER_IP
EOF

echo "⚠️  IMPORTANT: Edit /opt/enit-connect/Backend/.env and replace all placeholder values!"
```

---

## Step 4: Configure Environment Variables

Edit the `.env` file with your actual values:

```bash
nano /opt/enit-connect/Backend/.env
```

**Required changes:**
- `JWT_SECRET`: Generate a strong secret (e.g., `openssl rand -base64 32`)
- `DB_USER`, `DB_PASS`, `DB_HOST`, `DB_NAME`: Your MongoDB Atlas credentials
- `EMAIL_USER`, `EMAIL_PASS`: Gmail account for sending emails (use App Password)
- `BASE_URL`, `APP_URL`, `FRONTEND_URL`: Your server IP or domain (e.g., `http://192.168.1.141`)

---

## Step 5: Login to Docker Hub (if images are private)

```bash
# Login to Docker Hub
docker login -u firaskali

# Enter password when prompted
```

---

## Step 6: Pull and Start Containers

```bash
# Navigate to deployment directory
cd /opt/enit-connect

# Pull latest images
docker compose pull

# Start containers
docker compose up -d

# Verify containers are running
docker compose ps
```

**Expected output:**
```
NAME            IMAGE                                     STATUS          PORTS
tic-backend     firaskali/enit-connect-backend:latest     Up (healthy)    3000/tcp
tic-frontend    firaskali/enit-connect-frontend:latest    Up (healthy)    0.0.0.0:80->80/tcp
```

---

## Step 7: Verify Deployment

```bash
# Check backend logs
docker compose logs backend

# Check frontend logs
docker compose logs frontend

# Test backend health
curl http://localhost/api/admin/news

# Test frontend
curl http://localhost/

# Check from browser
# Open: http://YOUR_SERVER_IP
```

---

## Step 8: View Uploaded Files

```bash
# List uploaded files (through container)
docker exec tic-backend ls -lah /app/uploads

# List uploaded files (on host - requires sudo)
sudo ls -lah /var/lib/docker/volumes/tic-uploads/_data/

# Check volume details
docker volume inspect tic-uploads

# Check disk usage
sudo du -sh /var/lib/docker/volumes/tic-uploads/_data/
```

---

## Management Commands

### Start/Stop Services

```bash
# Stop all containers
docker compose down

# Start all containers
docker compose up -d

# Restart specific service
docker compose restart backend
docker compose restart frontend

# View logs
docker compose logs -f backend
docker compose logs -f frontend
```

### Update to Latest Images

```bash
cd /opt/enit-connect

# Pull latest images
docker compose pull

# Recreate containers with new images
docker compose up -d --force-recreate

# Remove old images
docker image prune -f
```

### Deploy Specific Version

```bash
# Deploy specific tag
TAG=v1.0.0 docker compose up -d

# Or export TAG
export TAG=abc1234
docker compose up -d
```

### Backup Data

```bash
# Backup uploaded files
sudo tar -czf enit-uploads-backup-$(date +%Y%m%d).tar.gz \
  -C /var/lib/docker/volumes/tic-uploads/_data/ .

# Backup configuration
tar -czf enit-config-backup-$(date +%Y%m%d).tar.gz \
  /opt/enit-connect/Backend/.env \
  /opt/enit-connect/nginx/nginx.conf \
  /opt/enit-connect/docker-compose.yml
```

### Restore Data

```bash
# Restore uploaded files
sudo tar -xzf enit-uploads-backup-YYYYMMDD.tar.gz \
  -C /var/lib/docker/volumes/tic-uploads/_data/
```

---

## Troubleshooting

### Backend not starting

```bash
# Check logs
docker compose logs backend

# Check environment variables
docker exec tic-backend printenv

# Test MongoDB connection
docker exec tic-backend node -e "console.log(require('./config/db.config'))"
```

### Frontend shows 502 Bad Gateway

```bash
# Check if backend is healthy
docker compose ps

# Check backend logs
docker compose logs backend

# Restart backend
docker compose restart backend
```

### Cannot access application

```bash
# Check firewall
sudo ufw status
sudo ufw allow 80/tcp

# Check if port 80 is listening
sudo netstat -tulpn | grep :80

# Check nginx logs
docker compose logs frontend
```

### High memory usage

```bash
# Check resource usage
docker stats

# Restart containers
docker compose restart
```

### Permission issues with uploads

```bash
# Fix permissions on volume
sudo chown -R 1001:1001 /var/lib/docker/volumes/tic-uploads/_data/
docker compose restart backend
```

---

## Security Recommendations

### 1. Use HTTPS (Production)

Install Certbot for Let's Encrypt SSL:

```bash
sudo apt-get install certbot
sudo certbot certonly --standalone -d your-domain.com

# Update nginx.conf to use SSL certificates
# Add volume mount for certificates in docker-compose.yml
```

### 2. Change Default Secrets

- Generate strong `JWT_SECRET`
- Use unique passwords for all services
- Enable 2FA on MongoDB Atlas

### 3. Firewall Configuration

```bash
# Enable firewall
sudo ufw enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Check status
sudo ufw status
```

### 4. Regular Updates

```bash
# Update Docker images regularly
cd /opt/enit-connect
docker compose pull
docker compose up -d

# Update Ubuntu packages
sudo apt-get update
sudo apt-get upgrade -y
```

---

## Monitoring

### Check Application Health

```bash
# Health check script
cat > /opt/enit-connect/health-check.sh << 'EOF'
#!/bin/bash
echo "=== Container Status ==="
docker compose ps

echo -e "\n=== Backend Health ==="
curl -s http://localhost/api/admin/news | jq '.' || echo "Backend unhealthy"

echo -e "\n=== Frontend Health ==="
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost/

echo -e "\n=== Disk Usage ==="
df -h /var/lib/docker/volumes/tic-uploads/_data/

echo -e "\n=== Memory Usage ==="
docker stats --no-stream
EOF

chmod +x /opt/enit-connect/health-check.sh

# Run health check
/opt/enit-connect/health-check.sh
```

### Setup Monitoring (Optional)

Consider using:
- **Portainer** for Docker GUI management
- **Prometheus + Grafana** for metrics
- **Uptime Kuma** for uptime monitoring

---

## Uninstall

```bash
# Stop and remove containers
cd /opt/enit-connect
docker compose down

# Remove volumes (WARNING: deletes all uploaded files)
docker volume rm tic-uploads

# Remove images
docker rmi firaskali/enit-connect-backend:latest
docker rmi firaskali/enit-connect-frontend:latest

# Remove deployment files
sudo rm -rf /opt/enit-connect
```

---

## Support

For issues or questions:
- Check logs: `docker compose logs`
- Review this guide's troubleshooting section
- Verify `.env` configuration
- Ensure MongoDB Atlas IP whitelist includes your server

---

## Quick Reference

| Command | Description |
|---------|-------------|
| `docker compose up -d` | Start all services |
| `docker compose down` | Stop all services |
| `docker compose logs -f` | View live logs |
| `docker compose ps` | Check container status |
| `docker compose pull` | Update images |
| `docker compose restart` | Restart services |
| `docker exec -it tic-backend sh` | Access backend shell |
| `docker volume inspect tic-uploads` | Check upload volume |

---

**Deployment Date:** January 12, 2026  
**Images:** `firaskali/enit-connect-backend:latest` & `firaskali/enit-connect-frontend:latest`
