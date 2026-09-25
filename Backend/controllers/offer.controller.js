const {
  offerRepository,
  companyRepository,
  studentRepository,
  notificationRepository,
  offerViewRepository,
} = require("../repositories");
const { isUuid, pickAllowed } = require("../utils/validation");

const allowedSearchFields = {
  title: "title",
  type: "type",
  content: "content",
  start: "start_date",
  end: "end_date",
};

// Candidacies carry applicants' personal data (studentSnapshot, application
// body, documents), so they are only ever returned to the company that owns
// the offer. Everyone else gets the offer with an empty candidacies list.
const isOfferOwner = (offer, callerId) =>
  Boolean(callerId) && String(offer.company_id) === String(callerId);

const buildOffersWithCandidacies = async (offers, callerId) => {
  if (!offers.length) return [];
  const ownedOffers = offers.filter((offer) => isOfferOwner(offer, callerId));
  if (!ownedOffers.length) {
    return offers.map((offer) => offerRepository.mapOfferRow(offer, []));
  }
  const offerIds = ownedOffers.map((offer) => offer.id);
  const candidacyRows = await offerRepository.listCandidaciesByOfferIds(offerIds);
  const candidacyMap = new Map();
  candidacyRows.forEach((row) => {
    const list = candidacyMap.get(row.offer_id) || [];
    list.push(offerRepository.mapCandidacyRow(row));
    candidacyMap.set(row.offer_id, list);
  });

  return offers.map((offer) =>
    offerRepository.mapOfferRow(offer, candidacyMap.get(offer.id) || [])
  );
};

exports.addOffer = async (req, res) => {
  try {
    if (!isUuid(req.id)) {
      return res.status(401).send({ message: "Unauthorized!" });
    }

    const start = req.body.start || req.body.start_date;
    const end = req.body.end || req.body.end_date;

    const offer = await offerRepository.createOffer({
      title: req.body.title,
      type: req.body.type,
      start,
      end,
      content: req.body.content,
      companyId: req.id,
      createdAt: req.body.createdat || new Date(),
      docs: req.body.docs || [],
    });

    try {
      const students = await studentRepository.listIds();
      if (students.length > 0) {
        let companyName = "A company";
        const company = await companyRepository.findById(req.id);
        if (company?.name) {
          companyName = company.name;
        }

        await notificationRepository.createMany(
          students.map((studentId) => ({
            recipientType: "student",
            recipientId: studentId,
            title: "New Offer Published",
            message: `${companyName} published a new offer: "${offer.title}".`,
            type: "info",
          }))
        );
      }
    } catch (notifyError) {
      console.warn("Offer created but notifications failed:", notifyError.message || notifyError);
    }

    res.status(201).send({ message: "Offer added successfully!" });
  } catch (error) {
    console.error("[500]", req.method, req.originalUrl, error);
    res.status(500).send({ message: "Internal server error." });
  }
};

exports.getAll = async (req, res) => {
  try {
    const offers = await offerRepository.listOffers();
    const response = await buildOffersWithCandidacies(offers, req.id);
    res.status(200).send(response);
  } catch (err) {
    console.error("[500]", req.method, req.originalUrl, err);
    res.status(500).send({ message: "Internal server error." });
  }
};

exports.getByKey = async (req, res) => {
  try {
    const { property, key } = req.query;
    const column = pickAllowed(allowedSearchFields, property);
    if (!column || !key) {
      return res.status(400).send({ message: "Invalid search parameters." });
    }
    const offers = await offerRepository.searchByKey(column, key);
    const response = await buildOffersWithCandidacies(offers, req.id);
    res.status(200).send(response);
  } catch (err) {
    console.error("[500]", req.method, req.originalUrl, err);
    res.status(500).send({ message: "Internal server error." });
  }
};

exports.getCompanyOffers = async (req, res) => {
  try {
    const companyId = req.query.id || req.params.id;
    if (!companyId || !isUuid(companyId)) {
      return res.status(400).send({ message: "Invalid company id." });
    }
    const offers = await offerRepository.listOffersByCompany(companyId);
    const response = await buildOffersWithCandidacies(offers, req.id);
    res.status(200).send(response);
  } catch (err) {
    console.error("[500]", req.method, req.originalUrl, err);
    res.status(500).send({ message: "Internal server error." });
  }
};

exports.getCandidacies = async (req, res) => {
  try {
    const offerId = req.query.id;
    if (!offerId || !isUuid(offerId)) {
      return res.status(400).send({ message: "Invalid offer id." });
    }

    const offer = await offerRepository.findById(offerId);
    if (!offer) {
      return res.status(404).send({ message: "No Candidacies found." });
    }
    if (!isOfferOwner(offer, req.id)) {
      return res.status(403).send({ message: "Unauthorized offer access." });
    }

    const candidacies = await offerRepository.listCandidacies(offerId);
    const response = offerRepository.mapOfferRow(
      offer,
      candidacies.map(offerRepository.mapCandidacyRow)
    );
    res.status(200).send(response);
  } catch (err) {
    console.error("[500]", req.method, req.originalUrl, err);
    res.status(500).send({ message: "Internal server error." });
  }
};

exports.updateCandidacyStatus = async (req, res) => {
  const { offerId } = req.params;
  const { status, candidacyId, candidacyIndex } = req.body;

  if (!offerId || !isUuid(offerId)) {
    return res.status(400).send({ message: "Invalid offer id." });
  }
  if (!status || !["pending", "accepted", "rejected"].includes(status)) {
    return res.status(400).send({ message: "Invalid status." });
  }

  try {
    const offer = await offerRepository.findById(offerId);
    if (!offer) {
      return res.status(404).send({ message: "Offer not found." });
    }
    if (String(offer.company_id) !== String(req.id)) {
      return res.status(403).send({ message: "Unauthorized offer access." });
    }

    const candidacies = await offerRepository.listCandidacies(offerId);
    if (!candidacies.length) {
      return res.status(404).send({ message: "No candidacies found." });
    }

    let candidacy = null;
    if (candidacyId && isUuid(candidacyId)) {
      candidacy = candidacies.find((entry) => entry.id === candidacyId);
    } else if (
      Number.isInteger(candidacyIndex) &&
      candidacyIndex >= 0 &&
      candidacyIndex < candidacies.length
    ) {
      candidacy = candidacies[candidacyIndex];
    }

    if (!candidacy) {
      return res.status(404).send({ message: "Candidacy not found." });
    }

    const updated = await offerRepository.updateCandidacyStatus(candidacy.id, status);
    if (updated?.student_id) {
      await notificationRepository.createNotification({
        recipientType: "student",
        recipientId: updated.student_id,
        title: "Application Update",
        message: `Your application for \"${offer.title}\" was ${status}.`,
        type: status === "accepted" ? "success" : status === "rejected" ? "warning" : "info",
      });
    }

    return res.status(200).send({ message: "Candidacy updated." });
  } catch (err) {
    console.error("[500]", req.method, req.originalUrl, err);
    return res.status(500).send({ message: "Internal server error." });
  }
};

exports.getOfferById = async (req, res) => {
  try {
    if (!isUuid(req.params.id)) {
      return res.status(400).send({ message: "Invalid offer id." });
    }
    const offer = await offerRepository.findById(req.params.id);
    if (!offer) {
      return res.status(404).send({ message: "Offer not found." });
    }

    // Record view (best-effort, don't fail the request)
    try {
      await offerViewRepository.recordView(offer.id, req.id || null, req.cookies?.userType || "anonymous");
    } catch { /* ignore */ }

    const candidacies = isOfferOwner(offer, req.id)
      ? await offerRepository.listCandidacies(offer.id)
      : [];
    const response = offerRepository.mapOfferRow(
      offer,
      candidacies.map(offerRepository.mapCandidacyRow)
    );
    return res.status(200).send(response);
  } catch (err) {
    console.error("[500]", req.method, req.originalUrl, err);
    return res.status(500).send({ message: "Internal server error." });
  }
};

exports.updateOffer = async (req, res) => {
  const offerId = req.query.id || req.params.id;
  if (!offerId || !isUuid(offerId)) {
    return res.status(400).send({ message: "Invalid offer id." });
  }

  try {
    // Ownership check: an offer may only be modified by the company that owns
    // it. Without this any authenticated user could rewrite any offer by id.
    const existing = await offerRepository.findById(offerId);
    if (!existing) {
      return res.status(404).send({ message: "Offer not found." });
    }
    if (String(existing.company_id) !== String(req.id)) {
      return res.status(403).send({ message: "Unauthorized offer access." });
    }

    const updated = await offerRepository.updateOffer(offerId, {
      title: req.body.title,
      type: req.body.type,
      start: req.body.start || req.body.start_date,
      end: req.body.end || req.body.end_date,
      content: req.body.content,
      docs: req.body.docs,
    });
    if (!updated) {
      return res.status(404).send({ message: "Offer not found." });
    }
    return res.status(200).send({ message: "Offer updated" });
  } catch (err) {
    console.error(err);
    console.error("[500]", req.method, req.originalUrl, err);
    return res.status(500).send({ message: "Internal server error." });
  }
};

exports.deleteOffre = async (req, res) => {
  const offerId = req.query.id || req.params.id;
  if (!offerId || !isUuid(offerId)) {
    return res.status(400).send({ message: "Invalid offer id." });
  }
  try {
    // Ownership check: only the owning company may delete an offer.
    const existing = await offerRepository.findById(offerId);
    if (!existing) {
      return res.status(404).send({ message: "Offer not found." });
    }
    if (String(existing.company_id) !== String(req.id)) {
      return res.status(403).send({ message: "Unauthorized offer access." });
    }

    const deleted = await offerRepository.deleteOffer(offerId);
    if (!deleted) {
      return res.status(404).send({ message: "Offer not found." });
    }
    return res.status(200).send({ message: "Offer deleted" });
  } catch (error) {
    console.error(error);
    console.error("[500]", req.method, req.originalUrl, error);
    return res.status(500).send({ message: "Internal server error." });
  }
};
