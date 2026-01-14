# Copilot Instructions — ENIT-CONNECT

## Architecture Overview

University career platform connecting students, companies, and admins. Tech stack: **React + Vite + TypeScript** frontend, **Node.js/Express** backend, **MongoDB Atlas** database, deployed via Docker with nginx reverse proxy.

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│  React + Vite   │──────▶│     Nginx       │──────▶│  Express API    │──────▶ MongoDB Atlas
│   frontend/     │  :80  │  (reverse proxy)│  /api │  Backend/       │
└─────────────────┘       └─────────────────┘       └─────────────────┘
```

**Key Components:**
- **Frontend** (`frontend/`): React 18 + Vite + TypeScript SPA, role-based routing (`visitor`, `user`, `company`, `admin`), Tailwind CSS
- **Backend** (`Backend/`): Express REST API, Mongoose ODM, JWT + HTTP-only cookies
- **Nginx** (`nginx/nginx.conf`): Proxies `/api/*` → `backend:3000`, serves React static files

## Critical API Contract

**Environment URLs** — Production vs Development differ critically:
```typescript
// frontend/src/app/config/env.ts
export const config = {
  apiUrl: import.meta.env.VITE_API_URL || '', // Empty in production (nginx proxy)
};

// Development: VITE_API_URL=http://localhost:3000
```

**Backend route mounting** (`Backend/app.js`):
```javascript
app.use("/api/auth", auth_routes);
app.use("/api/admin", admin_routes);
app.use("/api/student", student_routes);
app.use("/api/company", company_routes);
app.use("/api/offers", offer_routes);
```

**Frontend request pattern**: Always `${config.apiUrl}/api/...` via httpClient. In production, nginx proxies `/api/*` to backend container.

## Authentication Flow (Cookie-based JWT)

1. **Login** → Backend sets HTTP-only cookies: `accessToken` (24h), `refreshToken` (7d), `userType`
2. **AuthProvider** (`frontend/src/features/auth/hooks/useAuth.tsx`) manages auth state
3. **Middleware chain** (`Backend/middlewares/authJwt.js`):
   - `verifyToken`: Reads from cookie first, falls back to `Authorization` header
   - Role checks: `isStudent`, `isCompany`, `isAdmin`
4. **Frontend guards**: `RequireAuth`, `RequireStudent`, `RequireCompany`, `RequireAdmin`, `RequireVisitor` in `frontend/src/app/router/guards/`
5. **httpClient** (`frontend/src/shared/api/httpClient.ts`) sends `withCredentials: true`

**Protected route example** (`Backend/routes/student.routes.js`):
```javascript
router.patch("/:id", authJwt.verifyToken, authJwt.isStudent, controller.updateStudent);
```

## Development Commands

```bash
# Docker (recommended) — full stack with nginx
docker compose up -d --build
docker compose logs -f backend  # or frontend

# Local Backend only
cd Backend && npm install && npm run dev  # Port 3000

# Local Frontend (React + Vite)
cd frontend && npm install && npm run dev  # Port 4200
```

**Health check**: Backend exposes `/health` for Docker healthcheck (see `Backend/app.js`).

## Data Models & Schema Patterns

All in `Backend/models/`, re-exported via `index.js`:
- **student.model.js**: User accounts (`firstname`, `lastname`, `email`, `password`, `status: 'Pending'|'Active'`, `confirmationCode`, `type`, location fields, `picture`)
- **company.model.js**: Company profiles with verification status
- **offer.model.js**: Job/internship listings linked to companies
- **refreshToken.model.js**: Persisted tokens (7-day expiry) for rotation
- **document.model.js**, **new.model.js**, **post.model.js**: Content/messaging features

**Schema convention**: Mongoose models use `mongoose.Schema.Types.ObjectId` for `_id`, explicit field types with `required`, `enum` for status fields.

## File Structure Patterns

```
Backend/
├── config/         # auth.config.js (JWT secret), db.config.js (MongoDB Atlas URI)
├── controllers/    # Business logic (auth, student, company, admin, offer)
├── middlewares/    # authJwt.js (token + role verify), verifySignUp.js (duplicate check)
├── models/         # Mongoose schemas (index.js re-exports all)
├── routes/         # Express routers, apply middleware chains
├── helpers/        # storage.js (file uploads), newsdoc.js, savedoc.js
├── emails/         # Pug templates (confirmation, search notifications)
├── uploads/        # Persisted via Docker volume

frontend/src/
├── app/
│   ├── config/         # env.ts (environment config)
│   ├── layouts/        # VisitorLayout, StudentLayout, CompanyLayout, AdminLayout
│   ├── providers/      # QueryProvider (TanStack Query)
│   └── router/         # routes.tsx, guards/
├── entities/           # Type definitions (student, company, offer, news, document)
├── features/
│   └── auth/           # useAuth hook (AuthProvider context)
├── pages/
│   ├── visitor/        # NewsPage, StatisticsPage, MembersPage, AboutPage, LoginPage, RegisterPage
│   ├── student/        # HomePage, ProfilePage, SearchPage, DocumentsPage
│   ├── company/        # HomePage, CandidaciesPage, ProfilePage, SearchPage
│   └── admin/          # HomePage, SendEmailPage, SearchPage, AddUsersPage, DocumentsPage, MessagesPage
├── shared/
│   ├── api/            # httpClient.ts (axios with interceptors)
│   └── lib/            # utils.ts (cn, formatDate, getInitials)
└── widgets/
    └── sidebars/       # VisitorSidebar, StudentSidebar, CompanySidebar, AdminSidebar
```

## Security Middleware Stack

Applied in `Backend/app.js` (order matters):
1. **helmet** — Security headers (CSP disabled for file uploads)
2. **rateLimit** — 100 req/15min global, 5 req/15min auth endpoints (see `authLimiter` in routes)
3. **mongoSanitize** — NoSQL injection prevention
4. **hpp** — HTTP parameter pollution protection
5. **cookieParser** — Required for HTTP-only JWT cookies
6. **CORS** — `credentials: true` for cookie auth, origin from `process.env.FRONTEND_URL`

**Rate limiting per route** (`Backend/routes/student.routes.js`):
```javascript
const authLimiter = rateLimit({ windowMs: 15*60*1000, max: 5 });
router.post("/login", authLimiter, controller.signin);
```

## Known Constraints & Gotchas

- **Frontend build**: Vite outputs to `dist/` folder
- **Path aliases**: Use `@/` to import from `src/` (configured in tsconfig.app.json and vite.config.ts)
- **Dockerfile multi-stage**: Frontend Dockerfile copies from `/app/dist` → nginx html root
- **File uploads**: 10MB limit enforced by both `Backend/app.js` (`bodyParser.json({ limit: '10mb' })`) and `nginx.conf` (`client_max_body_size 10M`)
- **CORS credentials**: Frontend must send `withCredentials: true` for cookie-based auth to work
- **MongoDB Atlas**: Connection string uses `mongodb+srv://` with `retryWrites=true&w=majority` (see `Backend/app.js`)

## Making Changes Checklist

**API modifications:**
1. Update route in `Backend/routes/*.routes.js`
2. Update controller in `Backend/controllers/`
3. Update corresponding page/hook in `frontend/src/`
4. If protected: Add `[authJwt.verifyToken, authJwt.is<Role>]` middleware

**New models:**
1. Create in `Backend/models/<name>.model.js`
2. Export in `Backend/models/index.js`: `module.exports = { db, student, company, offer, <new> };`

**Environment variables:**
- **Never commit** `Backend/.env` (in `.gitignore`)
- Production secrets: JWT_SECRET (64+ chars), MongoDB credentials
- See `SECURITY.md` for hardening checklist

**Testing changes:**
- Docker: `docker compose down && docker compose up -d --build`
- Local: Run backend + frontend separately, test at `http://localhost:4200`
- Verify with `docker compose logs -f` for errors

## Reference Docs

- **CLAUDE.md**: Agent workflow rules, living log protocol, recent command history
- **DEPLOYMENT.md**: Step-by-step Ubuntu/Docker Hub deployment guide
- **SECURITY.md**: Threat model, rate limits, checklist for production
- **README-Docker.md**: Docker-specific setup and troubleshooting
- **MIGRATION_MAP.md**: Angular to React migration documentation
