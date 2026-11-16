// Admin document upload (PDF / Word / PNG / JPG).
const { createUpload, DOCUMENT_TYPES } = require("./upload-factory");

const { "image/webp": _webp, ...ADMIN_DOCUMENT_TYPES } = DOCUMENT_TYPES;

module.exports = createUpload({
  field: "file",
  types: ADMIN_DOCUMENT_TYPES,
  maxBytes: 10 * 1024 * 1024,
  prefix: "admin-doc",
});
