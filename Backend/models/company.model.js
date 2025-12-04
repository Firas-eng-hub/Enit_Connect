const mongoose = require("mongoose");

const Company = mongoose.model(
    "Company",
    new mongoose.Schema({
        _id: mongoose.Schema.Types.ObjectId,
        status: { type: String, enum: ['Pending', 'Active'], default: 'Active' },
        confirmationCode: { type: String, unique: true },
        name: { type: String, required: true },
        email: { type: String, required: true },
        password: { type: String, required: true },
        website: { type: String, required: true },
        address: { type: String, required: true },
        city: { type: String, required: true },
        country: { type: String, required: true },
        phone: { type: String, required: true },
        about: { type: String },
        logo: { type: String },
        latitude: { type: String }, 
        longitude: { type: String } 
    })
);

module.exports = Company;