const mongoose = require("mongoose");

const Post = mongoose.model(
    "Post",
    new mongoose.Schema({
        _id: mongoose.Schema.Types.ObjectId,
        topic : { type: String, required: true },
        title: { type: String, required: true },
        description: { type: String, required: true },
        body: { type: String, required: true},
        date: { type: String, required: true },
        userName: { type: String, required: true },
    })
);

module.exports = Post;