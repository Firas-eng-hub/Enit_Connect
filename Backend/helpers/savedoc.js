const { createUploadMiddleware } = require('./uploadSanitize');

const savedoc = createUploadMiddleware('file', 'Invalid or unsupported file type.');

module.exports = savedoc;
