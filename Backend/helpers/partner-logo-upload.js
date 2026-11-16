// Partner logo upload. SVG is intentionally NOT allowed (it can carry script).
const { createUpload, IMAGE_TYPES } = require("./upload-factory");

module.exports = createUpload({
  field: "logo",
  types: IMAGE_TYPES,
  maxBytes: 3 * 1024 * 1024,
  prefix: "partner-logo",
  label: "Image",
});
