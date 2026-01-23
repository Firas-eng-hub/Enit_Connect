# Implementation Plan: Admin Document Enhancements

**Branch**: `002-admin-doc-enhancements` | **Date**: 2026-01-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-admin-doc-enhancements/spec.md`

## Summary

Enhance admin document management with folder organization, bulk actions, audience-restricted
sharing, version restore, and in-app previews while reusing the existing document storage and
admin UI structure.

## Technical Context

**Language/Version**: Node.js (Express) + TypeScript (React)  
**Primary Dependencies**: Express, PostgreSQL, Vite, React, TanStack Query  
**Storage**: PostgreSQL tables (`documents`, `document_versions`, `document_shares`,
`document_access`) + existing uploads storage  
**Testing**: No automated suite (npm test placeholder); manual verification in quickstart  
**Target Platform**: Linux server + modern browsers  
**Project Type**: Web (frontend + backend)  
**Performance Goals**: Search/filter results within 3 seconds for 200 documents; bulk actions for
20 documents complete in a single attempt  
**Constraints**: Share links require login and audience match; default expiration 7 days; folder
 deletion blocked unless empty; stale updates rejected with a conflict message  
**Scale/Scope**: Admin library of ~200 documents; bulk operations up to 20 items

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Backend changes preserve layered boundaries (routes/controllers/repositories/middlewares)
  and avoid direct DB access in controllers. (Pass)
- Data model changes include a migration in Backend/db/migrations and an updated
  Backend/db/schema.sql. (No new migrations expected; reuse existing tables)
- Frontend changes remain in frontend/src, use TypeScript or TSX, and follow the
  pages/widgets/features/entities/shared module boundaries. (Pass)
- Configuration or deployment changes update .env examples and docker-compose or nginx
  configuration when applicable. (Not expected)
- Security-sensitive changes follow SECURITY.md and avoid committing secrets or logging
  sensitive data. (Pass)

## Project Structure

### Documentation (this feature)

```text
specs/002-admin-doc-enhancements/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
Backend/
├── controllers/
├── routes/
├── middlewares/
├── repositories/
├── db/
└── utils/

frontend/
├── src/
│   ├── app/
│   ├── pages/
│   ├── features/
│   ├── entities/
│   └── shared/
```

**Structure Decision**: Use the existing monorepo layout with `Backend/` for the API and
`frontend/` for the React UI, matching current module conventions.

## Complexity Tracking

None.

## Phase 0: Outline & Research

### Research Tasks

- Document the access model for share links (login + audience match) and default expiration.
- Confirm folder deletion behavior (block if not empty).
- Define conflict handling for stale updates (reject with conflict warning).
- Define bulk download packaging (single ZIP).

### Phase 0 Output

`research.md`

## Phase 1: Design & Contracts

### Data Model

- Reuse existing tables: `documents`, `document_versions`, `document_shares`, `document_access`,
  `document_audit_logs`.
- Model folders as `documents` with `type = 'folder'` and hierarchical `emplacement` paths.
- Use `access_level` and `document_access` for audience targeting.
- Record version history in `document_versions` and update `documents.version` on replace/restore.

### API Contracts

- Admin folder CRUD endpoints.
- Bulk actions for delete, move, and download (ZIP).
- Share link create/list/revoke endpoints with login + audience enforcement.
- Version list and restore endpoints.

### Phase 1 Outputs

- `data-model.md`
- `contracts/admin-documents.openapi.yaml`
- `quickstart.md`

### Agent Context Update

Run `.specify/scripts/bash/update-agent-context.sh codex` after Phase 1 outputs are created.

## Constitution Check (Post-Design)

- Layered backend boundaries preserved; new endpoints route through controllers and repositories.
- No migrations required if existing document tables are reused; add migrations if new fields
  become necessary.
- Frontend changes remain under `frontend/src` with TypeScript modules.
- No new runtime configuration expected.
- Share link security aligned with SECURITY.md (login required, audience enforced).

## Phase 2: Planning Readiness

Spec, research, data model, and contracts are complete; proceed to `/speckit.tasks` to generate
implementation tasks.
