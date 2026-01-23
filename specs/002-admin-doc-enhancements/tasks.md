---

description: "Task list for Admin Document Enhancements"
---

# Tasks: Admin Document Enhancements

**Input**: Design documents from `/specs/002-admin-doc-enhancements/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Not requested; no test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing
of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Shared scaffolding for admin document enhancements

- [x] T001 Update admin enhancement types in `frontend/src/entities/document/types.ts`
- [x] T002 Add admin enhancement API surface in `frontend/src/entities/document/api.ts`
- [x] T003 Add admin enhancement hooks in `frontend/src/entities/document/hooks.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core prerequisites required by all user stories

- [x] T004 Extend admin list query filters (title, type, tags, folder path, date range) and include activity fields (last_opened_at, creator) in `Backend/repositories/document.repository.js`
- [x] T005 Implement stale update conflict checks in `Backend/repositories/document.repository.js` and `Backend/controllers/admin-documents.controller.js`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Organize and bulk-manage documents (Priority: P1) 🎯 MVP

**Goal**: Provide folders, navigation, and bulk actions to manage large document sets.

**Independent Test**: Create a folder, move documents, and run a bulk delete or download.

### Implementation for User Story 1

- [x] T006 [US1] Implement folder CRUD repository helpers in `Backend/repositories/document.repository.js`
- [x] T007 [US1] Implement folder handlers in `Backend/controllers/admin-documents.controller.js`
- [x] T008 [US1] Wire folder routes in `Backend/routes/admin.routes.js`
- [x] T009 [US1] Implement bulk delete/move/download handlers in `Backend/controllers/admin-documents.controller.js`
- [x] T010 [US1] Wire bulk action routes in `Backend/routes/admin.routes.js`
- [x] T011 [P] [US1] Extend filters for search, type, tags, folder/date range in `frontend/src/features/admin-documents/DocumentFilters.tsx`
- [x] T012 [P] [US1] Create folder tree UI in `frontend/src/features/admin-documents/FolderTree.tsx`
- [x] T013 [P] [US1] Create bulk actions bar in `frontend/src/features/admin-documents/BulkActionsBar.tsx`
- [x] T014 [US1] Implement folder + bulk API calls and hooks in `frontend/src/entities/document/api.ts` and `frontend/src/entities/document/hooks.ts`
- [x] T015 [US1] Wire selection, folder actions, bulk actions, and activity signals (last opened/uploader) in `frontend/src/features/admin-documents/DocumentList.tsx`
- [x] T016 [US1] Integrate folder tree, filters, and bulk actions in `frontend/src/pages/admin/DocumentsPage.tsx` and `frontend/src/features/admin-documents/index.ts`

**Checkpoint**: User Story 1 is independently functional

---

## Phase 4: User Story 2 - Control visibility and sharing (Priority: P2)

**Goal**: Allow admins to control audience visibility and manage share links.

**Independent Test**: Set an audience, create a share link, and revoke it; access respects login + audience match.

### Implementation for User Story 2

- [x] T017 [US2] Add audience update helpers in `Backend/repositories/documentAccess.repository.js` and `Backend/repositories/document.repository.js`
- [x] T018 [US2] Implement visibility update + share link handlers in `Backend/controllers/admin-documents.controller.js`
- [x] T019 [US2] Wire share/visibility routes in `Backend/routes/admin.routes.js`
- [x] T020 [US2] Enforce login + audience match in `Backend/controllers/document.controller.js`
- [x] T021 [P] [US2] Build share/visibility panel UI in `frontend/src/features/admin-documents/DocumentSharePanel.tsx`
- [x] T022 [US2] Implement share/visibility API calls and hooks in `frontend/src/entities/document/api.ts` and `frontend/src/entities/document/hooks.ts`
- [x] T023 [US2] Integrate share panel into `frontend/src/features/admin-documents/DocumentList.tsx`

**Checkpoint**: User Stories 1 and 2 are independently functional

---

## Phase 5: User Story 3 - Track versions and preview files (Priority: P3)

**Goal**: Provide version history/restore and in-app previews.

**Independent Test**: Replace a file, view versions, restore a prior version, and preview a file.

### Implementation for User Story 3

- [x] T024 [US3] Implement version list/restore handlers in `Backend/controllers/admin-documents.controller.js` using `Backend/repositories/documentVersion.repository.js`
- [x] T025 [US3] Wire version routes in `Backend/routes/admin.routes.js`
- [x] T026 [US3] Implement version API calls and hooks in `frontend/src/entities/document/api.ts` and `frontend/src/entities/document/hooks.ts`
- [x] T027 [P] [US3] Build version history dialog in `frontend/src/features/admin-documents/DocumentVersionsDialog.tsx`
- [x] T028 [P] [US3] Build preview dialog in `frontend/src/features/admin-documents/DocumentPreviewDialog.tsx`
- [x] T029 [US3] Integrate version + preview actions in `frontend/src/features/admin-documents/DocumentList.tsx`

**Checkpoint**: All user stories are independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Cross-story quality and documentation updates

- [x] T030 [P] Update API contract if needed in `specs/002-admin-doc-enhancements/contracts/admin-documents.openapi.yaml`
- [x] T031 [P] Update quickstart verification notes in `specs/002-admin-doc-enhancements/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - blocks all user stories
- **User Stories (Phase 3+)**: Depend on Foundational phase completion
- **Polish (Phase 6)**: Depends on selected user stories being complete

### User Story Dependencies

- **US1 (P1)**: No dependencies beyond Foundation
- **US2 (P2)**: No dependencies beyond Foundation
- **US3 (P3)**: No dependencies beyond Foundation

### Parallel Opportunities

- Frontend UI component creation tasks marked [P] can run in parallel.
- Backend controllers and frontend components for different stories can run in parallel after Foundation.

---

## Parallel Example: User Story 1

```bash
Task: "Extend filters for folder/date range in frontend/src/features/admin-documents/DocumentFilters.tsx"
Task: "Create folder tree UI in frontend/src/features/admin-documents/FolderTree.tsx"
Task: "Create bulk actions bar in frontend/src/features/admin-documents/BulkActionsBar.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Validate with the independent test for US1

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. User Story 1 → Validate
3. User Story 2 → Validate
4. User Story 3 → Validate
5. Polish updates
