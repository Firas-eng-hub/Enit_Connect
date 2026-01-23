# Quickstart: Admin Document Management

## Prerequisites

- Docker (for Postgres) or a running local Postgres instance
- Node.js >= 18
- Admin credentials for the application

## Local Setup

1. Start the database (optional if already running):

```bash
cd /home/ubuntu/Desktop/ENIT-CONNECT

docker compose up -d db
```

2. Start the backend API:

```bash
cd /home/ubuntu/Desktop/ENIT-CONNECT/Backend

npm run dev
```

3. Start the frontend app:

```bash
cd /home/ubuntu/Desktop/ENIT-CONNECT/frontend

npm run dev
```

## Manual Validation

1. Log in as an admin user.
2. Navigate to `/admin/documents`.
3. Upload a document (<= 10 MB, PDF/DOC/DOCX/PNG/JPG/JPEG) with a title and optional metadata.
4. Confirm the document appears in the list and can be opened.
5. Edit the document metadata and confirm the changes appear immediately.
6. Replace the file and confirm the version is updated and the new file opens.
7. Search by keyword and filter by category; verify results update correctly.
8. Delete the document and confirm it is removed and no longer accessible.
9. Verify file validation:
   - Upload a file > 10 MB and confirm a friendly error message is shown.
   - Upload an unsupported file type and confirm a friendly error message is shown.

## Notes

- Uploads are served from `/uploads` by the backend; ensure BASE_URL is configured correctly.
- If file validation limits change, update the UI helper text and backend upload middleware.
