const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const db = {};

db.mongoose = mongoose;

db.admin = require("./admin.model");
db.student = require("./student.model");
db.company = require("./company.model");
db.offer = require("./offer.model");
db.document = require("./document.model");
db.message = require('./message.model');
db.new = require('./new.model');
db.post = require('./post.model');
db.refreshToken = require('./refreshToken.model');

module.exports = db;