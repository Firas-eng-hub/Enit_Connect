const mongoose = require("mongoose");

const Document = mongoose.model(
    "Document",
    new mongoose.Schema({
        _id: mongoose.Schema.Types.ObjectId,
        idcreator : { type: String, required: true },
        namecreator : { type: String, required: true },
        date : { type: String, required: true },
        title: { type: String, required: true },
        type: { type: String, required: true },
        link: { type: String, required: false},
        emplacement: { type: String , required: true },
        extension : {type: String, required: false},
        size : {type: String, required: false}
    })
);

module.exports = Document;