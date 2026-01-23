# Quickstart: Admin Document Enhancements

## Preconditions

- Admin account available.
- Existing documents in the admin library (upload at least two files).

## Scenario 1: Folder management

1. Create a folder named "Policies" at the root.
2. Move two documents into the folder.
3. Confirm the folder appears in navigation and the documents list inside it.
4. Attempt to delete the folder while it contains documents; confirm deletion is blocked.

## Scenario 2: Bulk actions

1. Select multiple documents in the same folder.
2. Run bulk download and verify a single ZIP file downloads.
3. Run bulk delete and verify only selected documents are removed.

## Scenario 3: Share links and visibility

1. Open a file document and click **Share**.
2. Set visibility to "Students" and click **Save visibility**.
3. Create a share link with default expiration (7 days) and copy the URL.
4. Confirm access requires login and a student account; other audiences are denied.
5. Revoke the share and confirm the link no longer works.

## Scenario 4: Version history and restore

1. Replace a file from the list using **Replace** to create a new version.
2. Open **Versions** and verify the version list includes timestamps and download links.
3. Restore a previous version and confirm the document updates (version increments).

## Scenario 5: Conflict handling

1. Open the same document metadata in two browser windows.
2. Save changes in window A.
3. Attempt to save changes in window B.
4. Confirm a conflict warning is shown and no silent overwrite occurs.

## Scenario 6: Preview behavior

1. Click **Preview** for a PDF or image document from the list.
2. Confirm it previews in-app.
3. Click **Preview** for a non-previewable file and confirm it shows a clear message
   and allows opening/download in a new tab.
