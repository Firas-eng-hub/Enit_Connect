const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

// Single, absolute upload directory. Never derived from user input.
const UPLOAD_DIR = path.resolve(__dirname, "..", "uploads");

const IMAGE_TYPES = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
};

const DOCUMENT_TYPES = {
  ...IMAGE_TYPES,
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
};

// Magic-byte signatures, keyed by the extension we assign.
const SIGNATURES = {
  ".png": [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  ".jpg": [[0xff, 0xd8, 0xff]],
  ".webp": [[0x52, 0x49, 0x46, 0x46]], // "RIFF" (+ "WEBP" at offset 8, checked below)
  ".pdf": [[0x25, 0x50, 0x44, 0x46]], // "%PDF"
  ".doc": [[0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]], // OLE2
  ".docx": [[0x50, 0x4b, 0x03, 0x04]], // ZIP
};

const startsWith = (buf, sig) => sig.every((byte, i) => buf[i] === byte);

const matchesSignature = (filePath, ext) => {
  const sigs = SIGNATURES[ext];
  if (!sigs) return false;
  const fd = fs.openSync(filePath, "r");
  try {
    const buf = Buffer.alloc(16);
    fs.readSync(fd, buf, 0, 16, 0);
    if (!sigs.some((sig) => startsWith(buf, sig))) return false;
    if (ext === ".webp") return buf.toString("ascii", 8, 12) === "WEBP";
    return true;
  } finally {
    fs.closeSync(fd);
  }
};

const safeUnlink = (filePath) => {
  try {
    fs.unlinkSync(filePath);
  } catch {
    /* ignore */
  }
};

/**
 * Build a hardened single-file upload middleware.
 * - filename = random UUID + extension taken ONLY from the MIME allowlist
 * - fixed destination directory
 * - size limit, MIME allowlist, and magic-byte verification after write
 */
const createUpload = ({ field, types, maxBytes, prefix = "file", label = "File" }) => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
      cb(null, `${prefix}-${crypto.randomUUID()}${types[file.mimetype]}`);
    },
  });

  const handler = multer({
    storage,
    limits: { fileSize: maxBytes, files: 1 },
    fileFilter: (req, file, cb) => {
      if (!Object.prototype.hasOwnProperty.call(types, file.mimetype)) {
        const err = new Error("Unsupported file type.");
        err.statusCode = 415;
        return cb(err);
      }
      return cb(null, true);
    },
  }).single(field);

  return (req, res, next) => {
    handler(req, res, (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          const mb = Math.round(maxBytes / (1024 * 1024));
          return res.status(413).send({ message: `${label} too large. Maximum size is ${mb} MB.` });
        }
        return res.status(err.statusCode || 400).send({ message: err.statusCode ? err.message : "Upload failed." });
      }
      if (req.file) {
        const ext = path.extname(req.file.filename);
        if (!matchesSignature(req.file.path, ext)) {
          safeUnlink(req.file.path);
          req.file = undefined;
          return res.status(415).send({ message: "File content does not match its type." });
        }
      }
      return next();
    });
  };
};

module.exports = {
  createUpload,
  IMAGE_TYPES,
  DOCUMENT_TYPES,
  UPLOAD_DIR,
  matchesSignature,
};
