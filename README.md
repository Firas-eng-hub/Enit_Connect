# ENIT Connect

Career platform for ENIT students, alumni, and partner companies. This repo contains a Node/Express API, a Vite + React frontend, and Nginx configuration for reverse proxy in Docker.

## Project Structure
- `Backend/` Node/Express API (controllers, routes, repositories, DB migrations)
- `frontend/` Vite + React + TypeScript app
- `nginx/` Reverse proxy configuration
- `docker-compose.yml` Dev stack
- `docker-compose.prod.yml` Production stack

## Requirements
- Node.js >= 18
- Docker + Docker Compose (for containerized dev/prod)
- PostgreSQL (if running API outside Docker)

## Quick Start (Docker)
```bash
docker compose up --build
```

## Backend (Local)
```bash
cd Backend
npm install
npm run dev
```

## Frontend (Local)
```bash
cd frontend
npm install
npm run dev
```

## Environment Variables
- `Backend/.env.example` for API env vars
- `.env.docker.example` for Docker
- `frontend/.env.production` for frontend prod config

## Migrations
- SQL migrations live in `Backend/db/migrations/`
- Migrations are applied at server startup by `Backend/db/migrate.js`
- Keep `Backend/db/schema.sql` in sync after migration changes

## Useful Commands
Backend:
```bash
cd Backend
npm run dev
npm start
npm test
```

Frontend:
```bash
cd frontend
npm run dev
npm run build
npm run lint
npm run preview
```

Docker:
```bash
docker compose up --build
docker compose up -d db
docker compose logs -f backend
```

## Docs & Notes
- `DEPLOYMENT.md` deployment steps
- `README-Docker.md` Docker specifics
- `SECURITY.md` security guidance
