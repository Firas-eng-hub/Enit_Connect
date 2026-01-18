const mongoose = require("mongoose");

const New = mongoose.model(
    "New",
    new mongoose.Schema({
        _id: mongoose.Schema.Types.ObjectId,
        date : { type: String, required: true },
        title: { type: String, required: true },
        content: { type: String, required: true },
        picture: { type: String, required: false },
        docs: { type: [] , required: false },
        status: { type: String, enum: ['draft', 'published'], default: 'published' },
        audience: { type: [String], default: ['visitor', 'student', 'company'] },
        category: { type: String },
        tags: { type: [String], default: [] }
    })
);

module.exports = New;
