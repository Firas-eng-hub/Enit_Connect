const {
    offerRepository,
    savedSearchRepository,
} = require("../repositories");
const { isUuid } = require("../utils/validation");

exports.searchAdvanced = async (req, res) => {
    try {
        const filters = {
            q: req.query.q || null,
            type: req.query.type || null,
            companyId: req.query.companyId || null,
            dateFrom: req.query.dateFrom || null,
            dateTo: req.query.dateTo || null,
            active: req.query.active === "true",
            sort: req.query.sort || "date",
            limit: req.query.limit,
            offset: req.query.offset,
        };

        // Support multi-type via comma-separated values
        if (filters.type && filters.type.includes(",")) {
            filters.type = filters.type.split(",").map((t) => t.trim());
        }

        const { rows, totalCount } = await offerRepository.searchAdvanced(filters);
        const offers = rows.map((row) => offerRepository.mapOfferRow(row));

        res.status(200).send({
            offers,
            totalCount,
            limit: Number(filters.limit) || 20,
            offset: Number(filters.offset) || 0,
        });
    } catch (err) {
        res.status(500).send({ message: err.message || err });
    }
};

// Determine user type from request context
const getUserType = (req) => {
    // Check if user type is available from the auth middleware or cookies
    return req.cookies?.userType || "student";
};

exports.listSavedSearches = async (req, res) => {
    try {
        const userType = getUserType(req);
        const searches = await savedSearchRepository.listByUser(req.id, userType);
        res.status(200).send(searches);
    } catch (err) {
        res.status(500).send({ message: err.message || err });
    }
};

exports.createSavedSearch = async (req, res) => {
    try {
        if (!req.body.name) {
            return res.status(400).send({ message: "Search name is required." });
        }
        const userType = getUserType(req);
        const saved = await savedSearchRepository.create({
            userId: req.id,
            userType,
            name: req.body.name,
            filters: req.body.filters || {},
            notify: req.body.notify || false,
        });
        res.status(201).send(saved);
    } catch (err) {
        res.status(500).send({ message: err.message || err });
    }
};

exports.updateSavedSearch = async (req, res) => {
    try {
        if (!isUuid(req.params.id)) {
            return res.status(400).send({ message: "Invalid search id." });
        }
        const updated = await savedSearchRepository.update(req.params.id, req.id, {
            name: req.body.name,
            filters: req.body.filters,
            notify: req.body.notify,
        });
        if (!updated) {
            return res.status(404).send({ message: "Saved search not found." });
        }
        res.status(200).send(updated);
    } catch (err) {
        res.status(500).send({ message: err.message || err });
    }
};

exports.deleteSavedSearch = async (req, res) => {
    try {
        if (!isUuid(req.params.id)) {
            return res.status(400).send({ message: "Invalid search id." });
        }
        const deleted = await savedSearchRepository.deleteById(req.params.id, req.id);
        if (!deleted) {
            return res.status(404).send({ message: "Saved search not found." });
        }
        res.status(200).send({ message: "Search deleted." });
    } catch (err) {
        res.status(500).send({ message: err.message || err });
    }
};
