const adminRepository = require("./admin.repository");
const studentRepository = require("./student.repository");
const companyRepository = require("./company.repository");
const offerRepository = require("./offer.repository");
const documentRepository = require("./document.repository");
const postRepository = require("./post.repository");
const newsRepository = require("./news.repository");
const messageRepository = require("./message.repository");
const notificationRepository = require("./notification.repository");
const refreshTokenRepository = require("./refreshToken.repository");

module.exports = {
  adminRepository,
  studentRepository,
  companyRepository,
  offerRepository,
  documentRepository,
  postRepository,
  newsRepository,
  messageRepository,
  notificationRepository,
  refreshTokenRepository,
};
