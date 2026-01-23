const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { documentShareRepository, documentRepository, documentAccessRepository } = require("../repositories");

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const isExpired = (expiresAt) =>
  expiresAt && new Date(expiresAt).getTime() < Date.now();

const buildShareResponse = (doc) => ({
  document: documentRepository.mapDocumentRow(doc),
});

const accessLevelToAudience = (accessLevel) => {
  const v = String(accessLevel || "").trim().toLowerCase();
  if (v === "students" || v === "companies") return v;
  return "internal";
};

const isAudienceMatch = (audience, userType) => {
  const a = String(audience || "").trim().toLowerCase();
  if (a === "students") return userType === "student";
  if (a === "companies") return userType === "company";
  // internal-only
  return userType === "admin";
};

exports.getSharedDocument = async (req, res) => {
  try {
    if (!req.id) {
      return res.status(401).send({ message: "Unauthorized!" });
    }

    const tokenHash = hashToken(req.params.token || "");
    const share = await documentShareRepository.findByTokenHash(tokenHash);

    if (!share || share.revoked_at) {
      return res.status(404).send({ message: "Share link not found." });
    }
    if (isExpired(share.expires_at)) {
      return res.status(410).send({ message: "Share link expired." });
    }
    if (share.password_hash) {
      return res.status(401).send({ message: "Password required.", requiresPassword: true });
    }

    const requesterType = await documentAccessRepository.resolveUserTypeById(req.id);
    if (!requesterType) {
      return res.status(401).send({ message: "Unauthorized!" });
    }

    const [doc] = await documentRepository.listByIds([share.document_id]);
    if (!doc) {
      return res.status(404).send({ message: "Document not found." });
    }
    if (doc.quarantined || doc.scan_status === "infected") {
      return res.status(423).send({ message: "Document is quarantined." });
    }

    const parsed = documentShareRepository.parseShareAccess(share.access);
    const audience = parsed.audience || accessLevelToAudience(doc.access_level);
    if (!isAudienceMatch(audience, requesterType)) {
      return res.status(403).send({ message: "Access denied for this share link." });
    }

    return res.status(200).send(buildShareResponse(doc));
  } catch (err) {
    console.error("Get shared document failed:", err);
    return res.status(500).send({ message: "Failed to access shared document." });
  }
};

exports.accessSharedDocument = async (req, res) => {
  try {
    if (!req.id) {
      return res.status(401).send({ message: "Unauthorized!" });
    }

    const tokenHash = hashToken(req.params.token || "");
    const share = await documentShareRepository.findByTokenHash(tokenHash);

    if (!share || share.revoked_at) {
      return res.status(404).send({ message: "Share link not found." });
    }
    if (isExpired(share.expires_at)) {
      return res.status(410).send({ message: "Share link expired." });
    }

    if (share.password_hash) {
      const password = req.body.password || "";
      const matches = await bcrypt.compare(password, share.password_hash);
      if (!matches) {
        return res.status(401).send({ message: "Invalid password." });
      }
    }

    const requesterType = await documentAccessRepository.resolveUserTypeById(req.id);
    if (!requesterType) {
      return res.status(401).send({ message: "Unauthorized!" });
    }

    const [doc] = await documentRepository.listByIds([share.document_id]);
    if (!doc) {
      return res.status(404).send({ message: "Document not found." });
    }
    if (doc.quarantined || doc.scan_status === "infected") {
      return res.status(423).send({ message: "Document is quarantined." });
    }

    const parsed = documentShareRepository.parseShareAccess(share.access);
    const audience = parsed.audience || accessLevelToAudience(doc.access_level);
    if (!isAudienceMatch(audience, requesterType)) {
      return res.status(403).send({ message: "Access denied for this share link." });
    }

    return res.status(200).send(buildShareResponse(doc));
  } catch (err) {
    console.error("Access shared document failed:", err);
    return res.status(500).send({ message: "Failed to access shared document." });
  }
};
