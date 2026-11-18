// File handling shared by the student and admin document controllers.
//
// Rules that keep private documents private:
// - Every stored file has an unguessable name (`file-<uuid>.<ext>`), and a URL always serves the
//   same bytes: replacing or restoring a document gives it a NEW file and URL, so anyone holding
//   an old link (a revoked/expired share, an old mail attachment) never receives newer content.
// - Old versions are only downloadable through the authenticated version endpoints. Legacy
//   version files in uploads/versions/ (predictable names) are blocked from static serving in app.js.

const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const UPLOADS_DIR = path.resolve(__dirname, "..", "uploads");
const LEGACY_VERSIONS_DIR = path.join(UPLOADS_DIR, "versions");

const normalizeBaseUrl = (value) => String(value || "").replace(/\/+$/, "");

const getFileBaseUrl = () =>
  normalizeBaseUrl(process.env.FILE_BASE_URL || process.env.BASE_URL || process.env.APP_URL || "");

const getApiBaseUrl = () => normalizeBaseUrl(process.env.BASE_URL || process.env.APP_URL || "");

const buildUploadLink = (filename) => `${getFileBaseUrl()}/uploads/${filename}`;

const getLinkPathname = (link) => {
  if (!link) return null;
  try {
    return new URL(String(link), "http://localhost").pathname;
  } catch (err) {
    return null;
  }
};

// Absolute on-disk path of the file a document/version link points to (inside uploads/), or null.
const resolveUploadPath = (link) => {
  const pathname = getLinkPathname(link);
  if (!pathname) return null;
  const name = path.posix.basename(pathname);
  if (!name || name === "." || name === ".." || name === "uploads") return null;
  const dir = /\/uploads\/versions\/[^/]+$/.test(pathname) ? LEGACY_VERSIONS_DIR : UPLOADS_DIR;
  return path.join(dir, name);
};

// Copy a stored file to a fresh unguessable name in uploads/ and return the new filename.
const copyToNewUpload = (sourcePath) => {
  const ext = path.extname(sourcePath).toLowerCase();
  const filename = `file-${crypto.randomUUID()}${ext}`;
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  fs.copyFileSync(sourcePath, path.join(UPLOADS_DIR, filename));
  return filename;
};

const safeUnlinkPath = (filePath) => {
  if (!filePath) return;
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (err) {
    // Best-effort cleanup; never fail the request on filesystem cleanup.
  }
};

const removeVersionFiles = (versions = []) => {
  versions.forEach((version) => safeUnlinkPath(resolveUploadPath(version.link)));
};

// Link returned to owners/admins for downloading an old version (never the raw file path).
const buildVersionDownloadLink = (scope, documentId, versionId) =>
  `${getApiBaseUrl()}/api/${scope}/documents/${documentId}/versions/${versionId}/file`;

const buildVersionDownloadName = (doc, version, filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  let base = String(doc?.title || "document")
    .replace(/[\u0000-\u001f\u007f\\/"]+/g, "_")
    .trim()
    .slice(0, 120);
  if (ext && base.toLowerCase().endsWith(ext)) base = base.slice(0, -ext.length);
  return `${base || "document"}-v${version.version}${ext}`;
};

// Send an old version as an attachment that the browser will not render or cache.
const sendVersionFile = (res, { doc, version }) => {
  const filePath = resolveUploadPath(version.link);
  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(404).send({ message: "Version file missing." });
  }
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Content-Security-Policy", "default-src 'none'; sandbox");
  res.setHeader("Cache-Control", "private, no-store");
  return res.download(filePath, buildVersionDownloadName(doc, version, filePath), (err) => {
    if (err && !res.headersSent) {
      res.status(404).send({ message: "Version file missing." });
    }
  });
};

module.exports = {
  UPLOADS_DIR,
  LEGACY_VERSIONS_DIR,
  getFileBaseUrl,
  buildUploadLink,
  resolveUploadPath,
  copyToNewUpload,
  safeUnlinkPath,
  removeVersionFiles,
  buildVersionDownloadLink,
  buildVersionDownloadName,
  sendVersionFile,
};
