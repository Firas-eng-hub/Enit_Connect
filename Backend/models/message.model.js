const mongoose = require("mongoose");
const Message = mongoose.model(
    "Message",
    new mongoose.Schema({
        _id: mongoose.Schema.Types.ObjectId,
        name: { type: String, required: true },
        email: { type: String, required: true },
        message: { type: String, required: true },
        date: {type: String,},
        lu : {type: Boolean}
    })
);

module.exports = Message;