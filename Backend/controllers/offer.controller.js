const db = require("../models");
const capitalize = require('capitalize');
const Offer = db.offer;
const Company = db.company;

exports.addOffer = (req, res) => {
    const offer = new Offer({
        _id: new db.mongoose.Types.ObjectId(),
        title: req.body.title,
        type: req.body.type,
        start: req.body.start,
        end: req.body.end,
        content: req.body.content,
        companyid: req.body.companyid,
        createdat: req.body.createdat,
        docs: req.body.docs,
        candidacies: [],
    });

    offer.save()
        .then(savedOffer => {
            res.status(201).send({ message: "Offer added successfully!" });
        })
        .catch(error => {
            res.status(500).send({ message: error.message || error });
        });
};

exports.getAll = (req, res) => {
    Offer.find().exec()
        .then(docs => {
            if (!docs) {
                return res.status(404).send({ message: "No Offers found." });
            }
            const response = [];
            docs.forEach((doc) => {
                response.push({
                    title: doc.title,
                    type: doc.type,
                    start: doc.start,
                    end: doc.end,
                    docs: doc.docs,
                    content: doc.content,
                    companyid: doc.companyid,
                    createdat: doc.createdat,
                    id: doc._id,
                    candidacies: doc.candidacies
                });
            });
            return res.status(200).send(response);
        }).catch(err => {
            return res.status(500).send({ message: err });
        });
};

exports.getByKey = (req, res, next) => {
    Offer.find({ [req.query.property]: { $regex: new RegExp("^" + req.query.key, "i") } }).exec()
        .then(docs => {
            const response = [];
            docs.forEach((doc) => {
                response.push({
                    title: doc.title,
                    type: doc.type,
                    start: doc.start,
                    end: doc.end,
                    docs: doc.docs,
                    content: doc.content,
                    companyid: doc.companyid,
                    createdat: doc.createdat,
                    id: doc._id,
                    candidacies: doc.candidacies
                });
            });
            if (docs.length >= 0) {
                res.status(200).send(response);
            } else {
                res.status(404).send({ message: 'No entries found' });
            }

        }).catch(err => {
            res.status(500).send({ message: err });
        });
};

exports.getCompanyOffers = (req, res) => {
    Offer.find({ companyid: req.query.id })
        .exec()
        .then(docs => {
            if (!docs) {
                return res.status(404).send({ message: "No Offers found." });
            }
            const response = [];
            docs.forEach((doc) => {
                response.push({
                    id: doc._id,
                    title: doc.title,
                    type: doc.type,
                    start: doc.start,
                    end: doc.end,
                    docs: doc.docs,
                    content: doc.content,
                    companyid: doc.companyid,
                    createdat: doc.createdat,
                    candidacies: doc.candidacies
                });
            });
            return res.status(200).send(response);
        }).catch(err => {
            return res.status(500).send({ message: err });
        });
};

exports.getCandidacies = (req, res) => {
    const offerId = req.query.id;
    if (!offerId || !db.mongoose.Types.ObjectId.isValid(offerId)) {
        return res.status(400).send({ message: "Invalid offer id." });
    }

    Offer.findById({ _id: offerId })
        .then(docs => {
            if (!docs) {
                return res.status(404).send({ message: "No Candidacies found." });
            }
            return res.status(200).send(docs);
        }).catch(err => {
            return res.status(500).send({ message: err.message || err });
        });
};

exports.getOfferById = (req, res) => {
    Offer.findById({ _id: req.params.id })
        .then((offer) => {
            if (!offer) {
                return res.status(404).send({ message: "Offer not found." });
            }
            return res.status(200).send({
                title: offer.title,
                type: offer.type,
                start: doc.start,
                end: doc.end,
                docs: doc.docs,
                content: offer.content,
                companyid: offer.companyid,
                createdat: offer.createdat,
                id: doc._id,
                candidacies: doc.candidacies
            });
        }).catch(err => {
            return res.status(500).send({ message: "error" + err });
        });
};

exports.updateOffer = (req, res) => {
    const newData = new Offer();

    newData.title = req.body.title;
    newData.type = req.body.type;
    newData.start = req.body.start;
    newData.end = req.body.end;
    newData.content = req.body.content;



    Offer.updateOne({ _id: req.query.id }, newData).then(() => {
        return res.status(200).send({ message: "Offer updated" });
    }).catch(err => {
        console.error(err);
        return res.status(500).send({ message: err });
    });

};

exports.deleteOffre = (req, res) => {
    Offer.deleteOne({
        _id: req.query.id
    }).exec()
        .then(() => {
            return res.status(200).send({ message: "Offer deleted" });
        })
        .catch(error => {
            console.error(error);
            return res.status(500).send({ message: error });
        });

};


