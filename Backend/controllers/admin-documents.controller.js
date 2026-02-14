// REST-style admin document endpoints.
// Admin auth is enforced at the router level.

const path = require("path");
const fs = require("fs");
const archiver = require("archiver");
const crypto = require("crypto");
const db = require("../db");
const { isUuid } = require("../utils/validation");
const { documentRepository, documentShareRepository, documentVersionRepository } = require("../repositories");

const normalizeBaseUrl = (value) => String(value || "").replace(/\/+$/, "");
const getFileBaseUrl = () =>
  normalizeBaseUrl(process.env.FILE_BASE_URL || process.env.BASE_URL || process.env.APP_URL || "");

const parseTags = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String).map((t) => t.trim()).filter(Boolean);
  return String(value)
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
};

const getUploadsDir = () => path.join(__dirname, "..", "uploads");
const getVersionedPath = (documentId, version, extension) => {
  const ext = extension ? `.${extension}` : "";
  return path.join(getUploadsDir(), "versions", `${documentId}-v${version}${ext}`);
};

const extractFilenameFromLink = (link) => {
  if (!link) return null;
  try {
    if (String(link).startsWith("http")) {
      return path.basename(new URL(String(link)).pathname);
    }
    return path.basename(String(link));
  } catch (err) {
    return path.basename(String(link));
  }
};

const safeUnlink = (filename) => {
  if (!filename) return;
  const safeName = path.basename(filename);
  const filePath = path.join(getUploadsDir(), safeName);
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (err) {
    // Best-effort cleanup; do not fail the request on filesystem cleanup.
  }
};

const buildReplaceLink = (filename) => {
  const baseUrl = getFileBaseUrl();
  return `${baseUrl}/uploads/${filename}`;
};

const isAdminDocRow = (row) => !row?.creator_type || row.creator_type === "admin";

const getFolderFullPath = (folderRow) => {
  const parent = folderRow?.emplacement || "root";
  const title = folderRow?.title || "";
  if (!title) return "";
  return parent === "root" ? title : `${parent}/${title}`;
};

const hashToken = (token) =>
  crypto.createHash("sha256").update(String(token || "")).digest("hex");

const getShareUrl = (token) => {
  const baseUrl = normalizeBaseUrl(process.env.BASE_URL || process.env.APP_URL || "");
  return `${baseUrl}/api/documents/share/${token}`;
};

const normalizeAudience = (value) => {
  const v = String(value || "").trim().toLowerCase();
  if (v === "students" || v === "companies" || v === "internal" || v === "public") return v;
  return null;
};

const audienceToAccessLevel = (audience) => {
  if (audience === "public") return "public";
  if (audience === "internal") return "private";
  if (audience === "students" || audience === "companies") return audience;
  return "private";
};

const accessLevelToAudience = (accessLevel) => {
  const v = String(accessLevel || "").trim().toLowerCase();
  if (v === "public") return "public";
  if (v === "students" || v === "companies") return v;
  return "internal";
};

exports.listDocuments = async (req, res) => {
  try {
    const q = req.query.q ? String(req.query.q) : "";
    const category = req.query.category ? String(req.query.category) : null;
    const type = req.query.type ? String(req.query.type) : null;
    const emplacement = req.query.emplacement ? String(req.query.emplacement) : null;
    const sort = req.query.sort ? String(req.query.sort) : null;
    const order = req.query.order ? String(req.query.order) : null;
    const from = req.query.from ? String(req.query.from) : null;
    const to = req.query.to ? String(req.query.to) : null;
    const tags = parseTags(req.query.tags);
    const page = req.query.page ? Number(req.query.page) : undefined;
    const pageSize = req.query.pageSize ? Number(req.query.pageSize) : undefined;

    const fromDate = from ? new Date(from) : null;
    if (from && Number.isNaN(fromDate.getTime())) {
      return res.status(400).send({ message: "Invalid from date." });
    }

    const toDate = to ? new Date(to) : null;
    if (to && Number.isNaN(toDate.getTime())) {
      return res.status(400).send({ message: "Invalid to date." });
    }

    const { rows, total } = await documentRepository.listAdminDocuments({
      emplacement,
      category,
      query: q || null,
      type,
      tags,
      fromDate: fromDate || null,
      toDate: toDate || null,
      sort,
      order,
      page,
      pageSize,
    });

    res.status(200).send({
      data: rows.map(documentRepository.mapDocumentRow),
      total,
      page: page || 1,
      pageSize: pageSize || null,
    });
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

exports.createDocument = async (req, res) => {
  try {
    if (!isUuid(req.id)) {
      return res.status(401).send({ message: "Unauthorized!" });
    }

    if (!req.file) {
      return res.status(400).send({ message: "No file uploaded." });
    }

    const title = String(req.body.title || "").trim();
    if (!title) {
      return res.status(400).send({ message: "Title is required." });
    }

    const originalExt = path.extname(req.file.originalname || "").replace(".", "").toLowerCase();
    const extension = originalExt || path.extname(req.file.filename || "").replace(".", "").toLowerCase();
    const baseUrl = getFileBaseUrl();
    const link = `${baseUrl}/uploads/${req.file.filename}`;

    if (req.body.accessLevel !== undefined) {
      const allowed = ["private", "students", "companies"];
      const next = String(req.body.accessLevel || "").trim().toLowerCase();
      if (!allowed.includes(next)) {
        return res.status(400).send({ message: "Invalid accessLevel value." });
      }
    }

    const doc = await documentRepository.createDocument({
      creatorId: req.id,
      creatorName: req.email || "Administrator",
      creatorType: "admin",
      date: new Date(),
      title,
      description: req.body.description || null,
      category: req.body.category || null,
      tags: parseTags(req.body.tags),
      type: "file",
      accessLevel: req.body.accessLevel || "private",
      link,
      extension: extension || null,
      mimeType: req.file.mimetype || null,
      emplacement: req.body.emplacement || "root",
      size: req.file.size ? String(req.file.size) : null,
      sizeBytes: req.file.size || null,
      createdAt: new Date(),
    });

    res.status(201).send(documentRepository.mapDocumentRow(doc));
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

exports.getDocument = async (req, res) => {
  res.status(501).send({ message: "Admin document retrieval not implemented yet." });
};

exports.createFolder = async (req, res) => {
  try {
    if (!isUuid(req.id)) {
      return res.status(401).send({ message: "Unauthorized!" });
    }

    const title = String(req.body.title || "").trim();
    if (!title) return res.status(400).send({ message: "Title is required." });
    const parentPath = req.body.parentPath ? String(req.body.parentPath) : "root";

    const folder = await documentRepository.createFolderDocument({
      creatorId: req.id,
      creatorName: req.email || "Administrator",
      creatorType: "admin",
      title,
      parentPath,
    });

    res.status(201).send(documentRepository.mapDocumentRow(folder));
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

exports.renameFolder = async (req, res) => {
  try {
    if (!isUuid(req.id) || !isUuid(req.params.id)) {
      return res.status(400).send({ message: "Invalid folder id." });
    }

    const title = String(req.body.title || "").trim();
    if (!title) return res.status(400).send({ message: "Title is required." });

    const [existing] = await documentRepository.listByIds([req.params.id]);
    if (!existing || !isAdminDocRow(existing) || existing.type !== "folder") {
      return res.status(404).send({ message: "Folder not found." });
    }

    let expectedUpdatedAt;
    if (Object.prototype.hasOwnProperty.call(req.body, "updatedAt")) {
      expectedUpdatedAt = req.body.updatedAt;
      if (expectedUpdatedAt !== null) {
        const parsed = new Date(String(expectedUpdatedAt));
        if (Number.isNaN(parsed.getTime())) {
          return res.status(400).send({ message: "Invalid updatedAt value." });
        }
        expectedUpdatedAt = parsed.toISOString();
      }
    }

    const folder = await documentRepository.renameFolderDocument({
      id: req.params.id,
      title,
      expectedUpdatedAt,
    });

    if (!folder) {
      if (expectedUpdatedAt !== undefined) {
        return res.status(409).send({ message: "Folder was updated by another user." });
      }
      return res.status(404).send({ message: "Folder not found." });
    }

    res.status(200).send(documentRepository.mapDocumentRow(folder));
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

exports.deleteFolder = async (req, res) => {
  try {
    if (!isUuid(req.id) || !isUuid(req.params.id)) {
      return res.status(400).send({ message: "Invalid folder id." });
    }

    const [existing] = await documentRepository.listByIds([req.params.id]);
    if (!existing || !isAdminDocRow(existing) || existing.type !== "folder") {
      return res.status(404).send({ message: "Folder not found." });
    }

    const result = await documentRepository.deleteFolderIfEmpty(req.params.id);
    if (!result.deleted && result.reason === "not_empty") {
      return res.status(409).send({ message: "Folder is not empty." });
    }
    if (!result.deleted) {
      return res.status(404).send({ message: "Folder not found." });
    }

    res.status(204).send();
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

exports.updateDocument = async (req, res) => {
  try {
    if (!isUuid(req.id) || !isUuid(req.params.id)) {
      return res.status(400).send({ message: "Invalid document id." });
    }

    const [existing] = await documentRepository.listByIds([req.params.id]);
    if (!existing || (existing.creator_type && existing.creator_type !== "admin")) {
      return res.status(404).send({ message: "Document not found." });
    }

    const title = req.body.title !== undefined ? String(req.body.title || "").trim() : undefined;
    if (req.body.title !== undefined && !title) {
      return res.status(400).send({ message: "Title is required." });
    }

    let expectedUpdatedAt;
    if (Object.prototype.hasOwnProperty.call(req.body, "updatedAt")) {
      expectedUpdatedAt = req.body.updatedAt;
      if (expectedUpdatedAt !== null) {
        const parsed = new Date(String(expectedUpdatedAt));
        if (Number.isNaN(parsed.getTime())) {
          return res.status(400).send({ message: "Invalid updatedAt value." });
        }
        expectedUpdatedAt = parsed.toISOString();
      }
    }

    if (req.body.accessLevel !== undefined) {
      const allowed = ["private", "students", "companies"];
      const next = String(req.body.accessLevel || "").trim().toLowerCase();
      if (!allowed.includes(next)) {
        return res.status(400).send({ message: "Invalid accessLevel value." });
      }
    }

    const doc = await documentRepository.updateDocumentMeta(req.params.id, {
      title: title !== undefined ? title : undefined,
      description: req.body.description,
      category: req.body.category,
      tags: Array.isArray(req.body.tags) ? req.body.tags : parseTags(req.body.tags),
      emplacement: req.body.emplacement,
      accessLevel: req.body.accessLevel,
      pinned: typeof req.body.pinned === "boolean" ? req.body.pinned : undefined,
      expectedUpdatedAt,
    });

    if (!doc && expectedUpdatedAt !== undefined) {
      return res.status(409).send({ message: "Document was updated by another user." });
    }

    if (!doc) {
      return res.status(404).send({ message: "Document not found." });
    }

    res.status(200).send(documentRepository.mapDocumentRow(doc));
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

exports.createShareLink = async (req, res) => {
  try {
    if (!isUuid(req.id) || !isUuid(req.params.id)) {
      return res.status(400).send({ message: "Invalid document id." });
    }

    const [doc] = await documentRepository.listByIds([req.params.id]);
    if (!doc || !isAdminDocRow(doc) || doc.type !== "file") {
      return res.status(404).send({ message: "Document not found." });
    }
    if (doc.quarantined || doc.scan_status === "infected") {
      return res.status(423).send({ message: "Document is quarantined." });
    }

    const audience = normalizeAudience(req.body.audience) || accessLevelToAudience(doc.access_level);

    let expiresInDays = req.body.expiresInDays;
    expiresInDays = expiresInDays === undefined || expiresInDays === null ? 7 : Number(expiresInDays);
    if (!Number.isFinite(expiresInDays) || expiresInDays <= 0 || expiresInDays > 365) {
      return res.status(400).send({ message: "Invalid expiresInDays value." });
    }

    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    // Keep visibility aligned with the target audience so share access checks are deterministic.
    const nextAccessLevel = audienceToAccessLevel(audience);
    if (doc.access_level !== nextAccessLevel) {
      await documentRepository.updateDocumentAudience({ id: doc.id, accessLevel: nextAccessLevel });
    }

    // Use the share ID as the token so the share URL is reconstructable when listing shares.
    const token = crypto.randomUUID();
    const tokenHash = hashToken(token);

    const share = await documentShareRepository.createShare({
      id: token,
      documentId: doc.id,
      tokenHash,
      expiresAt,
      passwordHash: null,
      access: "view",
      audience,
      createdBy: req.id,
      createdByType: "admin",
    });

    res.status(201).send({
      id: share.id,
      documentId: share.document_id,
      shareUrl: getShareUrl(token),
      expiresAt: share.expires_at,
      revokedAt: share.revoked_at,
      requiresLogin: true,
      audience,
    });
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

exports.listShareLinks = async (req, res) => {
  try {
    if (!isUuid(req.id) || !isUuid(req.params.id)) {
      return res.status(400).send({ message: "Invalid document id." });
    }

    const [doc] = await documentRepository.listByIds([req.params.id]);
    if (!doc || !isAdminDocRow(doc) || doc.type !== "file") {
      return res.status(404).send({ message: "Document not found." });
    }

    const shares = await documentShareRepository.listByDocumentId(doc.id);
    res.status(200).send(
      shares.map((share) => {
        const parsed = documentShareRepository.parseShareAccess(share.access);
        const audience = normalizeAudience(parsed.audience) || accessLevelToAudience(doc.access_level);
        return {
          id: share.id,
          documentId: share.document_id,
          shareUrl: getShareUrl(share.id),
          expiresAt: share.expires_at,
          revokedAt: share.revoked_at,
          requiresLogin: true,
          audience,
        };
      })
    );
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

exports.revokeShareLink = async (req, res) => {
  try {
    if (!isUuid(req.id) || !isUuid(req.params.shareId)) {
      return res.status(400).send({ message: "Invalid share id." });
    }

    const share = await documentShareRepository.revokeShare(req.params.shareId);
    if (!share) {
      return res.status(404).send({ message: "Share not found." });
    }

    const [doc] = await documentRepository.listByIds([share.document_id]);
    if (!doc || !isAdminDocRow(doc)) {
      return res.status(404).send({ message: "Share not found." });
    }

    const parsed = documentShareRepository.parseShareAccess(share.access);
    const audience = normalizeAudience(parsed.audience) || accessLevelToAudience(doc.access_level);

    res.status(200).send({
      id: share.id,
      documentId: share.document_id,
      shareUrl: getShareUrl(share.id),
      expiresAt: share.expires_at,
      revokedAt: share.revoked_at,
      requiresLogin: true,
      audience,
    });
  } catch (err) {
    res.status(500).send({ message: err.message || err });
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

    const [existing] = await documentRepository.listByIds([req.params.id]);
    if (!existing || (existing.creator_type && existing.creator_type !== "admin")) {
      return res.status(404).send({ message: "Document not found." });
    }

    if (existing.type !== "file" || !existing.link) {
      return res.status(400).send({ message: "Only files can be replaced." });
    }

    const currentFilename = extractFilenameFromLink(existing.link);
    const currentPath = currentFilename ? path.join(getUploadsDir(), currentFilename) : null;
    if (!currentPath) {
      return res.status(500).send({ message: "Current file path is unavailable." });
    }

    const versionsDir = path.join(getUploadsDir(), "versions");
    fs.mkdirSync(versionsDir, { recursive: true });

    // Persist the current file as a version snapshot (best-effort; restore depends on it).
    if (fs.existsSync(currentPath)) {
      const previousVersion = existing.version || 1;
      const versionPath = getVersionedPath(existing.id, previousVersion, existing.extension);
      fs.copyFileSync(currentPath, versionPath);
      const baseUrl = getFileBaseUrl();
      await documentVersionRepository.createVersion({
        documentId: existing.id,
        version: previousVersion,
        link: `${baseUrl}/uploads/versions/${path.basename(versionPath)}`,
        extension: existing.extension || null,
        mimeType: existing.mime_type || null,
        size: existing.size || null,
        sizeBytes: existing.size_bytes || null,
      });
    }

    const originalExt = path.extname(req.file.originalname || "").replace(".", "").toLowerCase();
    const extension = originalExt || path.extname(req.file.filename || "").replace(".", "").toLowerCase();

    // Keep the link stable by replacing the contents of the existing filename.
    fs.renameSync(req.file.path, currentPath);

    const nextVersion = Number(existing.version || 1) + 1;
    const doc = await documentRepository.updateDocumentFile(req.params.id, {
      link: existing.link,
      extension: extension || existing.extension || null,
      mimeType: req.file.mimetype || existing.mime_type || null,
      size: req.file.size ? String(req.file.size) : existing.size || null,
      sizeBytes: req.file.size || existing.size_bytes || null,
      version: nextVersion,
    });

    if (!doc) {
      return res.status(404).send({ message: "Document not found." });
    }

    res.status(200).send(documentRepository.mapDocumentRow(doc));
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

exports.listDocumentVersions = async (req, res) => {
  try {
    if (!isUuid(req.id) || !isUuid(req.params.id)) {
      return res.status(400).send({ message: "Invalid document id." });
    }

    const [doc] = await documentRepository.listByIds([req.params.id]);
    if (!doc || !isAdminDocRow(doc) || doc.type !== "file") {
      return res.status(404).send({ message: "Document not found." });
    }

    const versions = await documentVersionRepository.listByDocumentId(doc.id);
    res.status(200).send(
      versions.map((version) => ({
        id: version.id,
        documentId: version.document_id,
        version: version.version,
        link: version.link,
        extension: version.extension,
        mimeType: version.mime_type,
        sizeBytes: version.size_bytes,
        createdAt: version.created_at,
      }))
    );
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

exports.restoreDocumentVersion = async (req, res) => {
  try {
    if (!isUuid(req.id) || !isUuid(req.params.id) || !isUuid(req.params.versionId)) {
      return res.status(400).send({ message: "Invalid request." });
    }

    const [doc] = await documentRepository.listByIds([req.params.id]);
    if (!doc || !isAdminDocRow(doc) || doc.type !== "file") {
      return res.status(404).send({ message: "Document not found." });
    }

    const version = await documentVersionRepository.findById(req.params.versionId);
    if (!version || version.document_id !== doc.id) {
      return res.status(404).send({ message: "Version not found." });
    }

    const currentFilename = extractFilenameFromLink(doc.link);
    const currentPath = currentFilename ? path.join(getUploadsDir(), currentFilename) : null;
    const versionFilename = extractFilenameFromLink(version.link);
    const versionPath = versionFilename ? path.join(getUploadsDir(), "versions", versionFilename) : null;

    if (!currentPath || !versionPath || !fs.existsSync(versionPath)) {
      return res.status(404).send({ message: "Version file missing." });
    }

    // Backup current file as a version before restoring.
    const currentVersion = doc.version || 1;
    const versionsDir = path.join(getUploadsDir(), "versions");
    fs.mkdirSync(versionsDir, { recursive: true });
    if (fs.existsSync(currentPath)) {
      const currentBackupPath = getVersionedPath(doc.id, currentVersion, doc.extension || version.extension);
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

    res.status(200).send(documentRepository.mapDocumentRow(updated));
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    if (!isUuid(req.id) || !isUuid(req.params.id)) {
      return res.status(400).send({ message: "Invalid document id." });
    }

    const [existing] = await documentRepository.listByIds([req.params.id]);
    if (!existing || (existing.creator_type && existing.creator_type !== "admin")) {
      return res.status(404).send({ message: "Document not found." });
    }

    if (existing.type === "folder") {
      const result = await documentRepository.deleteFolderIfEmpty(req.params.id);
      if (!result.deleted && result.reason === "not_empty") {
        return res.status(409).send({ message: "Folder is not empty." });
      }
      if (!result.deleted) {
        return res.status(404).send({ message: "Document not found." });
      }
      return res.status(204).send();
    }

    if (existing.type === "file") {
      safeUnlink(extractFilenameFromLink(existing.link));
    }

    const ok = await documentRepository.deleteById(req.params.id);
    if (!ok) {
      return res.status(404).send({ message: "Document not found." });
    }

    // Returning 204 keeps the client logic simple.
    res.status(204).send();
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

exports.bulkDelete = async (req, res) => {
  try {
    if (!isUuid(req.id)) {
      return res.status(401).send({ message: "Unauthorized!" });
    }

    const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
    const validIds = ids.filter((id) => isUuid(id));
    if (!validIds.length) {
      return res.status(400).send({ message: "No documents selected." });
    }

    const docs = await documentRepository.listByIds(validIds);
    const allowed = docs.filter(isAdminDocRow);

    const successIds = [];
    const failedIds = [];

    for (const doc of allowed) {
      try {
        if (doc.type === "folder") {
          const result = await documentRepository.deleteFolderIfEmpty(doc.id);
          if (!result.deleted) {
            failedIds.push(doc.id);
            continue;
          }
          successIds.push(doc.id);
          continue;
        }

        if (doc.type === "file") {
          safeUnlink(extractFilenameFromLink(doc.link));
          const ok = await documentRepository.deleteById(doc.id);
          if (ok) successIds.push(doc.id);
          else failedIds.push(doc.id);
        }
      } catch (err) {
        failedIds.push(doc.id);
      }
    }

    res.status(200).send({
      successIds,
      failedIds,
      message: `Deleted ${successIds.length} document(s).`,
    });
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

exports.bulkMove = async (req, res) => {
  try {
    if (!isUuid(req.id)) {
      return res.status(401).send({ message: "Unauthorized!" });
    }

    const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
    const validIds = ids.filter((id) => isUuid(id));
    const targetPath = String(req.body.targetPath || "root");
    if (!validIds.length) {
      return res.status(400).send({ message: "No documents selected." });
    }

    const docs = await documentRepository.listByIds(validIds);
    const allowed = docs.filter(isAdminDocRow);

    const successIds = [];
    const failedIds = [];

    for (const doc of allowed) {
      try {
        if (doc.type === "folder") {
          // Move the folder and update descendants' emplacement prefix.
          const oldPath = getFolderFullPath(doc);
          const newFolderPath = targetPath === "root" ? doc.title : `${targetPath}/${doc.title}`;

          await documentRepository.updateDocumentMeta(doc.id, { emplacement: targetPath });
          if (oldPath && newFolderPath && oldPath !== newFolderPath) {
            await db.query(
              `UPDATE documents
               SET emplacement = CASE
                 WHEN emplacement = $1 THEN $2
                 ELSE $2 || substring(emplacement from char_length($1) + 1)
               END,
               updated_at = now()
               WHERE emplacement = $1 OR emplacement LIKE $1 || '/%'`,
              [oldPath, newFolderPath]
            );
          }
          successIds.push(doc.id);
          continue;
        }

        const updated = await documentRepository.updateDocumentMeta(doc.id, { emplacement: targetPath });
        if (!updated) failedIds.push(doc.id);
        else successIds.push(doc.id);
      } catch (err) {
        failedIds.push(doc.id);
      }
    }

    res.status(200).send({
      successIds,
      failedIds,
      message: `Moved ${successIds.length} document(s).`,
    });
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

exports.bulkDownload = async (req, res) => {
  try {
    if (!isUuid(req.id)) {
      return res.status(401).send({ message: "Unauthorized!" });
    }

    const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
    const validIds = ids.filter((id) => isUuid(id));
    if (!validIds.length) {
      return res.status(400).send({ message: "No documents selected." });
    }

    const docs = await documentRepository.listByIds(validIds);
    const downloadable = docs.filter((doc) => isAdminDocRow(doc) && doc.type === "file" && doc.link);
    if (!downloadable.length) {
      return res.status(400).send({ message: "No downloadable documents selected." });
    }

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", "attachment; filename=documents.zip");

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.on("error", (err) => {
      res.status(500).send({ message: "Failed to create archive." });
    });

    archive.pipe(res);

    const usedNames = new Set();
    downloadable.forEach((doc) => {
      try {
        const filename = extractFilenameFromLink(doc.link);
        if (!filename) return;
        const filePath = path.join(getUploadsDir(), path.basename(filename));
        const safeTitle = String(doc.title || filename).replace(/[\/\\]/g, "_");
        let name = safeTitle || filename;
        if (usedNames.has(name)) {
          name = `${doc.id}-${name}`;
        }
        usedNames.add(name);
        archive.file(filePath, { name });
      } catch (err) {
        // Ignore individual file errors; the archive still returns remaining files.
      }
    });

    archive.finalize();
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};
