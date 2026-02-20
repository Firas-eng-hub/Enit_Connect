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
const partnerRepository = require("./partner.repository");
const messageRepository = require("./message.repository");
const mailRepository = require("./mail.repository");
const notificationRepository = require("./notification.repository");
const refreshTokenRepository = require("./refreshToken.repository");
const statsRepository = require("./stats.repository");
const matchingRepository = require("./matching.repository");
const offerViewRepository = require("./offerView.repository");
const savedSearchRepository = require("./savedSearch.repository");
const companyStatsRepository = require("./companyStats.repository");

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
  partnerRepository,
  messageRepository,
  mailRepository,
  notificationRepository,
  refreshTokenRepository,
  statsRepository,
  matchingRepository,
  offerViewRepository,
  savedSearchRepository,
  companyStatsRepository,
};
