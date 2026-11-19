// Escape LIKE/ILIKE wildcards so user input matches literally
// (default escape character is backslash).
const escapeLike = (value) => String(value).replace(/[\\%_]/g, (c) => `\\${c}`);

module.exports = { escapeLike };
