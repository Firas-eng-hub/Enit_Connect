const express = require("express");
const router = express.Router();
const rateLimit = require('express-rate-limit');

const { verifySignUp } = require("../middlewares");
const { authJwt } = require("../middlewares");
const { validation } = require("../middlewares");
const { company, offer } = require("../controllers");
const notifications = require("../controllers/notification.controller");
const storage = require('../helpers/storage');

// Rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true,
});

//Register Company with validation
router.post("/signup", authLimiter, validation.sqlInjectionCheck, validation.validate(validation.schemas.companySignup), verifySignUp.checkDuplicateCompany, company.signup);
//Confirm Email with validation
router.post("/confirm", validation.sqlInjectionCheck, validation.validate(validation.schemas.emailVerification), company.verifyCompany);
router.post("/resend-confirmation", authLimiter, validation.sqlInjectionCheck, company.resendVerificationCode);
//Login Company with validation
router.post("/login", authLimiter, validation.sqlInjectionCheck, validation.validate(validation.schemas.login), company.signin);
//Get Companies Locations
router.get("/location", authJwt.verifyToken, company.getCompanyLocations);
//Search for Companies with Property and Key
router.get("/search", authJwt.verifyToken, company.getByKey);
//Search for Companies by Name using String Similarity
router.get("/find", authJwt.verifyToken, company.getByName);
//Company Notifications
router.get("/notifications", authJwt.verifyToken, authJwt.isCompany, notifications.getCompanyNotifications);
router.get("/notifications/unread-count", authJwt.verifyToken, authJwt.isCompany, notifications.getCompanyUnreadCount);
router.patch("/notifications/read-all", authJwt.verifyToken, authJwt.isCompany, notifications.markCompanyReadAll);
router.patch("/notifications/:id/read", authJwt.verifyToken, authJwt.isCompany, notifications.markCompanyRead);
router.delete("/notifications/:id", authJwt.verifyToken, authJwt.isCompany, notifications.deleteCompanyNotification);
//SSE Notification stream
router.get("/notifications/subscribe", authJwt.verifyToken, authJwt.isCompany, notifications.subscribeCompany);
//Get Company informations by ID
router.get("/info", authJwt.verifyToken, company.getCompanyById);
//Edit Company informations with validation
router.patch("/update", authJwt.verifyToken, authJwt.isCompany, validation.sqlInjectionCheck, validation.validate(validation.schemas.updateCompany), company.updateCompany);
//Upload logo with UUID validation
router.post("/upload/:id", authJwt.verifyToken, authJwt.isCompany, validation.validate(validation.schemas.uuidParam, 'params'), storage, company.updateLogo);
//Delete Company from database with UUID validation
router.delete("/:id", authJwt.verifyToken, authJwt.isCompany, validation.validate(validation.schemas.uuidParam, 'params'), company.deleteCompany);
//Get Company's Offers with UUID validation
router.get("/:id/offers", authJwt.verifyToken, validation.validate(validation.schemas.uuidParam, 'params'), offer.getCompanyOffers);
//Get User info with UUID validation
router.get("/user/:id", authJwt.verifyToken, validation.validate(validation.schemas.uuidParam, 'params'), company.getUserInfo);
//Shared documents
router.get("/documents/shared", authJwt.verifyToken, authJwt.isCompany, company.listSharedDocuments);
//Document requests
router.post("/document-requests", authJwt.verifyToken, authJwt.isCompany, company.createDocumentRequest);
router.get("/document-requests", authJwt.verifyToken, authJwt.isCompany, company.listDocumentRequests);

module.exports = router;
