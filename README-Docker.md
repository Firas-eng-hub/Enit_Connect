# TIC-Connect Docker Deployment Guide

## Quick Start (Local Development)

### Prerequisites
- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Docker Compose v2.x

### 1. Clone Repository
```bash
git clone https://github.com/Firas-eng-hub/Enit_Connect.git
cd Enit_Connect
```

### 2. Configure Environment
```bash
# Copy environment template
cp .env.docker.example .env

# Edit with your values
nano .env  # or use any text editor
```

### 3. Build and Run
```bash
# Build and start all services
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

### 4. Access Application
- **Frontend:** http://localhost
- **Backend API:** http://localhost/api
- **Direct Backend:** http://localhost:3000

---

## Azure VPS Deployment

### Step 1: Prepare Azure VPS (Ubuntu 24 LTS)

```bash
# Connect to your VPS
ssh your-user@your-vps-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group (to run without sudo)
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Logout and login again for group changes
exit
```

### Step 2: Clone and Configure

```bash
# Clone repository
git clone https://github.com/Firas-eng-hub/Enit_Connect.git
cd Enit_Connect

# Create environment file
cp .env.docker.example .env
nano .env
```

Fill in your actual values:
```env
JWT_SECRET=your-strong-secret-key
DB_USER=your-mongodb-user
DB_PASS=your-mongodb-password
DB_HOST=clusterenit.iqfou3e.mongodb.net
DB_DOMAIN=clusterenit.iqfou3e.mongodb.net
DB_NAME=TIC-ENIT
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-gmail-app-password
```

### Step 3: Configure Firewall

```bash
# Allow HTTP
sudo ufw allow 80/tcp

# Allow HTTPS (for later SSL setup)
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
```

### Step 4: Deploy

```bash
# Build and start
docker compose up -d --build

# View logs
docker compose logs -f

# Check status
docker compose ps
```

---

## Windows 11 Deployment

### Prerequisites
1. Install [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)
2. Enable WSL 2 when prompted
3. Restart computer

### Steps

```powershell
# Clone repository
git clone https://github.com/Firas-eng-hub/Enit_Connect.git
cd Enit_Connect

# Copy environment file
copy .env.docker.example .env

# Edit .env file with notepad or your preferred editor
notepad .env

# Build and run
docker-compose up --build
```

---

## Test Commands

### Build Images Individually
```bash
# Backend only
docker build -f Dockerfile.backend -t tic-backend ./Backend

# Frontend only
docker build -f Dockerfile.frontend -t tic-frontend ./Frontend
```

### Verify Services
```bash
# Check running containers
docker compose ps

# View backend logs
docker compose logs backend

# View frontend logs
docker compose logs frontend

# Test backend health
curl http://localhost:3000/

# Test API through nginx
curl http://localhost/api/student/all

# Test frontend
curl http://localhost/health
```

### Volume Persistence Test
```bash
# Create test file in uploads
docker compose exec backend touch /app/uploads/test.txt

# Restart containers
docker compose down
docker compose up -d

# Verify file exists
docker compose exec backend ls /app/uploads/
# Should show: test.txt
```

---

## SSL/HTTPS with Let's Encrypt (Optional)

### Install Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### Update docker-compose.yml
Add port 443 to frontend service:
```yaml
frontend:
  ports:
    - "80:80"
    - "443:443"
```

### Get Certificate
```bash
# Stop containers temporarily
docker compose down

# Get certificate (replace with your domain)
sudo certbot certonly --standalone -d yourdomain.com

# Certificates will be in /etc/letsencrypt/live/yourdomain.com/
```

### Update nginx.conf for HTTPS
Add to nginx/nginx.conf:
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # ... rest of config
}
```

---

## Troubleshooting

### Issue: MongoDB Connection Failed
**Error:** `MongoNetworkError: failed to connect`

**Solutions:**
1. Verify credentials in `.env`
2. Check if your IP is whitelisted in MongoDB Atlas
3. Ensure container has internet access:
   ```bash
   docker compose exec backend ping google.com
   ```

### Issue: Permission Denied on Uploads
**Error:** `EACCES: permission denied, open '/app/uploads/...'`

**Solution:**
```bash
# Fix permissions on host
sudo chown -R 1001:1001 Backend/uploads/

# Or remove and recreate volume
docker volume rm tic-uploads
docker compose up -d
```

### Issue: Angular Build Fails (OpenSSL Error)
**Error:** `ERR_OSSL_EVP_UNSUPPORTED`

**Solution:** The Dockerfile uses Node 16 which doesn't have this issue. If you modify it:
```dockerfile
ENV NODE_OPTIONS=--openssl-legacy-provider
```

### Issue: 502 Bad Gateway
**Error:** Nginx shows 502

**Solutions:**
1. Check if backend is running:
   ```bash
   docker compose logs backend
   ```
2. Verify network connectivity:
   ```bash
   docker compose exec frontend ping backend
   ```

### Issue: CORS Errors
**Error:** `Access-Control-Allow-Origin` missing

**Solution:** Backend already has CORS enabled. Ensure you're accessing through nginx (http://localhost/api) not directly.

---

## GitHub Actions Secrets

To enable CI/CD, add these secrets to your GitHub repository:

| Secret Name | Description |
|-------------|-------------|
| `DOCKERHUB_USERNAME` | Your Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub access token ([create here](https://hub.docker.com/settings/security)) |
| `VPS_HOST` | Your Azure VPS IP address |
| `VPS_USERNAME` | SSH username (e.g., `azureuser`) |
| `VPS_SSH_KEY` | Private SSH key for VPS access |

---

## Useful Commands

```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# View logs
docker compose logs -f

# Restart specific service
docker compose restart backend

# Rebuild specific service
docker compose up -d --build backend

# Enter backend container
docker compose exec backend sh

# Enter frontend/nginx container
docker compose exec frontend sh

# Clean up everything
docker compose down -v --rmi all
```

---

## Architecture

```
                    ┌─────────────────────┐
                    │    User Browser     │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Nginx (Port 80)   │
                    │   - Static files    │
                    │   - Reverse proxy   │
                    └──────────┬──────────┘
                               │
              ┌────────────────┴────────────────┐
              │                                 │
              ▼                                 ▼
    ┌─────────────────┐               ┌─────────────────┐
    │  Angular SPA    │               │ /api/* → Backend│
    │  (static files) │               │   (Port 3000)   │
    └─────────────────┘               └────────┬────────┘
                                               │
                                               ▼
                                    ┌─────────────────────┐
                                    │   MongoDB Atlas     │
                                    │   (External Cloud)  │
                                    └─────────────────────┘
```

---

**Last Updated:** December 2024
