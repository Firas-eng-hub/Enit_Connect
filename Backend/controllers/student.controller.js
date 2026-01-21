const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { generateVerificationCode, getVerificationExpiry, getVerificationLimits } = require("../utils/verification");
const stringSimilarity = require("string-similarity");
const nodemailer = require("../config/nodemailer.config");
const location = require("../config/geocoder.config");
const config = require("../config/auth.config");
const fs = require("fs");
const path = require("path");
const archiver = require("archiver");
const sharp = require("sharp");
const {
  studentRepository,
  documentRepository,
  offerRepository,
  postRepository,
  notificationRepository,
  adminRepository,
  companyRepository,
  refreshTokenRepository,
  documentAccessRepository,
  documentShareRepository,
  documentRequestRepository,
  documentVersionRepository,
  documentAuditRepository,
} = require("../repositories");
const { isUuid } = require("../utils/validation");
const crypto = require("crypto");

const mapStudentRow = (row) => ({
  firstname: row.firstname,
  lastname: row.lastname,
  email: row.email,
  status: row.status,
  country: row.country,
  city: row.city,
  address: row.address,
  phone: row.phone,
  type: row.type,
  workAt: row.work_at,
  class: row.class,
  promotion: row.promotion,
  linkedin: row.linkedin,
  picture: row.picture,
  aboutme: row.aboutme,
  latitude: row.latitude,
  longitude: row.longitude,
  id: row.id,
  _id: row.id,
});

exports.getPosts = async (req, res) => {
  try {
    const posts = await postRepository.listAll();
    const response = posts.map(postRepository.mapPostRow);
    res.status(200).send(response);
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

exports.addPost = async (req, res) => {
  try {
    await postRepository.createPost({
      title: req.body.title,
      topic: req.body.topic,
      date: req.body.date,
      userName: req.body.userName,
      body: req.body.body,
      description: req.body.description,
    });
    res.status(201).send({ message: "Post was added successfully!" });
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

exports.apply = async (req, res) => {
  try {
    if (!isUuid(req.id)) {
      return res.status(401).send({ message: "Unauthorized!" });
    }
    if (!isUuid(req.params.id)) {
      return res.status(400).send({ message: "Invalid offer id." });
    }

    const offer = await offerRepository.findById(req.params.id);
    if (!offer) {
      return res.status(404).send({ message: "Offer not found!" });
    }

    const existingCandidacies = await offerRepository.listCandidacies(offer.id);
    const studentDetails = await studentRepository.findById(req.id);
    const studentName = studentDetails
      ? `${studentDetails.firstname} ${studentDetails.lastname}`
      : "A student";

    await offerRepository.createCandidacy({
      offerId: offer.id,
      sourceIndex: existingCandidacies.length,
      studentId: req.id,
      body: req.body.body,
      documents: req.body.documents || [],
      status: "pending",
      createdAt: new Date(),
      extra: studentDetails
        ? {
            studentSnapshot: {
              firstname: studentDetails.firstname,
              lastname: studentDetails.lastname,
              email: studentDetails.email,
              class: studentDetails.class,
              promotion: studentDetails.promotion,
              picture: studentDetails.picture,
              type: studentDetails.type,
            },
          }
        : {},
    });

    const notifications = [
      {
        recipientType: "student",
        recipientId: req.id,
        title: "Application Submitted",
        message: `Your application for "${offer.title}" has been sent.`,
        type: "success",
      },
    ];

    if (offer.company_id) {
      notifications.push({
        recipientType: "company",
        recipientId: offer.company_id,
        title: "New Application",
        message: `${studentName} applied for "${offer.title}".`,
        type: "info",
      });
    }

    try {
      await notificationRepository.createMany(notifications);
    } catch (notifyError) {
      console.warn("Apply notifications failed:", notifyError.message || notifyError);
    }

    res.status(200).send({ message: "Application submitted successfully!" });
  } catch (err) {
    console.error("Apply error:", err);
    res.status(500).send({ message: err.message || "Error applying to offer" });
  }
};

const DOCUMENT_ALLOWED_MIME = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
];

const DOCUMENT_ALLOWED_EXTENSIONS = ["pdf", "doc", "docx", "png", "jpg", "jpeg"];
const DOCUMENT_PAGE_SIZE_DEFAULT = 20;
const DOCUMENT_PAGE_SIZE_MAX = 50;

const MIME_EXTENSION_MAP = {
  "application/pdf": ["pdf"],
  "application/msword": ["doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ["docx"],
  "image/png": ["png"],
  "image/jpeg": ["jpg", "jpeg"],
};

const parseTags = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((tag) => String(tag).trim()).filter(Boolean);
  }
  const raw = String(value).trim();
  if (!raw) return [];
  if (raw.startsWith("[")) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((tag) => String(tag).trim()).filter(Boolean);
      }
    } catch (err) {
      // fall through to comma-separated
    }
  }
  return raw
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
};

const getFilenameFromLink = (link) => {
  if (!link) return null;
  try {
    if (link.startsWith("http")) {
      return path.basename(new URL(link).pathname);
    }
    return path.basename(link);
  } catch (err) {
    return path.basename(link);
  }
};

const buildShareToken = () => crypto.randomBytes(24).toString("hex");

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const normalizeRecipients = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch (err) {
      // ignore
    }
  }
  return [];
};

const normalizeBaseUrl = (value) => String(value || "").replace(/\/+$/, "");

const getFileBaseUrl = () =>
  normalizeBaseUrl(process.env.FILE_BASE_URL || process.env.BASE_URL || process.env.APP_URL || "");

const getShareUrl = (token) => {
  const baseUrl = normalizeBaseUrl(process.env.BASE_URL || process.env.APP_URL || "");
  return `${baseUrl}/api/documents/share/${token}`;
};

const getUploadsDir = () => path.join(__dirname, "..", "uploads");
const getUploadsSubdir = (name) => path.join(getUploadsDir(), name);

const ensureDir = (target) => {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }
};

const isImageMime = (mimeType) => mimeType && mimeType.startsWith("image/");

const createThumbnail = async (filename) => {
  const sourcePath = path.join(getUploadsDir(), filename);
  const thumbnailsDir = getUploadsSubdir("thumbnails");
  ensureDir(thumbnailsDir);

  const thumbName = `${path.parse(filename).name}-thumb.jpg`;
  const thumbPath = path.join(thumbnailsDir, thumbName);
  await sharp(sourcePath).resize(320, 320, { fit: "inside" }).jpeg({ quality: 72 }).toFile(thumbPath);
  const baseUrl = getFileBaseUrl();
  return `${baseUrl}/uploads/thumbnails/${thumbName}`;
};

const getInitialScanState = () => {
  if (process.env.DOC_AV_SCAN_URL) {
    return { scanStatus: "pending", quarantined: true };
  }
  return { scanStatus: "skipped", quarantined: false };
};

const enqueueDocumentScan = async ({ documentId, filePath, mimeType, sizeBytes }) => {
  const scanUrl = process.env.DOC_AV_SCAN_URL;
  if (!scanUrl) return;

  process.nextTick(async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(scanUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId,
          path: filePath,
          mimeType,
          sizeBytes,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      let scanStatus = response.ok ? "clean" : "failed";
      let scanError = response.ok ? null : `Scanner returned ${response.status}`;
      if (response.ok) {
        const payload = await response.json().catch(() => ({}));
        if (payload && typeof payload.status === "string") {
          scanStatus = payload.status;
        }
        if (payload && payload.error) {
          scanError = String(payload.error);
        }
      }

      const quarantined = scanStatus !== "clean";
      await documentRepository.updateScanStatus(documentId, {
        scanStatus,
        scanError,
        scanCheckedAt: new Date(),
        quarantined,
      });
    } catch (err) {
      clearTimeout(timeout);
      await documentRepository.updateScanStatus(documentId, {
        scanStatus: "failed",
        scanError: err.message || "Scan failed",
        scanCheckedAt: new Date(),
        quarantined: true,
      });
    }
  });
};

const getVersionedPath = (documentId, version, extension) => {
  const ext = extension ? `.${extension}` : "";
  return path.join(getUploadsDir(), "versions", `${documentId}-v${version}${ext}`);
};

exports.listDocuments = async (req, res) => {
  try {
    if (!isUuid(req.id)) {
      return res.status(401).send({ message: "Unauthorized!" });
    }

    const tags = parseTags(req.query.tags);
    const minSize = req.query.minSize ? Number(req.query.minSize) : null;
    const maxSize = req.query.maxSize ? Number(req.query.maxSize) : null;
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(
      Math.max(1, Number(req.query.pageSize) || DOCUMENT_PAGE_SIZE_DEFAULT),
      DOCUMENT_PAGE_SIZE_MAX
    );
    const { rows, total } = await documentRepository.listDocuments({
      creatorId: req.id,
      creatorType: "student",
      emplacement: req.query.emplacement || "root",
      query: req.query.q || "",
      type: req.query.type || "",
      fromDate: req.query.from || null,
      toDate: req.query.to || null,
      minSize: Number.isFinite(minSize) ? minSize : null,
      maxSize: Number.isFinite(maxSize) ? maxSize : null,
      tags,
      page,
      pageSize,
    });

    res.status(200).send({
      items: rows.map(documentRepository.mapDocumentRow),
      total,
      page,
      pageSize,
    });
  } catch (err) {
    console.error("Failed to list documents:", err);
    res.status(500).send({ message: "Failed to fetch documents." });
  }
};

exports.createDocumentFolder = async (req, res) => {
  try {
    if (!isUuid(req.id)) {
      return res.status(401).send({ message: "Unauthorized!" });
    }

    const title = (req.body.title || "").trim();
    if (!title) {
      return res.status(400).send({ message: "Folder name is required." });
    }

    const student = await studentRepository.findById(req.id);
    const creatorName = student ? `${student.firstname} ${student.lastname}` : "Student";
    const emplacement = req.body.emplacement || "root";

    const doc = await documentRepository.createDocument({
      creatorId: req.id,
      creatorName,
      creatorType: "student",
      date: new Date(),
      title,
      description: req.body.description || null,
      tags: parseTags(req.body.tags),
      type: "folder",
      link: "",
      extension: "",
      mimeType: null,
      emplacement,
      size: "",
      sizeBytes: 0,
      createdAt: new Date(),
    });

    res.status(201).send(documentRepository.mapDocumentRow(doc));
  } catch (err) {
    console.error("Create folder failed:", err);
    res.status(500).send({ message: "Failed to create folder." });
  }
};

exports.shareDocument = async (req, res) => {
  try {
    if (!isUuid(req.id) || !isUuid(req.params.id)) {
      return res.status(400).send({ message: "Invalid document id." });
    }

    const [doc] = await documentRepository.listByIds([req.params.id]);
    if (!doc || doc.creator_id !== req.id) {
      return res.status(404).send({ message: "Document not found." });
    }
    if (doc.quarantined || doc.scan_status === "infected") {
      return res.status(423).send({ message: "Document is quarantined. Try again later." });
    }

    const accessLevel = req.body.visibility || "private";
    const recipients = normalizeRecipients(req.body.recipients);
    const expiresAt = req.body.expiresAt ? new Date(req.body.expiresAt) : null;
    const password = req.body.password ? String(req.body.password) : null;
    const createLink = req.body.createLink !== false;

    if (accessLevel === "shared" && recipients.length) {
      const entries = recipients
        .filter((entry) => entry && isUuid(entry.id))
        .map((entry) => ({
          documentId: doc.id,
          userId: entry.id,
          userType: entry.type || "student",
          access: "view",
        }));
      await documentAccessRepository.createAccessEntries(entries);
    }

    await documentRepository.updateDocumentMeta(doc.id, { accessLevel });

    let sharePayload = null;
    if (accessLevel === "public" || (accessLevel === "shared" && createLink)) {
      const token = buildShareToken();
      const tokenHash = hashToken(token);
      let passwordHash = null;
      if (password) {
        passwordHash = await bcrypt.hash(password, 10);
      }

      const share = await documentShareRepository.createShare({
        documentId: doc.id,
        tokenHash,
        expiresAt,
        passwordHash,
        access: "view",
        createdBy: req.id,
        createdByType: "student",
      });

      sharePayload = {
        id: share.id,
        shareUrl: getShareUrl(token),
        expiresAt: share.expires_at,
        requiresPassword: Boolean(passwordHash),
      };
    }

    res.status(200).send({
      document: documentRepository.mapDocumentRow(doc),
      share: sharePayload,
    });

    await documentAuditRepository.createLog({
      documentId: doc.id,
      actorId: req.id,
      actorType: "student",
      action: "share",
      metadata: {
        visibility: accessLevel,
        recipients: recipients.length,
        expiresAt,
      },
    });
  } catch (err) {
    console.error("Share document failed:", err);
    res.status(500).send({ message: "Failed to share document." });
  }
};

exports.listDocumentShares = async (req, res) => {
  try {
    if (!isUuid(req.id) || !isUuid(req.params.id)) {
      return res.status(400).send({ message: "Invalid document id." });
    }

    const [doc] = await documentRepository.listByIds([req.params.id]);
    if (!doc || doc.creator_id !== req.id) {
      return res.status(404).send({ message: "Document not found." });
    }

    const shares = await documentShareRepository.listByDocumentId(doc.id);
    res.status(200).send(
      shares.map((share) => ({
        id: share.id,
        expiresAt: share.expires_at,
        revokedAt: share.revoked_at,
        requiresPassword: Boolean(share.password_hash),
        createdAt: share.created_at,
      }))
    );
  } catch (err) {
    console.error("List document shares failed:", err);
    res.status(500).send({ message: "Failed to list shares." });
  }
};

exports.revokeDocumentShare = async (req, res) => {
  try {
    if (!isUuid(req.id) || !isUuid(req.params.id)) {
      return res.status(400).send({ message: "Invalid share id." });
    }

    const share = await documentShareRepository.revokeShare(req.params.id);
    if (!share) {
      return res.status(404).send({ message: "Share not found." });
    }

    res.status(200).send({ message: "Share revoked." });
  } catch (err) {
    console.error("Revoke share failed:", err);
    res.status(500).send({ message: "Failed to revoke share." });
  }
};

exports.listSharedDocuments = async (req, res) => {
  try {
    if (!isUuid(req.id)) {
      return res.status(401).send({ message: "Unauthorized!" });
    }
    const docs = await documentAccessRepository.listSharedDocumentsByUser({
      userId: req.id,
      userType: "student",
    });
    res.status(200).send(docs.map(documentRepository.mapDocumentRow));
  } catch (err) {
    console.error("List shared documents failed:", err);
    res.status(500).send({ message: "Failed to fetch shared documents." });
  }
};

exports.listDocumentRequests = async (req, res) => {
  try {
    if (!isUuid(req.id)) {
      return res.status(401).send({ message: "Unauthorized!" });
    }
    const requests = await documentRequestRepository.listByTarget({
      targetId: req.id,
      targetType: "student",
    });
    res.status(200).send(requests);
  } catch (err) {
    console.error("List document requests failed:", err);
    res.status(500).send({ message: "Failed to fetch requests." });
  }
};

exports.updateDocumentRequestStatus = async (req, res) => {
  try {
    if (!isUuid(req.id) || !isUuid(req.params.id)) {
      return res.status(400).send({ message: "Invalid request id." });
    }

    const status = req.body.status || "fulfilled";
    const request = await documentRequestRepository.updateStatus(req.params.id, status);
    if (!request) {
      return res.status(404).send({ message: "Request not found." });
    }

    res.status(200).send(request);
  } catch (err) {
    console.error("Update request status failed:", err);
    res.status(500).send({ message: "Failed to update request." });
  }
};

exports.uploadDocument = async (req, res) => {
  try {
    if (!isUuid(req.id)) {
      return res.status(401).send({ message: "Unauthorized!" });
    }

    if (!req.file) {
      return res.status(400).send({ message: "No file uploaded." });
    }

    if (req.file.mimetype && !DOCUMENT_ALLOWED_MIME.includes(req.file.mimetype)) {
      return res.status(415).send({ message: "Unsupported file type." });
    }

    const extension = req.file.originalname.split(".").pop()?.toLowerCase() || "";
    if (extension && !DOCUMENT_ALLOWED_EXTENSIONS.includes(extension)) {
      return res.status(415).send({ message: "Unsupported file extension." });
    }
    if (req.file.mimetype && MIME_EXTENSION_MAP[req.file.mimetype]) {
      const allowed = MIME_EXTENSION_MAP[req.file.mimetype];
      if (extension && !allowed.includes(extension)) {
        return res.status(415).send({ message: "File extension does not match MIME type." });
      }
    }
    if (req.file.mimetype && MIME_EXTENSION_MAP[req.file.mimetype]) {
      const allowed = MIME_EXTENSION_MAP[req.file.mimetype];
      if (extension && !allowed.includes(extension)) {
        return res.status(415).send({ message: "File extension does not match MIME type." });
      }
    }

    const student = await studentRepository.findById(req.id);
    const creatorName = student ? `${student.firstname} ${student.lastname}` : "Student";
    const parentEmplacement = req.body.emplacement || "root";
    const emplacement = parentEmplacement;
    const tags = parseTags(req.body.tags);

    const baseUrl = getFileBaseUrl();
    const link = `${baseUrl}/uploads/${req.file.filename}`;
    let thumbnailUrl = null;
    if (isImageMime(req.file.mimetype)) {
      try {
        thumbnailUrl = await createThumbnail(req.file.filename);
      } catch (thumbErr) {
        console.warn("Thumbnail creation failed:", thumbErr.message || thumbErr);
      }
    }
    const scanState = getInitialScanState();
    const doc = await documentRepository.createDocument({
      creatorId: req.id,
      creatorName,
      creatorType: "student",
      date: new Date(),
      title: req.body.title || req.file.originalname,
      description: req.body.description || null,
      tags,
      type: "file",
      accessLevel: req.body.accessLevel || "private",
      link,
      thumbnailUrl,
      extension,
      mimeType: req.file.mimetype || null,
      emplacement,
      size: req.file.size ? String(req.file.size) : null,
      sizeBytes: req.file.size || null,
      createdAt: new Date(),
      scanStatus: scanState.scanStatus,
      quarantined: scanState.quarantined,
    });

    await documentAuditRepository.createLog({
      documentId: doc.id,
      actorId: req.id,
      actorType: "student",
      action: "upload",
      metadata: { filename: req.file.filename },
    });

    if (scanState.scanStatus === "pending") {
      const filePath = path.join(getUploadsDir(), req.file.filename);
      await enqueueDocumentScan({
        documentId: doc.id,
        filePath,
        mimeType: req.file.mimetype || null,
        sizeBytes: req.file.size || null,
      });
    }

    res.status(201).send(documentRepository.mapDocumentRow(doc));
  } catch (err) {
    console.error("Upload document failed:", err);
    res.status(500).send({ message: "Failed to upload document." });
  }
};

exports.updateDocumentMeta = async (req, res) => {
  try {
    if (!isUuid(req.id) || !isUuid(req.params.id)) {
      return res.status(400).send({ message: "Invalid document id." });
    }

    const [existing] = await documentRepository.listByIds([req.params.id]);
    if (!existing || existing.creator_id !== req.id) {
      return res.status(404).send({ message: "Document not found." });
    }

    const tags = parseTags(req.body.tags);
    const doc = await documentRepository.updateDocumentMeta(req.params.id, {
      title: req.body.title,
      description: req.body.description,
      tags,
      emplacement: req.body.emplacement,
      accessLevel: req.body.accessLevel,
      pinned: typeof req.body.pinned === "boolean" ? req.body.pinned : undefined,
    });

    if (!doc) {
      return res.status(404).send({ message: "Document not found." });
    }

    res.status(200).send(documentRepository.mapDocumentRow(doc));
  } catch (err) {
    console.error("Update document failed:", err);
    res.status(500).send({ message: "Failed to update document." });
  }
};

exports.updateDocumentPin = async (req, res) => {
  try {
    if (!isUuid(req.id) || !isUuid(req.params.id)) {
      return res.status(400).send({ message: "Invalid document id." });
    }

    const [doc] = await documentRepository.listByIds([req.params.id]);
    if (!doc || doc.creator_id !== req.id) {
      return res.status(404).send({ message: "Document not found." });
    }

    const updated = await documentRepository.updatePinned(
      doc.id,
      Boolean(req.body.pinned)
    );

    res.status(200).send(documentRepository.mapDocumentRow(updated));
  } catch (err) {
    console.error("Update pin failed:", err);
    res.status(500).send({ message: "Failed to update pin." });
  }
};

exports.markDocumentOpened = async (req, res) => {
  try {
    if (!isUuid(req.id) || !isUuid(req.params.id)) {
      return res.status(400).send({ message: "Invalid document id." });
    }

    const [doc] = await documentRepository.listByIds([req.params.id]);
    if (!doc || doc.creator_id !== req.id) {
      return res.status(404).send({ message: "Document not found." });
    }

    const updated = await documentRepository.markOpened(doc.id);
    await documentAuditRepository.createLog({
      documentId: doc.id,
      actorId: req.id,
      actorType: "student",
      action: "open",
    });
    res.status(200).send(documentRepository.mapDocumentRow(updated));
  } catch (err) {
    console.error("Mark opened failed:", err);
    res.status(500).send({ message: "Failed to update document." });
  }
};

exports.deleteDocumentById = async (req, res) => {
  try {
    if (!isUuid(req.id) || !isUuid(req.params.id)) {
      return res.status(400).send({ message: "Invalid document id." });
    }

    const docs = await documentRepository.listByIds([req.params.id]);
    const doc = docs[0];
    if (!doc || doc.creator_id !== req.id) {
      return res.status(404).send({ message: "Document not found." });
    }

    if (doc.type === "file" && doc.link) {
      try {
        const filename = getFilenameFromLink(doc.link);
        if (filename) {
          fs.unlinkSync(path.join(__dirname, "..", "uploads", filename));
        }
      } catch (err) {
        console.error(err);
      }
    }
    if (doc.thumbnail_url) {
      try {
        const thumbName = getFilenameFromLink(doc.thumbnail_url);
        if (thumbName) {
          fs.unlinkSync(path.join(__dirname, "..", "uploads", "thumbnails", thumbName));
        }
      } catch (err) {
        console.error(err);
      }
    }

    await documentRepository.deleteById(req.params.id);
    await documentAuditRepository.createLog({
      documentId: doc.id,
      actorId: req.id,
      actorType: "student",
      action: "delete",
      metadata: { title: doc.title },
    });
    res.status(200).send({ message: "Document deleted." });
  } catch (err) {
    console.error("Delete document failed:", err);
    res.status(500).send({ message: "Failed to delete document." });
  }
};

exports.batchDeleteDocuments = async (req, res) => {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
    const validIds = ids.filter((id) => isUuid(id));
    if (!validIds.length) {
      return res.status(400).send({ message: "No documents selected." });
    }

    const docs = await documentRepository.listByIds(validIds);
    const ownedDocs = docs.filter((doc) => doc.creator_id === req.id);

    for (const doc of ownedDocs) {
      if (doc.type === "file" && doc.link) {
        try {
          const filename = getFilenameFromLink(doc.link);
          if (filename) {
            fs.unlinkSync(path.join(__dirname, "..", "uploads", filename));
          }
        } catch (err) {
          console.error(err);
        }
      }
      if (doc.thumbnail_url) {
        try {
          const thumbName = getFilenameFromLink(doc.thumbnail_url);
          if (thumbName) {
            fs.unlinkSync(path.join(__dirname, "..", "uploads", "thumbnails", thumbName));
          }
        } catch (err) {
          console.error(err);
        }
      }
      // eslint-disable-next-line no-await-in-loop
      await documentRepository.deleteById(doc.id);
      // eslint-disable-next-line no-await-in-loop
      await documentAuditRepository.createLog({
        documentId: doc.id,
        actorId: req.id,
        actorType: "student",
        action: "delete",
        metadata: { title: doc.title },
      });
    }

    res.status(200).send({ message: "Documents deleted." });
  } catch (err) {
    console.error("Batch delete failed:", err);
    res.status(500).send({ message: "Failed to delete documents." });
  }
};

exports.batchDownloadDocuments = async (req, res) => {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
    const validIds = ids.filter((id) => isUuid(id));
    if (!validIds.length) {
      return res.status(400).send({ message: "No documents selected." });
    }

    const docs = await documentRepository.listByIds(validIds);
    const ownedDocs = docs.filter((doc) => doc.creator_id === req.id && doc.type === "file" && doc.link);
    const downloadableDocs = ownedDocs.filter((doc) => !doc.quarantined);
    if (!downloadableDocs.length) {
      return res.status(423).send({ message: "Documents are quarantined. Try again later." });
    }

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", "attachment; filename=documents.zip");

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.on("error", (err) => {
      console.error("Archive error:", err);
      res.status(500).send({ message: "Failed to create archive." });
    });

    archive.pipe(res);

    downloadableDocs.forEach((doc) => {
      try {
        const filename = getFilenameFromLink(doc.link);
        if (!filename) return;
        const filePath = path.join(__dirname, "..", "uploads", filename);
        archive.file(filePath, { name: doc.title || filename });
      } catch (err) {
        console.error("Add file to archive failed:", err);
      }
    });

    archive.finalize();

    await documentAuditRepository.createLog({
      actorId: req.id,
      actorType: "student",
      action: "batch_download",
      metadata: { count: downloadableDocs.length },
    });
  } catch (err) {
    console.error("Batch download failed:", err);
    res.status(500).send({ message: "Failed to download documents." });
  }
};

exports.replaceDocumentFile = async (req, res) => {
  try {
    if (!isUuid(req.id) || !isUuid(req.params.id)) {
      return res.status(400).send({ message: "Invalid document id." });
    }

    if (!req.file) {
      return res.status(400).send({ message: "No file uploaded." });
    }

    const [doc] = await documentRepository.listByIds([req.params.id]);
    if (!doc || doc.creator_id !== req.id) {
      return res.status(404).send({ message: "Document not found." });
    }

    if (doc.type !== "file" || !doc.link) {
      return res.status(400).send({ message: "Only files can be replaced." });
    }

    if (req.file.mimetype && !DOCUMENT_ALLOWED_MIME.includes(req.file.mimetype)) {
      return res.status(415).send({ message: "Unsupported file type." });
    }

    const extension = req.file.originalname.split(".").pop()?.toLowerCase() || "";
    if (extension && !DOCUMENT_ALLOWED_EXTENSIONS.includes(extension)) {
      return res.status(415).send({ message: "Unsupported file extension." });
    }

    const currentFilename = getFilenameFromLink(doc.link);
    const currentPath = currentFilename ? path.join(getUploadsDir(), currentFilename) : null;
    const versionsDir = path.join(getUploadsDir(), "versions");
    fs.mkdirSync(versionsDir, { recursive: true });

    if (currentPath && fs.existsSync(currentPath)) {
      const previousVersion = doc.version || 1;
      const versionPath = getVersionedPath(doc.id, previousVersion, doc.extension || extension);
      fs.copyFileSync(currentPath, versionPath);
      const baseUrl = getFileBaseUrl();
      await documentVersionRepository.createVersion({
        documentId: doc.id,
        version: previousVersion,
        link: `${baseUrl}/uploads/versions/${path.basename(versionPath)}`,
        extension: doc.extension || extension,
        mimeType: doc.mime_type || req.file.mimetype,
        size: doc.size || null,
        sizeBytes: doc.size_bytes || null,
      });
    }

    if (currentPath) {
      fs.renameSync(req.file.path, currentPath);
    }

    let thumbnailUrl = doc.thumbnail_url || null;
    if (isImageMime(req.file.mimetype)) {
      try {
        const filename = path.basename(currentPath || req.file.filename);
        thumbnailUrl = await createThumbnail(filename);
      } catch (thumbErr) {
        console.warn("Thumbnail creation failed:", thumbErr.message || thumbErr);
      }
    }

    const scanState = getInitialScanState();
    const updated = await documentRepository.updateDocumentFile(doc.id, {
      link: doc.link,
      extension,
      mimeType: req.file.mimetype || null,
      size: req.file.size ? String(req.file.size) : null,
      sizeBytes: req.file.size || null,
      version: (doc.version || 1) + 1,
      thumbnailUrl,
      scanStatus: scanState.scanStatus,
      quarantined: scanState.quarantined,
    });

    await documentAuditRepository.createLog({
      documentId: doc.id,
      actorId: req.id,
      actorType: "student",
      action: "replace",
      metadata: { previousVersion: doc.version || 1 },
    });

    if (scanState.scanStatus === "pending") {
      const filePath = currentPath || path.join(getUploadsDir(), req.file.filename);
      await enqueueDocumentScan({
        documentId: doc.id,
        filePath,
        mimeType: req.file.mimetype || null,
        sizeBytes: req.file.size || null,
      });
    }

    res.status(200).send(documentRepository.mapDocumentRow(updated));
  } catch (err) {
    console.error("Replace document failed:", err);
    res.status(500).send({ message: "Failed to replace document." });
  }
};

exports.listDocumentVersions = async (req, res) => {
  try {
    if (!isUuid(req.id) || !isUuid(req.params.id)) {
      return res.status(400).send({ message: "Invalid document id." });
    }

    const [doc] = await documentRepository.listByIds([req.params.id]);
    if (!doc || doc.creator_id !== req.id) {
      return res.status(404).send({ message: "Document not found." });
    }

    const versions = await documentVersionRepository.listByDocumentId(doc.id);
    res.status(200).send(
      versions.map((version) => ({
        id: version.id,
        version: version.version,
        link: version.link,
        extension: version.extension,
        sizeBytes: version.size_bytes,
        createdAt: version.created_at,
      }))
    );
  } catch (err) {
    console.error("List versions failed:", err);
    res.status(500).send({ message: "Failed to load versions." });
  }
};

exports.restoreDocumentVersion = async (req, res) => {
  try {
    if (!isUuid(req.id) || !isUuid(req.params.id) || !isUuid(req.params.versionId)) {
      return res.status(400).send({ message: "Invalid request." });
    }

    const [doc] = await documentRepository.listByIds([req.params.id]);
    if (!doc || doc.creator_id !== req.id) {
      return res.status(404).send({ message: "Document not found." });
    }

    const version = await documentVersionRepository.findById(req.params.versionId);
    if (!version || version.document_id !== doc.id) {
      return res.status(404).send({ message: "Version not found." });
    }

    const currentFilename = getFilenameFromLink(doc.link);
    const currentPath = currentFilename ? path.join(getUploadsDir(), currentFilename) : null;
    const versionFilename = getFilenameFromLink(version.link);
    const versionPath = versionFilename ? path.join(getUploadsDir(), "versions", versionFilename) : null;

    if (!currentPath || !versionPath || !fs.existsSync(versionPath)) {
      return res.status(404).send({ message: "Version file missing." });
    }

    const currentVersion = doc.version || 1;
    const versionsDir = path.join(getUploadsDir(), "versions");
    fs.mkdirSync(versionsDir, { recursive: true });
    const currentBackupPath = getVersionedPath(doc.id, currentVersion, doc.extension || version.extension);
    if (fs.existsSync(currentPath)) {
      const baseUrl = getFileBaseUrl();
      fs.copyFileSync(currentPath, currentBackupPath);
      await documentVersionRepository.createVersion({
        documentId: doc.id,
        version: currentVersion,
        link: `${baseUrl}/uploads/versions/${path.basename(currentBackupPath)}`,
        extension: doc.extension || null,
        mimeType: doc.mime_type || null,
        size: doc.size || null,
        sizeBytes: doc.size_bytes || null,
      });
    }

    fs.copyFileSync(versionPath, currentPath);

    const updated = await documentRepository.updateDocumentFile(doc.id, {
      link: doc.link,
      extension: version.extension || doc.extension,
      mimeType: version.mime_type || doc.mime_type,
      size: version.size || doc.size,
      sizeBytes: version.size_bytes || doc.size_bytes,
      version: currentVersion + 1,
    });

    await documentAuditRepository.createLog({
      documentId: doc.id,
      actorId: req.id,
      actorType: "student",
      action: "restore_version",
      metadata: { versionId: version.id, restoredVersion: version.version },
    });

    res.status(200).send(documentRepository.mapDocumentRow(updated));
  } catch (err) {
    console.error("Restore version failed:", err);
    res.status(500).send({ message: "Failed to restore version." });
  }
};

exports.searchDocument = async (req, res) => {
  try {
    const docs = await documentRepository.searchByTitle(req.body.title || "");
    res.status(200).send(docs.map(documentRepository.mapDocumentRow));
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

exports.deleteDocument = async (req, res) => {
  if (req.body.type === "file") {
    try {
      fs.unlinkSync(`uploads/${req.body.link.split("/").pop()}`);
    } catch (err) {
      console.error(err);
    }
  }

  try {
    await documentRepository.deleteByTitleAndEmplacement(req.body.title, req.body.emplacement);
    res.status(200).send({ message: `${req.body.type} deleted` });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: err.message || err });
  }
};

exports.createFile = async (req, res) => {
  let filePath = `${process.env.BASE_URL}/uploads/`;
  if (req.file && req.file.filename) {
    filePath += req.file.filename;
  }

  try {
    const creatorId = isUuid(req.query.idcreator) ? req.query.idcreator : null;
    await documentRepository.createDocument({
      creatorId,
      creatorName: req.query.namecreator,
      date: req.query.date,
      title: req.query.title,
      type: "file",
      link: filePath,
      extension: req.query.type,
      emplacement: req.query.emplacement,
      size: req.query.size,
    });
    res.status(201).send({ message: "File was uploaded successfully!" });
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

exports.createFolder = async (req, res) => {
  try {
    const creatorId = isUuid(req.body.idcreator) ? req.body.idcreator : null;
    await documentRepository.createDocument({
      creatorId,
      creatorName: req.body.namecreator,
      date: req.body.date,
      title: req.body.title,
      type: "folder",
      link: "",
      extension: "",
      emplacement: req.body.emplacement,
      size: "",
    });
    res.status(201).send({ message: "Folder was created successfully!" });
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

exports.getDocuments = async (req, res) => {
  try {
    const docs = await documentRepository.listByEmplacement(req.body.emp);
    res.status(200).send(docs.map(documentRepository.mapDocumentRow));
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

exports.updatePicture = async (req, res) => {
  let imagePath = `${process.env.BASE_URL}/uploads/`;
  if (req.file && req.file.filename) {
    imagePath += req.file.filename;
  }

  if (req.id !== req.params.id) {
    return res.status(404).send({ message: "Unauthorized!" });
  }

  try {
    await studentRepository.updatePicture(req.params.id, imagePath);
    res.status(200).send({ message: "User updated" });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: err.message || err });
  }
};

exports.signup = async (req, res) => {
  try {
    const hash = await bcrypt.hash(req.body.password, 10);
    const email = (req.body.email || "").trim().toLowerCase();
    let confirmCode = generateVerificationCode();
    const verificationExpiresAt = getVerificationExpiry();
    while (await studentRepository.findByConfirmationCode(confirmCode)) {
      confirmCode = generateVerificationCode();
    }

    const getLocation = () =>
      new Promise((resolve) => {
        location.latlng(req, res, (result) => {
          resolve(result);
        });
      });

    const locationResult = await getLocation();
    const latitude = locationResult ? locationResult.latitude : null;
    const longitude = locationResult ? locationResult.longitude : null;

    const student = await studentRepository.createStudent({
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      email,
      password: hash,
      confirmationCode: confirmCode,
      verificationExpiresAt,
      verificationAttempts: 0,
      country: req.body.country,
      city: req.body.city,
      address: req.body.address,
      phone: req.body.phone,
      type: req.body.type,
      workAt: req.body.workAt,
      class: req.body.class,
      promotion: req.body.promotion,
      linkedin: req.body.linkedin,
      picture: req.body.picture,
      aboutme: req.body.aboutme,
      latitude,
      longitude,
      status: "Pending",
      confirmationCode: confirmCode,
    });

    try {
      const admins = await adminRepository.listIds();
      if (admins.length > 0) {
        await notificationRepository.createMany(
          admins.map((adminId) => ({
            recipientType: "admin",
            recipientId: adminId,
            title: "New Student Signup",
            message: `${student.firstname} ${student.lastname} created a student account.`,
            type: "info",
          }))
        );
      }
    } catch (notifyError) {
      console.warn("Student signup notifications failed:", notifyError.message || notifyError);
    }

    res.status(201).send({ message: "User was registered successfully! Please check your email." });

    nodemailer.sendConfirmationEmail(
      student.firstname,
      student.email,
      student.confirmation_code
    );
  } catch (err) {
    console.error("Student signin failed:", err);
    return res.status(500).send({ message: "Login failed. Please try again later." });
  }
};

exports.signin = async (req, res) => {
  const authJwt = require("../middlewares/authJwt");

  try {
    const email = (req.body.email || "").trim().toLowerCase();
    const student = await studentRepository.findByEmail(email);

    if (!student) {
      return res.status(401).send({ message: "Invalid email or password." });
    }

    if (student.status !== "Active") {
      return res.status(401).send({
        message: "Pending Account. Please Verify Your Email!",
      });
    }

    let passwordIsValid = false;
    try {
      passwordIsValid = bcrypt.compareSync(req.body.password, student.password);
    } catch (compareError) {
      return res.status(401).send({ message: "Invalid email or password." });
    }

    if (!passwordIsValid) {
      return res.status(401).send({
        message: "Invalid email or password.",
      });
    }

    const token = jwt.sign({ email: student.email, id: student.id }, config.secret, {
      expiresIn: "24h",
    });

    const refreshToken = await refreshTokenRepository.createToken(student.id, "Student");
    authJwt.setAuthCookies(res, token, refreshToken, "student");

    return res.status(200).send({
      id: student.id,
      email: student.email,
      name: `${student.firstname} ${student.lastname}`,
      userType: "student",
    });
  } catch (err) {
    return res.status(500).send({ message: err.message || err });
  }
};

exports.verifyUser = async (req, res) => {
  try {
    const code = req.body.code;
    const email = (req.body.email || "").trim().toLowerCase();
    if (!code) {
      return res.status(400).send({ message: "Verification code is required." });
    }

    const { maxAttempts } = getVerificationLimits();
    const isExpired = (expiresAt) =>
      expiresAt && new Date(expiresAt).getTime() < Date.now();

    let student = null;
    if (email) {
      student = await studentRepository.findByEmail(email);
      if (!student) {
        return res.status(400).send({ message: "Invalid verification code." });
      }
      if (student.status === "Active") {
        return res.status(400).send({ message: "Account already verified." });
      }
      if ((student.verification_attempts || 0) >= maxAttempts) {
        return res.status(429).send({ message: "Too many attempts. Please request a new code." });
      }
      if (isExpired(student.verification_expires_at)) {
        return res.status(400).send({ message: "Verification code expired. Please request a new one." });
      }
      if (student.confirmation_code !== code) {
        await studentRepository.incrementVerificationAttempts(student.id);
        return res.status(400).send({ message: "Invalid verification code." });
      }
    } else {
      student = await studentRepository.findByConfirmationCode(code);
      if (!student) {
        return res.status(404).send({ message: "User Not found." });
      }
      if (student.status === "Active") {
        return res.status(400).send({ message: "Account already verified." });
      }
      if ((student.verification_attempts || 0) >= maxAttempts) {
        return res.status(429).send({ message: "Too many attempts. Please request a new code." });
      }
      if (isExpired(student.verification_expires_at)) {
        return res.status(400).send({ message: "Verification code expired. Please request a new one." });
      }
    }

    await studentRepository.verifyStudent(student.id);
    res.status(200).send({ message: "Account Verified!" });
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

exports.resendVerificationCode = async (req, res) => {
  try {
    const email = (req.body.email || "").trim().toLowerCase();
    if (!email) {
      return res.status(400).send({ message: "Email is required." });
    }

    let confirmCode = generateVerificationCode();
    while (await studentRepository.findByConfirmationCode(confirmCode)) {
      confirmCode = generateVerificationCode();
    }

    const verificationExpiresAt = getVerificationExpiry();
    const student = await studentRepository.updateConfirmationCodeByEmail(
      email,
      confirmCode,
      verificationExpiresAt
    );
    if (student) {
      nodemailer.sendConfirmationEmail(
        student.firstname,
        student.email,
        student.confirmation_code
      );
    }

    return res.status(200).send({
      message: "If that email exists, a new verification code has been sent.",
    });
  } catch (err) {
    console.error("Resend student verification failed:", err);
    return res.status(500).send({ message: "Unable to resend verification code." });
  }
};

exports.getLocation = (req, res) => {
  let query = req.query.q;
  query = query.replace(/\+/g, " ");
  location
    .geocodeText(query, "Tunisie", "FR")
    .then((result) => {
      res.status(200).send(result);
    })
    .catch(() => {
      res.status(500).send({ message: "err here" });
    });
};

exports.getAll = async (req, res) => {
  try {
    const students = await studentRepository.listAll();
    const response = students.map(mapStudentRow);
    res.status(200).send(response);
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

exports.getByName = async (req, res) => {
  try {
    if (!req.query.q) {
      return res.status(400).send({ message: "Missing search query." });
    }
    const students = await studentRepository.listAll();
    const response = [];
    students.forEach((doc) => {
      const name = `${doc.firstname} ${doc.lastname}`;
      if (stringSimilarity.compareTwoStrings(name.toLowerCase(), req.query.q.toLowerCase()) > 0.45) {
        response.push(mapStudentRow(doc));
      }
    });
    res.status(200).send(response);
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

exports.getStudentLocations = async (req, res) => {
  const allowed = {
    country: "country",
    city: "city",
    class: "\"class\"",
    promotion: "promotion",
  };
  const column = allowed[req.query.property];
  if (!column || !req.query.key) {
    return res.status(400).send({ message: "Invalid search parameters." });
  }

  try {
    const docs = await studentRepository.searchByKey(column, req.query.key);
    const response = docs.map((doc) => ({
      id: doc.id,
      lat: doc.latitude,
      lng: doc.longitude,
      name: `${doc.firstname} ${doc.lastname}`,
    }));
    res.status(200).send(response);
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

exports.getByKey = async (req, res) => {
  const allowed = {
    firstname: "firstname",
    lastname: "lastname",
    email: "email",
    country: "country",
    city: "city",
    class: "\"class\"",
    promotion: "promotion",
    type: "type",
  };
  const column = allowed[req.query.property];
  if (!column || !req.query.key) {
    return res.status(400).send({ message: "Invalid search parameters." });
  }

  try {
    const docs = await studentRepository.searchByKey(column, req.query.key);
    const response = docs.map(mapStudentRow);
    res.status(200).send(response);
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

exports.getByFilters = async (req, res) => {
  const { country, city, promotion, class: className } = req.query;
  if (!country && !city && !promotion && !className) {
    return res.status(400).send({ message: "At least one filter is required" });
  }

  try {
    const docs = await studentRepository.searchByFilters({
      country,
      city,
      promotion,
      className,
    });
    res.status(200).send(docs.map(mapStudentRow));
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

exports.getStudentById = async (req, res) => {
  try {
    if (!isUuid(req.params.id)) {
      return res.status(400).send({ message: "Invalid student id." });
    }
    const student = await studentRepository.findById(req.params.id);
    if (!student) {
      return res.status(404).send({ message: "User Not found." });
    }
    return res.status(200).send(mapStudentRow(student));
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

exports.updateStudent = async (req, res) => {
  if (!isUuid(req.params.id)) {
    return res.status(400).send({ message: "Invalid student id." });
  }
  if (req.id !== req.params.id) {
    return res.status(403).send({ message: "Unauthorized!" });
  }

  try {
    const getLocation = () =>
      new Promise((resolve) => {
        location.latlng(req, res, (result) => {
          resolve(result);
        });
      });

    let locationResult = null;
    try {
      locationResult = await getLocation();
    } catch (err) {
      console.error("Location lookup failed:", err);
    }

    const updateData = {
      status: "Active",
      country: req.body.country,
      city: req.body.city,
      address: req.body.address,
      phone: req.body.phone,
      type: req.body.type,
      workAt: req.body.workAt,
      class: req.body.class,
      promotion: req.body.promotion,
      linkedin: req.body.linkedin,
      picture: req.body.picture,
      aboutme: req.body.aboutme,
    };

    if (locationResult) {
      updateData.latitude = locationResult.latitude;
      updateData.longitude = locationResult.longitude;
    }

    await studentRepository.updateStudent(req.params.id, updateData);
    return res.status(200).send({ message: "User updated" });
  } catch (err) {
    console.error("Failed to update student:", err);
    return res.status(500).send({ message: err.message || err });
  }
};

exports.companiesInfo = async (req, res) => {
  const info = [];
  if (!req.body.companies || req.body.companies.length === 0) {
    return res.status(200).send(info);
  }

  try {
    const companyIds = req.body.companies.filter((id) => isUuid(id));
    const companies = await companyRepository.findByIds(companyIds);
    companies.forEach((company) => {
      info.push({
        id: company.id,
        name: company.name,
        about: company.about,
        address: company.address,
        city: company.city,
        country: company.country,
        email: company.email,
        phone: company.phone,
        website: company.website,
        logo: company.logo,
      });
    });
    res.status(200).send(info);
  } catch (err) {
    console.error("Error finding company:", err);
    res.status(200).send(info);
  }
};

exports.deleteStudent = async (req, res) => {
  if (req.id !== req.params.id) {
    return res.status(404).send({ message: "Unauthorized!" });
  }
  try {
    const deleted = await studentRepository.deleteStudent(req.params.id);
    if (!deleted) {
      return res.status(404).send({ message: "User Not found." });
    }
    res.status(200).send({ message: "User deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: err.message || err });
  }
};
