/**
 * Document file helpers: link -> disk path resolution, fresh names on restore,
 * and owner-only version download links.
 */
const fs = require('fs');
const path = require('path');
const documentFiles = require('../../helpers/document-files');

const { UPLOADS_DIR, LEGACY_VERSIONS_DIR } = documentFiles;

describe('document-files helper', () => {
  const savedEnv = { ...process.env };
  afterEach(() => {
    process.env = { ...savedEnv };
  });

  describe('resolveUploadPath', () => {
    it('maps absolute and relative upload links into uploads/', () => {
      expect(documentFiles.resolveUploadPath('https://api.example/uploads/file-abc.pdf')).toBe(
        path.join(UPLOADS_DIR, 'file-abc.pdf')
      );
      expect(documentFiles.resolveUploadPath('/uploads/file-abc.pdf')).toBe(path.join(UPLOADS_DIR, 'file-abc.pdf'));
    });

    it('maps legacy version links into uploads/versions/', () => {
      expect(documentFiles.resolveUploadPath('https://api.example/uploads/versions/doc-v1.pdf')).toBe(
        path.join(LEGACY_VERSIONS_DIR, 'doc-v1.pdf')
      );
    });

    it('never escapes the uploads directory', () => {
      ['/uploads/../../etc/passwd', 'https://x/uploads/%2e%2e/%2e%2e/app.js', '../app.js'].forEach((link) => {
        const resolved = documentFiles.resolveUploadPath(link);
        if (resolved) {
          expect(resolved.startsWith(UPLOADS_DIR + path.sep)).toBe(true);
        }
      });
    });

    it('returns null for empty or directory-only links', () => {
      expect(documentFiles.resolveUploadPath('')).toBeNull();
      expect(documentFiles.resolveUploadPath(null)).toBeNull();
      expect(documentFiles.resolveUploadPath('https://x/uploads/')).toBeNull();
    });
  });

  describe('copyToNewUpload', () => {
    it('copies into a fresh unguessable file name with the same extension', () => {
      fs.mkdirSync(LEGACY_VERSIONS_DIR, { recursive: true });
      const source = path.join(LEGACY_VERSIONS_DIR, `jest-src-${Date.now()}.pdf`);
      fs.writeFileSync(source, 'version-1');
      const created = [];
      try {
        created.push(documentFiles.copyToNewUpload(source));
        created.push(documentFiles.copyToNewUpload(source));
        expect(created[0]).toMatch(/^file-[0-9a-f-]{36}\.pdf$/);
        expect(fs.readFileSync(path.join(UPLOADS_DIR, created[0]), 'utf8')).toBe('version-1');
        expect(created[1]).not.toBe(created[0]);
      } finally {
        created.forEach((name) => documentFiles.safeUnlinkPath(path.join(UPLOADS_DIR, name)));
        fs.unlinkSync(source);
      }
    });
  });

  describe('version download links', () => {
    it('points at the authenticated API endpoint, not at /uploads', () => {
      process.env.BASE_URL = 'https://api.example/';
      const link = documentFiles.buildVersionDownloadLink('student', 'doc-id', 'ver-id');
      expect(link).toBe('https://api.example/api/student/documents/doc-id/versions/ver-id/file');
    });

    it('builds a safe download name', () => {
      const name = documentFiles.buildVersionDownloadName(
        { title: 'My "CV"/final.pdf' },
        { version: 2 },
        '/x/file-abc.pdf'
      );
      expect(name).toBe('My _CV_final-v2.pdf');
    });
  });
});
