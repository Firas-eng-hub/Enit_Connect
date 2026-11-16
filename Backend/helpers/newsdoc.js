// News attachment upload (PDF / Word / images). Admin-only route.
const { createUpload, DOCUMENT_TYPES } = require("./upload-factory");

module.exports = createUpload({
  field: "file",
  types: DOCUMENT_TYPES,
  maxBytes: 10 * 1024 * 1024,
  prefix: "news",
});
