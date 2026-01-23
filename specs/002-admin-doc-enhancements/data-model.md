# Data Model: Admin Document Enhancements

## Document

Represents a managed file or folder.

**Core fields**
- `id` (UUID)
- `title` (text, required)
- `description` (text, optional)
- `category` (text, optional)
- `tags` (text[], default empty)
- `type` (text, required; values: `file`, `folder`)
- `emplacement` (text, required; folder path, `root` for top-level)
- `link` (text, optional; file download URL)
- `extension` / `mime_type` (text, optional)
- `size_bytes` / `size` (optional)
- `version` (integer, default 1)
- `access_level` (text, default `private`; values: `private`, `students`, `companies`, `internal`)
- `creator_id`, `creator_name`, `creator_type`
- `last_opened_at`, `created_at`, `updated_at`

**Validation rules**
- `title` required and unique within the same folder path (preferred UX constraint).
- `type = folder` implies no file link or size fields.
- `access_level` must match defined audience values.

**Relationships**
- One Document → Many DocumentVersions
- One Document → Many DocumentShares
- One Document → Many DocumentAccess entries
- One Document → Many DocumentAuditLogs

## Folder

Folders are stored as `documents` with `type = 'folder'` and `emplacement` path hierarchy.

**Rules**
- Deletion is blocked unless the folder is empty.
- Moving a folder updates child `emplacement` paths.

## DocumentVersion

Historical snapshots of a document.

**Fields**
- `id`, `document_id`, `version`, `link`, `extension`, `mime_type`, `size_bytes`, `created_at`

**Rules**
- New version created on file replace or restore.
- `documents.version` increments with each new version.

## DocumentShare

Share links for documents.

**Fields**
- `id`, `document_id`, `token_hash`, `expires_at`, `password_hash`, `revoked_at`, `created_by`

**Rules**
- Active if `revoked_at` is null and `expires_at` is null or in the future.
- Access requires authenticated user and matching audience.
- Default expiration is 7 days.

## DocumentAccess

Audience targeting for document access.

**Fields**
- `id`, `document_id`, `user_id`, `user_type`, `access`, `created_at`

**Rules**
- Enforced alongside `access_level` to target groups or individuals.

## DocumentAuditLog

Tracks admin actions for audit visibility.

**Fields**
- `id`, `document_id`, `actor_id`, `actor_type`, `action`, `created_at`

## State Transitions

- Replace file → new DocumentVersion, increment Document.version.
- Restore version → new DocumentVersion (restored content becomes current), increment Document.version.
- Share revoke → DocumentShare.revoked_at set; link becomes inactive.
- Open/preview → Document.last_opened_at updated.
