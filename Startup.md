# Startup Guide — Deploy ENIT-CONNECT from Docker Hub

No repo clone needed. Just create 3 files, then one command to run everything.

## Prerequisites

Install **Docker Desktop** (includes Docker Compose):
- **Windows / Mac**: https://www.docker.com/products/docker-desktop
- **Linux (Ubuntu)**:
  ```bash
  sudo apt update && sudo apt install docker.io docker-compose-v2 -y
  sudo usermod -aG docker $USER
  ```
  Then **log out and back in** so the group change takes effect.

Verify it works:
```bash
docker --version
docker compose version
```

## 1. Create Folder Structure

```bash
mkdir -p enit-connect/nginx enit-connect/uploads
cd enit-connect
```

```
enit-connect/
├── docker-compose.yml
├── .env
├── nginx/
│   └── nginx.conf
└── uploads/            # persisted backend uploads
```

## 2. Create the Files

For each file below, create it using any text editor. Example with `nano`:
```bash
nano docker-compose.yml     # paste content, then Ctrl+O to save, Ctrl+X to exit
nano .env
nano nginx/nginx.conf
```
Or on **Windows**, just create the files with Notepad / VS Code in the `enit-connect` folder.

### docker-compose.yml

```yaml
services:
  db:
    container_name: tic-db
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: enit_connect
      POSTGRES_USER: enit_user
      POSTGRES_PASSWORD: ${DB_PASSWORD:-change-me}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - tic-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U enit_user -d enit_connect"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 20s

  backend:
    container_name: tic-backend
    image: firaskali/enit-connect-backend:latest
    restart: unless-stopped
    env_file:
      - .env
    volumes:
      - ./uploads:/app/uploads
    depends_on:
      db:
        condition: service_healthy
    networks:
      - tic-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 15s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  frontend:
    container_name: tic-frontend
    image: firaskali/enit-connect-frontend:latest
    restart: unless-stopped
    ports:
      - "80:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      backend:
        condition: service_healthy
    networks:
      - tic-network
    healthcheck:
      test: ["CMD", "curl", "-sf", "-H", "User-Agent: docker-healthcheck", "http://localhost/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

networks:
  tic-network:
    driver: bridge
    name: tic-connect-network

volumes:
  postgres_data:
    name: tic-postgres
    driver: local
```

### .env

```env
# Database
# ⚠️ IMPORTANT: The password after "enit_user:" and DB_PASSWORD MUST be the same!
# Replace "change-me" with your own password in BOTH lines.
DATABASE_URL=postgresql://enit_user:change-me@db:5432/enit_connect
DB_PASSWORD=change-me

# Auth
JWT_SECRET=REPLACE_WITH_A_STRONG_RANDOM_STRING
PORT=3000
NODE_ENV=production
BASE_URL=http://localhost:3000
APP_URL=http://localhost:3000
FILE_BASE_URL=http://localhost:3000

# CORS — must match the URL you open in browser
FRONTEND_URL=http://localhost

# Cookies
COOKIE_SECURE=false
COOKIE_SAMESITE=lax
COOKIE_DOMAIN=

# Email (optional)
EMAIL_USER=
EMAIL_PASS=
MAIL_NOTIFICATIONS_ENABLED=true
MAIL_IMMEDIATE_ADMIN_NOTICE=true

# Geocoder (optional)
GEOCODER_API_KEY=

# Document AV scan (optional)
DOC_AV_SCAN_URL=
```

> Generate a strong JWT secret:
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

### nginx/nginx.conf

```nginx
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    access_log /var/log/nginx/access.log main;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    keepalive_requests 1000;
    types_hash_max_size 2048;
    client_header_timeout 10s;
    client_body_timeout 30s;
    send_timeout 30s;

    # Gzip
    gzip on;
    gzip_disable "msie6";
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_buffers 16 8k;
    gzip_http_version 1.1;
    gzip_min_length 256;
    gzip_types
        application/atom+xml
        application/geo+json
        application/javascript
        application/x-javascript
        application/json
        application/ld+json
        application/manifest+json
        application/rdf+xml
        application/rss+xml
        application/xhtml+xml
        application/xml
        font/eot
        font/otf
        font/ttf
        image/svg+xml
        text/css
        text/javascript
        text/plain
        text/xml;

    # File cache
    open_file_cache max=20000 inactive=30s;
    open_file_cache_valid 60s;
    open_file_cache_min_uses 2;
    open_file_cache_errors on;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header X-DNS-Prefetch-Control "off" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=()" always;
    add_header X-Robots-Tag "noindex, nofollow" always;
    add_header Cross-Origin-Resource-Policy "same-site" always;

    server_tokens off;
    client_max_body_size 10M;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/s;
    limit_conn_zone $binary_remote_addr zone=conn_limit:10m;

    # API cache
    proxy_cache_path /var/cache/nginx/api levels=1:2 keys_zone=api_cache:10m max_size=200m inactive=10m use_temp_path=off;
    proxy_cache_key "$scheme$request_method$host$request_uri";

    upstream backend_server {
        server backend:3000;
        keepalive 32;
    }

    server {
        listen 80;
        server_name localhost;
        server_tokens off;

        root /usr/share/nginx/html;
        index index.html;

        # Block non-standard methods
        if ($request_method !~ ^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)$) {
            return 444;
        }

        limit_conn conn_limit 10;

        # SSE endpoints (long-lived connections)
        location ~* ^/api/(student|company|admin)/notifications/subscribe$ {
            proxy_pass http://backend_server;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header Connection "";
            proxy_buffering off;
            proxy_cache off;
            proxy_read_timeout 3600s;
            proxy_send_timeout 3600s;
            proxy_connect_timeout 60s;
            add_header X-Accel-Buffering "no" always;
            limit_conn conn_limit 30;
        }

        # API proxy
        location /api/ {
            proxy_pass http://backend_server;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
            proxy_buffering on;
            proxy_buffer_size 16k;
            proxy_buffers 16 16k;
            proxy_busy_buffers_size 32k;
            limit_req zone=api_limit burst=20 nodelay;
            proxy_cache api_cache;
            proxy_cache_methods GET HEAD;
            proxy_cache_valid 200 1m;
            proxy_cache_valid 404 10s;
            proxy_cache_bypass $http_authorization $cookie_accessToken;
            proxy_no_cache $http_authorization $cookie_accessToken;
            add_header X-Cache-Status $upstream_cache_status always;
        }

        # Auth endpoints (stricter rate limit)
        location /api/auth/ {
            proxy_pass http://backend_server;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
            limit_req zone=auth_limit burst=10 nodelay;
        }

        # Uploaded files
        location ^~ /uploads/ {
            proxy_pass http://backend_server/uploads/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            expires 30d;
            add_header Cache-Control "public";
        }

        # SPA fallback
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            etag on;
            try_files $uri =404;
        }

        # Deny hidden files
        location ~ /\. {
            deny all;
            access_log off;
            log_not_found off;
        }

        # Block sensitive file extensions
        location ~* \.(bak|config|sql|fla|psd|ini|log|sh|inc|swp|dist|orig|save)$ {
            deny all;
            access_log off;
            log_not_found off;
        }

        # Block sensitive files
        location ~* ^/(README|CHANGELOG|LICENSE|composer\.(json|lock)|package\.(json|lock)|\.env) {
            deny all;
            access_log off;
            log_not_found off;
        }

        # Block bots/scrapers
        if ($http_user_agent ~* (bot|crawler|spider|scraper|curl|wget|python|nikto|sqlmap|nmap|masscan)) {
            return 403;
        }
    }
}
```

## 3. Start

```bash
docker compose up -d
```

Docker will pull the images automatically:
- `firaskali/enit-connect-backend:latest`
- `firaskali/enit-connect-frontend:latest`
- `postgres:16-alpine`

## 4. Verify

```bash
docker compose ps          # 3 containers, all healthy
docker compose logs -f     # watch logs
```

Open **http://localhost** in browser.

## Containers Overview

| Container      | Image                                   | Port |
|----------------|-----------------------------------------|------|
| `tic-db`       | `postgres:16-alpine`                    | —    |
| `tic-backend`  | `firaskali/enit-connect-backend:latest` | —    |
| `tic-frontend` | `firaskali/enit-connect-frontend:latest`| 80   |

## Routing

```
Browser :80  →  Nginx (frontend container)
                  ├── /api/auth/*  → backend:3000  (stricter rate limit)
                  ├── /api/*       → backend:3000  (cached + rate limited)
                  ├── /uploads/*   → backend:3000  (static files)
                  └── /*           → React SPA
```

## Common Commands

```bash
docker compose down                     # stop all
docker compose down -v                  # stop + delete DB data
docker compose pull                     # pull latest images
docker compose up -d                    # restart with latest
docker compose logs backend --tail=50   # backend logs only
docker compose exec backend sh          # shell into backend
```

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `docker: command not found` | Install Docker Desktop (see Prerequisites above) |
| `permission denied` on Linux | Run `sudo usermod -aG docker $USER` then **log out and back in** |
| `port 80 already in use` | Stop whatever is using port 80, or change `"80:80"` to `"8080:80"` in docker-compose.yml then open `http://localhost:8080` |
| Backend keeps restarting | Check logs: `docker compose logs backend` — most likely a wrong `DATABASE_URL` or password mismatch between `DB_PASSWORD` and `DATABASE_URL` |
| Frontend shows unhealthy | Run `docker compose logs frontend` — make sure `nginx/nginx.conf` file exists and was pasted correctly |
| Blank page in browser | Open browser dev tools (F12) > Console tab. If you see API errors, the backend may still be starting — wait 30s and refresh |
| `docker compose` not recognized | Older Docker versions use `docker-compose` (with hyphen) instead of `docker compose` (with space) |
