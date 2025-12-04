const mongoose = require("mongoose");

const Admin = mongoose.model(
    "Admin",
    new mongoose.Schema({
        _id: mongoose.Schema.Types.ObjectId,
        email: { type: String, required: true },
        password: { type: String, required: true },
    })
);

module.exports = Admin;