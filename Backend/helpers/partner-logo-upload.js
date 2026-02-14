const multer = require("multer");

const MAX_BYTES = 3 * 1024 * 1024; // 3 MB

const mimeToExt = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/svg+xml": ".svg",
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const ext = mimeToExt[file.mimetype] || "";
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `partner-logo-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_BYTES },
  fileFilter: (req, file, cb) => {
    if (!mimeToExt[file.mimetype]) {
      const err = new Error("Unsupported image type. Use PNG, JPG, WEBP, or SVG.");
      err.statusCode = 415;
      err.isOperational = true;
      return cb(err);
    }
    return cb(null, true);
  },
});

const handler = upload.single("logo");

module.exports = (req, res, next) => {
  handler(req, res, (err) => {
    if (!err) return next();

    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).send({ message: "Image too large. Maximum size is 3 MB." });
    }

    return res.status(err.statusCode || 400).send({ message: err.message || "Upload failed." });
  });
};
