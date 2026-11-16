// Profile picture / company logo upload (images only).
const { createUpload, IMAGE_TYPES } = require("./upload-factory");

module.exports = createUpload({
  field: "image",
  types: IMAGE_TYPES,
  maxBytes: 3 * 1024 * 1024,
  prefix: "image",
  label: "Image",
});
