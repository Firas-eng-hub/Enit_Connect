const mongoose = require("mongoose");
const Offer = mongoose.model(
    "Offer",
    new mongoose.Schema({
        _id: mongoose.Schema.Types.ObjectId,
        title: { type: String, required: true },
        type: { type: String, required: true },
        start: { type: String, required: true },
        end: { type: String },
        content: { type: String },
        companyid: { type: String },
        createdat: {type: String,},
        docs: {type: []},
        candidacies: {type: []},
    })
);

module.exports = Offer;