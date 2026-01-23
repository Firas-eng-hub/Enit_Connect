# Research: Admin Document Management

## Decision 1: Admin document API surface

**Decision**: Introduce RESTful admin document endpoints under `/api/admin/documents` for list,
create, update metadata, replace file, and delete, aligned with existing frontend API usage.

**Rationale**: The frontend already references `/api/admin/documents`, and the backend has a
`documentRepository` that can serve list/search/update needs while keeping controllers thin.

**Alternatives considered**: Keep the legacy admin routes (`/admin/documents` POST patterns). This
would require frontend rewiring and does not fit the REST patterns used elsewhere.

## Decision 2: Category support

**Decision**: Add a nullable `category` column to the `documents` table to support explicit
filtering and display of categories in admin UI.

**Rationale**: `type` is already used for file/folder, and `tags` are multi-value. A dedicated
column keeps category filtering reliable and avoids overloading existing fields.

**Alternatives considered**: Store category in `extra` JSON or as a special tag. Both options
require custom parsing and make category filtering less clear.

## Decision 3: File validation limits

**Decision**: Reuse the student document constraints (10 MB, PDF/DOC/DOCX/PNG/JPG/JPEG) for admin
uploads and enforce the limits in backend upload middleware and the admin UI.

**Rationale**: Keeps consistency across roles and aligns with existing UX expectations in the
student document feature.

**Alternatives considered**: Allow any file type and size. This increases security risk and
creates an inconsistent experience.

## Decision 4: UI consistency approach

**Decision**: Build the admin document screen using the existing admin layout, shared UI
components, and patterns from the student documents page.

**Rationale**: Ensures the feature is visually consistent with the rest of the admin experience
and reduces implementation risk by reusing proven patterns.

**Alternatives considered**: Create a bespoke layout without shared components. This risks UI
inconsistency and higher maintenance cost.
