const mongoose = require("mongoose");

const Student = mongoose.model(
    "Student",
    new mongoose.Schema({
        _id: mongoose.Schema.Types.ObjectId,
        firstname: { type: String, required: true },
        lastname: { type: String, required: true },
        email: { type: String, required: true },
        password: { type: String, required: true },
        status: { type: String, enum: ['Pending', 'Active'], default: 'Pending' },
        confirmationCode: { type: String, unique: true },
        country: { type: String },
        city: { type: String },
        address: { type: String },
        phone: { type: String },
        type: { type: String, required: true },
        workAt: { type: String },
        class: { type: String },
        promotion: { type: String },
        linkedin: { type: String },
        picture: { type: String },
        aboutme: { type: String },
        latitude: { type: String },
        longitude: { type: String }
    })
);

module.exports = Student;