const { createUploadMiddleware } = require('./uploadSanitize');

const newsdoc = createUploadMiddleware('file', 'Invalid or unsupported file type.');

module.exports = newsdoc;
