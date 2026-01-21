const adminRepository = require("./admin.repository");
const studentRepository = require("./student.repository");
const companyRepository = require("./company.repository");
const offerRepository = require("./offer.repository");
const documentRepository = require("./document.repository");
const documentAccessRepository = require("./documentAccess.repository");
const documentShareRepository = require("./documentShare.repository");
const documentRequestRepository = require("./documentRequest.repository");
const documentVersionRepository = require("./documentVersion.repository");
const documentAuditRepository = require("./documentAudit.repository");
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
  documentAccessRepository,
  documentShareRepository,
  documentRequestRepository,
  documentVersionRepository,
  documentAuditRepository,
  postRepository,
  newsRepository,
  messageRepository,
  notificationRepository,
  refreshTokenRepository,
};
