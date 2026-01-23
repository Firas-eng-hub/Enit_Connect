const multer = require("multer");

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

const mimeToExt = {
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "image/png": ".png",
  "image/jpeg": ".jpg",
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const ext = mimeToExt[file.mimetype] || "";
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `admin-doc-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_BYTES },
  fileFilter: (req, file, cb) => {
    if (!mimeToExt[file.mimetype]) {
      const err = new Error("Unsupported file type.");
      err.statusCode = 415;
      err.isOperational = true;
      return cb(err);
    }
    cb(null, true);
  },
});

const handler = upload.single("file");

module.exports = (req, res, next) => {
  handler(req, res, (err) => {
    if (!err) return next();

    // Multer uses a MulterError for file size limits.
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).send({ message: "File too large. Maximum size is 10 MB." });
    }

    const statusCode = err.statusCode || 400;
    return res.status(statusCode).send({ message: err.message || "File upload failed." });
  });
};
