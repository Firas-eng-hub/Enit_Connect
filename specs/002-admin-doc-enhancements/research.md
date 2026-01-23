# Research: Admin Document Enhancements

## Decision 1: Share link access model

- Decision: Require login and audience match for share links.
- Rationale: Balances usability with security; prevents link leakage from bypassing
  audience rules.
- Alternatives considered: Public token-only links; login-only without audience checks;
  internal-only links.

## Decision 2: Default share link expiration

- Decision: Default expiration is 7 days.
- Rationale: Limits exposure window while staying practical for recipients.
- Alternatives considered: No default expiration; 30-day default.

## Decision 3: Folder deletion behavior

- Decision: Block folder deletion unless empty.
- Rationale: Prevents accidental data loss and avoids implicit cascading deletes.
- Alternatives considered: Cascade delete; delete with forced move prompt.

## Decision 4: Conflict handling for concurrent edits

- Decision: Reject stale updates with a conflict warning.
- Rationale: Prevents silent overwrites and encourages explicit retries.
- Alternatives considered: Last-write-wins; overwrite with confirmation.

## Decision 5: Bulk download packaging

- Decision: Bulk downloads produce a single ZIP file.
- Rationale: Simplest user experience and aligns with common bulk export expectations.
- Alternatives considered: Multiple individual downloads; email link after packaging.

## Decision 6: Data model reuse

- Decision: Reuse existing document tables and fields for folders, shares, versions,
  and access control.
- Rationale: Minimizes schema changes and aligns with existing student document
  functionality.
- Alternatives considered: Introducing new admin-only tables or document domains.
