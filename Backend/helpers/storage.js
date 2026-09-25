const { createUploadMiddleware } = require('./uploadSanitize');

const storage = createUploadMiddleware('image', 'Invalid or unsupported image type.');

module.exports = storage;
