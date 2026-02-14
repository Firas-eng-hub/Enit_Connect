const fs = require("fs");
const path = require("path");
const { partnerRepository } = require("../repositories");

const normalizeLogoUrl = (value) => {
  const input = String(value || "").trim();
  if (!input) return "";
  if (input.startsWith("http://") || input.startsWith("https://")) return input;
  if (input.startsWith("/uploads/")) return input;
  if (input.startsWith("uploads/")) return `/${input}`;
  return input;
};

const cleanupLogoFile = async (logoUrl) => {
  const filename = partnerRepository.extractLocalUploadFilename(logoUrl);
  if (!filename) return;

  let references = 0;
  try {
    references = await partnerRepository.countByLocalUploadFilename(filename);
  } catch (err) {
    // Fail safe: keep file when reference state is unknown.
    return;
  }
  if (references > 0) return;

  const absolutePath = path.join(__dirname, "..", "uploads", filename);
  try {
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }
  } catch (err) {
    // Best effort cleanup only; do not fail API response.
  }
};

exports.listPartners = async (req, res) => {
  try {
    const rows = await partnerRepository.listAll();
    res.status(200).send(rows.map(partnerRepository.mapPartnerRow));
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

exports.createPartner = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const logoUrl = normalizeLogoUrl(req.body.logoUrl);

    if (!name || !logoUrl) {
      return res.status(400).send({ message: "Partner name and logo URL are required." });
    }

    const created = await partnerRepository.createPartner({ name, logoUrl });
    return res.status(201).send(partnerRepository.mapPartnerRow(created));
  } catch (err) {
    return res.status(500).send({ message: err.message || err });
  }
};

exports.deletePartner = async (req, res) => {
  try {
    const deleted = await partnerRepository.deletePartner(req.params.id);
    if (!deleted) {
      return res.status(404).send({ message: "Partner not found." });
    }

    await cleanupLogoFile(deleted.logo_url);
    return res.status(200).send({ message: "Partner deleted successfully." });
  } catch (err) {
    return res.status(500).send({ message: err.message || err });
  }
};

exports.uploadPartnerLogo = async (req, res) => {
  if (!req.file) {
    return res.status(400).send({ message: "No file uploaded." });
  }

  const logoUrl = `/uploads/${req.file.filename}`;
  return res.status(201).send({ logoUrl });
};
