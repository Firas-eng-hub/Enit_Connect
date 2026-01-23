# Data Model: Admin Document Management

## Entities

### Document

**Description**: Represents a file or folder managed by admins.

**Fields**:
- id (UUID, primary key)
- title (string, required)
- description (string, optional)
- category (string, optional)
- tags (string[], optional)
- type (string, required: "file" or "folder")
- link (string, optional; file URL for type=file)
- extension (string, optional)
- mimeType (string, optional)
- size (string, optional; human-readable)
- sizeBytes (number, optional)
- emplacement (string, required; defaults to "root")
- creatorId (UUID, optional)
- creatorName (string, required)
- creatorType (string, optional; "admin")
- accessLevel (string, required; default "private")
- pinned (boolean, required; default false)
- createdAt (timestamp)
- updatedAt (timestamp)

**Validation rules**:
- title is required for both files and folders.
- file upload is required when type is "file".
- category is optional, single value.
- tags must be trimmed and unique.
- file size must be <= 10 MB.
- allowed file types: pdf, doc, docx, png, jpg, jpeg.
- emplacement defaults to "root" when not provided.

**State transitions**:
- create -> active
- update metadata -> active
- replace file -> active with incremented version
- delete -> removed from list and file storage

### DocumentVersion

**Description**: Optional historical record when a document file is replaced.

**Fields**:
- id (UUID, primary key)
- documentId (UUID, required)
- version (number, required)
- link (string, required)
- extension (string, optional)
- mimeType (string, optional)
- sizeBytes (number, optional)
- createdAt (timestamp)

## Relationships

- Document 1..* DocumentVersion
- Document created by Admin (creatorType = "admin")

## Notes

- Category requires a new nullable column in the documents table; include a migration and update
  Backend/db/schema.sql.
