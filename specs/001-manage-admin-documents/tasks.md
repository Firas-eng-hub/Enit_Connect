---

description: "Task list template for feature implementation"
---

# Tasks: Admin Document Management

**Input**: Design documents from `/home/ubuntu/Desktop/ENIT-CONNECT/specs/001-manage-admin-documents/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are OPTIONAL. None requested in the feature specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `Backend/`, `frontend/`
- Paths shown below follow the current repo structure

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 [P] Create admin documents feature module barrel in `frontend/src/features/admin-documents/index.ts`
- [x] T002 [P] Align admin document types with backend fields in `frontend/src/entities/document/types.ts`
- [x] T003 [P] Add base admin document API methods (list, create) in `frontend/src/entities/document/api.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Add migration for documents.category in `Backend/db/migrations/011_add_documents_category.sql`
- [x] T005 Update documents schema snapshot in `Backend/db/schema.sql`
- [x] T006 Update document persistence/mapping for category filters in `Backend/repositories/document.repository.js`
- [x] T007 Add admin upload validation middleware in `Backend/helpers/admin-document-upload.js`
- [x] T008 Create admin documents controller module in `Backend/controllers/admin-documents.controller.js`
- [x] T009 Wire RESTful admin document routes in `Backend/routes/admin.routes.js`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Add a Document (Priority: P1) 🎯 MVP

**Goal**: Admins can upload documents and see them listed in the admin UI.

**Independent Test**: Upload a document with a title and confirm it appears in the list and opens.

### Implementation for User Story 1

- [x] T010 [US1] Implement list handler for GET `/api/admin/documents` in `Backend/controllers/admin-documents.controller.js`
- [x] T011 [US1] Implement create handler for POST `/api/admin/documents` in `Backend/controllers/admin-documents.controller.js`
- [x] T012 [US1] Add admin document hooks for list/create in `frontend/src/entities/document/hooks.ts`
- [x] T013 [US1] Build upload form UI in `frontend/src/features/admin-documents/DocumentUploadForm.tsx`
- [x] T014 [US1] Build document list UI in `frontend/src/features/admin-documents/DocumentList.tsx`
- [x] T015 [US1] Wire page layout to hooks/components in `frontend/src/pages/admin/DocumentsPage.tsx`

**Checkpoint**: User Story 1 is fully functional and testable independently

---

## Phase 4: User Story 2 - Update or Remove Documents (Priority: P2)

**Goal**: Admins can edit metadata, replace files, and delete documents with confirmation.

**Independent Test**: Edit a document title, replace its file, delete it, and confirm it is gone.

### Implementation for User Story 2

- [x] T016 [US2] Implement metadata update handler for PATCH `/api/admin/documents/:id` in `Backend/controllers/admin-documents.controller.js`
- [x] T017 [US2] Implement file replacement handler for POST `/api/admin/documents/:id/file` in `Backend/controllers/admin-documents.controller.js`
- [x] T018 [US2] Implement delete handler for DELETE `/api/admin/documents/:id` in `Backend/controllers/admin-documents.controller.js`
- [x] T019 [US2] Extend admin document API client for update/replace/delete in `frontend/src/entities/document/api.ts`
- [x] T020 [US2] Add admin document hooks for update/replace/delete in `frontend/src/entities/document/hooks.ts`
- [x] T021 [US2] Add edit/replace/delete actions in `frontend/src/features/admin-documents/DocumentList.tsx`
- [x] T022 [US2] Add confirmation dialogs and feedback messaging in `frontend/src/pages/admin/DocumentsPage.tsx`

**Checkpoint**: User Stories 1 AND 2 work independently

---

## Phase 5: User Story 3 - Find and Organize Documents (Priority: P3)

**Goal**: Admins can search, filter, and sort documents.

**Independent Test**: Apply a search and category filter and verify only matching results show.

### Implementation for User Story 3

- [x] T023 [US3] Extend list handler for search/filter/sort params in `Backend/controllers/admin-documents.controller.js`
- [x] T024 [US3] Update list API client to send query params in `frontend/src/entities/document/api.ts`
- [x] T025 [US3] Add filter/search/sort controls in `frontend/src/features/admin-documents/DocumentFilters.tsx`
- [x] T026 [US3] Wire filter state to list queries in `frontend/src/pages/admin/DocumentsPage.tsx`

**Checkpoint**: All user stories are independently functional

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T027 [P] Update validation steps if needed in `specs/001-manage-admin-documents/quickstart.md`
- [x] T028 [P] Run `npm run lint` and `npm run build` from `frontend/` and capture outcomes in PR notes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - no dependencies
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - builds on US1 data
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - depends on list view from US1

### Within Each User Story

- Models before services (repositories before controllers)
- Controllers before frontend integration
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- Setup tasks T001-T003 can run in parallel
- Foundational tasks T004-T007 can run in parallel (if migration order is respected)
- UI component tasks within a story can run in parallel if touching separate files

---

## Parallel Example: User Story 1

```bash
# Build UI components in parallel:
Task: "T013 Build upload form UI in frontend/src/features/admin-documents/DocumentUploadForm.tsx"
Task: "T014 Build document list UI in frontend/src/features/admin-documents/DocumentList.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Demo or deploy if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Demo (MVP)
3. Add User Story 2 → Test independently → Demo
4. Add User Story 3 → Test independently → Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- If data models change, add tasks for a migration and an updated Backend/db/schema.sql
- If configuration changes, add tasks to update .env examples and docker-compose or nginx
- If security-sensitive behavior changes, add tasks to update SECURITY.md and avoid logging secrets
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
