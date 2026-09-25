const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');

// Allowlisted upload extensions (documents + images). Executable/template
// extensions such as pug, js, html, php, sh are intentionally excluded so a
// malicious upload can never be interpreted as code by the email/template
// subsystem or the web server.
const ALLOWED_EXTENSIONS = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'webp',
  'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'csv',
]);

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB

// Return a safe, allowlisted extension (no dot) or null if invalid.
// Strips any path separators, dots, encoded traversal, etc. by keeping only
// [a-z0-9], so values like "../../../emails/confirmation/html.pug" collapse to
// something that fails the allowlist instead of steering the write path.
function sanitizeExtension(raw) {
  if (typeof raw !== 'string') return null;
  const cleaned = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!cleaned || cleaned.length > 5) return null;
  return ALLOWED_EXTENSIONS.has(cleaned) ? cleaned : null;
}

// Resolve a safe, allowlisted extension for an upload, trying in order:
//   1. the client-declared ?type= query param (legacy callers such as newsdoc),
//   2. the uploaded file's own original extension,
//   3. the declared mimetype subtype.
// Returns the first allowlisted match, or null if none are acceptable. This
// preserves existing behaviour (callers that pass ?type= and callers that only
// send a file) while guaranteeing the value can never steer the write path.
function resolveSafeExtension(req, file) {
  const candidates = [
    req && req.query ? req.query.type : undefined,
    file && file.originalname ? file.originalname.split('.').pop() : undefined,
    file && file.mimetype ? file.mimetype.split('/')[1] : undefined,
  ];
  for (const candidate of candidates) {
    const ext = sanitizeExtension(candidate);
    if (ext) return ext;
  }
  return null;
}

// Build a server-generated, traversal-proof filename. path.basename is a final
// guard so the returned value can never contain a directory component.
function buildSafeFilename(fieldname, ext) {
  const safeField = String(fieldname || 'file').replace(/[^a-z0-9]/gi, '').slice(0, 20) || 'file';
  const unique = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
  return path.basename(`${safeField}-${unique}.${ext}`);
}

// Operational 400 error understood by the global error handler.
function badRequest(message) {
  const err = new Error(message);
  err.statusCode = 400;
  err.status = 'fail';
  err.isOperational = true;
  return err;
}

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

// Single-file upload middleware shared by every route that writes into
// uploads/. Filenames are server-generated from an allowlisted extension, and
// multer's own errors (size limit, unexpected field) are answered as client
// errors here instead of surfacing as a generic 500 from the global handler.
function createUploadMiddleware(fieldName, invalidTypeMessage) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });

  const diskStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, UPLOAD_DIR);
    },
    filename: function (req, file, cb) {
      // Resolve an allowlisted extension from the file itself (original name /
      // mimetype) so a crafted mimetype cannot steer the write path.
      const ext = resolveSafeExtension(req, file);
      if (!ext) {
        return cb(badRequest(invalidTypeMessage));
      }
      cb(null, buildSafeFilename(file.fieldname, ext));
    }
  });

  const handler = multer({
    storage: diskStorage,
    limits: { fileSize: MAX_UPLOAD_BYTES },
  }).single(fieldName);

  return (req, res, next) => {
    handler(req, res, (err) => {
      if (!err) return next();
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).send({ message: 'File too large. Maximum size is 10 MB.' });
      }
      if (err instanceof multer.MulterError) {
        return res.status(400).send({ message: 'File upload failed.' });
      }
      return next(err);
    });
  };
}

module.exports = {
  ALLOWED_EXTENSIONS,
  MAX_UPLOAD_BYTES,
  sanitizeExtension,
  resolveSafeExtension,
  buildSafeFilename,
  badRequest,
  createUploadMiddleware,
};
