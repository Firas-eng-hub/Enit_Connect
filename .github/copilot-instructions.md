# Copilot Instructions — ENIT-CONNECT

## Architecture Overview

A university career platform connecting students, companies, and admins. Three-tier MEAN stack deployed via Docker.

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   Angular 10    │──────▶│     Nginx       │──────▶│  Express API    │──────▶ MongoDB Atlas
│   Frontend/     │  :80  │  (reverse proxy)│  /api │  Backend/       │
└─────────────────┘       └─────────────────┘       └─────────────────┘
```

- **Frontend** (`Frontend/`): Angular 10 SPA with role-based routing (`visitor`, `user`, `company`, `admin`)
- **Backend** (`Backend/`): Express REST API, Mongoose ODM, JWT auth with HTTP-only cookies
- **Nginx** (`nginx/nginx.conf`): Reverse proxy rewrites `/api/*` → backend port 3000

## API Contract (Critical)

**Production** (`environment.prod.ts`): `apiUrl = ''` (empty string, relative to origin)  
**Development** (`environment.ts`): `apiUrl = 'http://localhost:3000'` — direct to backend

Backend mounts routes under `/api/`:
```javascript
// Backend/app.js
app.use("/api/auth", auth_routes);
app.use("/api/admin", admin_routes);
app.use("/api/student", student_routes);
app.use("/api/company", company_routes);
app.use("/api/offers", offer_routes);
```

**Frontend URL pattern**: Always use `${apiUrl}/api/...` (e.g., `${environment.apiUrl}/api/admin/news`). Nginx proxies `/api/*` to backend without rewriting.

## Auth Flow

- JWT access tokens (24h) + refresh tokens (7d) stored in HTTP-only cookies
- `AuthService` (`Frontend/src/app/core/services/auth.service.ts`) manages state
- Backend middleware: `authJwt.verifyToken` reads from cookie, falls back to `Authorization` header
- Guards per role: `IsUserGuard`, `IsCompanyGuard`, `IsAdminGuard`, `IsVisitorGuard`

## Development Commands

```bash
# Docker (preferred) — local Ubuntu server, later OVH VPS
docker compose up -d --build
docker compose logs -f

# Local Backend
cd Backend && npm install && npm run dev

# Local Frontend (requires Node 14-16 or NODE_OPTIONS=--openssl-legacy-provider)
cd Frontend && npm install && npm start
```

See `CLAUDE.md` for detailed command history, current state tracking, and agent workflow rules.

## Data Models

All in `Backend/models/`:
- `student.model.js`: User accounts with type (student/alumni), location, profile
- `company.model.js`: Company profiles with verification status
- `offer.model.js`: Job/internship listings linked to companies
- `refreshToken.model.js`: Persisted tokens for rotation

## File Structure Patterns

```
Backend/
├── controllers/    # Route handlers (auth, student, company, admin, offer)
├── middlewares/    # authJwt.js (token verify), verifySignUp.js (duplicate check)
├── models/         # Mongoose schemas (index.js re-exports all)
├── routes/         # Express routers, apply middleware chains
├── uploads/        # Persisted via Docker volume

Frontend/src/app/
├── core/           # Singleton services (AuthService), HTTP interceptor
├── visitor/        # Public pages (news, login forms)
├── user/           # Student dashboard (after login)
├── company/        # Company dashboard
├── admin/          # Admin panel
```

## Security Middleware Stack

Applied in `Backend/app.js`:
1. `helmet` — security headers
2. `rateLimit` — 100 req/15min general, 5 req/15min auth endpoints
3. `mongoSanitize` — NoSQL injection prevention
4. `hpp` — HTTP parameter pollution protection

## Known Constraints

- Angular 10 is EOL; requires `NODE_OPTIONS=--openssl-legacy-provider` on Node 18+
- Frontend build: `npm run build` outputs to `dist/` (not `dist/Frontend`)
- File uploads: 10MB limit (backend + nginx)
- CORS: credentials enabled for cookie-based auth

## When Making Changes

1. API changes: Update both `Backend/routes/*.routes.js` and corresponding frontend service
2. New models: Export in `Backend/models/index.js`
3. Protected routes: Apply `[authJwt.verifyToken, authJwt.isStudent|isCompany|isAdmin]`
4. Environment: Production env vars via `Backend/.env`, never commit secrets
5. Reference `CLAUDE.md` for current repo state and recent decisions
