const express = require("express");
const router = express.Router();
const rateLimit = require('express-rate-limit');

const { verifySignUp } = require("../middlewares");
const { authJwt } = require("../middlewares");
const { validation } = require("../middlewares");
const controller = require("../controllers/student.controller");
const notifications = require("../controllers/notification.controller");
const studentMap = require("../controllers/studentMap.controller");
const storage = require('../helpers/storage');
const savedoc = require('../helpers/savedoc');
const { verifyLimiter } = require("../middlewares/rateLimiters");

// Rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true,
});

//Register Student with validation
router.post("/signup", authLimiter, validation.sqlInjectionCheck, validation.validate(validation.schemas.studentSignup), verifySignUp.checkDuplicateEmail, controller.signup);
//Confirm Email with validation
router.post("/confirm", verifyLimiter, validation.sqlInjectionCheck, validation.validate(validation.schemas.emailVerification), controller.verifyUser);
router.post("/resend-confirmation", authLimiter, validation.sqlInjectionCheck, controller.resendVerificationCode);
//Login Student with validation
router.post("/login", authLimiter, validation.sqlInjectionCheck, validation.validate(validation.schemas.login), controller.signin);

//Get All Companies
router.get("/companies", authJwt.verifyToken, authJwt.isStudent, controller.getCompaniesForBrowse);
// Student network map (city-level, students only)
const mapGuard = [authJwt.verifyToken, authJwt.isStudent, validation.validate(validation.schemas.studentMapQuery, "query")];
router.get("/map/cells", ...mapGuard, studentMap.getCells);
router.get("/map/people", ...mapGuard, studentMap.getPeople);
router.get("/map/stats", ...mapGuard, studentMap.getStats);
//Search for Students by Property & Key
router.get("/search", authJwt.verifyToken, controller.getByKey);
//Student Notifications
router.get("/notifications", authJwt.verifyToken, authJwt.isStudent, notifications.getStudentNotifications);
router.get("/notifications/unread-count", authJwt.verifyToken, authJwt.isStudent, notifications.getStudentUnreadCount);
router.patch("/notifications/read-all", authJwt.verifyToken, authJwt.isStudent, notifications.markStudentReadAll);
router.patch("/notifications/:id/read", authJwt.verifyToken, authJwt.isStudent, notifications.markStudentRead);
router.delete("/notifications/:id", authJwt.verifyToken, authJwt.isStudent, notifications.deleteStudentNotification);
//SSE Notification stream
router.get("/notifications/subscribe", authJwt.verifyToken, authJwt.isStudent, notifications.subscribeStudent);
//Search for Students by multiple filters
router.get("/filter", authJwt.verifyToken, controller.getByFilters);
//Search for Students by Name using String Similarity
router.get("/find", authJwt.verifyToken, controller.getByName);
//Upload picture
router.post("/upload/:id", authJwt.verifyToken, authJwt.isStudent, storage, controller.updatePicture);
//Add folder
router.post('/folder', authJwt.verifyToken, authJwt.isStudent, controller.createFolder);
//Get documents
router.get('/documents', authJwt.verifyToken, authJwt.isStudent, controller.listDocuments);
//Upload document
router.post('/documents/upload', authJwt.verifyToken, authJwt.isStudent, savedoc, controller.uploadDocument);
//Create folder
router.post('/documents/folders', authJwt.verifyToken, authJwt.isStudent, controller.createDocumentFolder);
//Update document metadata
router.patch('/documents/:id', authJwt.verifyToken, authJwt.isStudent, controller.updateDocumentMeta);
router.patch('/documents/:id/pin', authJwt.verifyToken, authJwt.isStudent, controller.updateDocumentPin);
router.post('/documents/:id/open', authJwt.verifyToken, authJwt.isStudent, controller.markDocumentOpened);
//Delete document
router.delete('/documents/:id', authJwt.verifyToken, authJwt.isStudent, controller.deleteDocumentById);
//Versioning
router.post('/documents/:id/replace', authJwt.verifyToken, authJwt.isStudent, savedoc, controller.replaceDocumentFile);
router.get('/documents/:id/versions', authJwt.verifyToken, authJwt.isStudent, controller.listDocumentVersions);
router.get('/documents/:id/versions/:versionId/file', authJwt.verifyToken, authJwt.isStudent, controller.downloadDocumentVersion);
router.post('/documents/:id/versions/:versionId/restore', authJwt.verifyToken, authJwt.isStudent, controller.restoreDocumentVersion);
//Batch actions
router.post('/documents/batch-delete', authJwt.verifyToken, authJwt.isStudent, controller.batchDeleteDocuments);
router.post('/documents/batch-download', authJwt.verifyToken, authJwt.isStudent, controller.batchDownloadDocuments);
//Sharing
router.post('/documents/:id/share', authJwt.verifyToken, authJwt.isStudent, controller.shareDocument);
router.get('/documents/:id/shares', authJwt.verifyToken, authJwt.isStudent, controller.listDocumentShares);
router.patch('/documents/shares/:id/revoke', authJwt.verifyToken, authJwt.isStudent, controller.revokeDocumentShare);
router.get('/documents/shared', authJwt.verifyToken, authJwt.isStudent, controller.listSharedDocuments);
//Requests
router.get('/document-requests', authJwt.verifyToken, authJwt.isStudent, controller.listDocumentRequests);
router.patch('/document-requests/:id', authJwt.verifyToken, authJwt.isStudent, controller.updateDocumentRequestStatus);
//Get compnies info
router.post('/companiesinfo', authJwt.verifyToken, controller.companiesInfo);
// Add Candidacy
router.post('/apply/:id', authJwt.verifyToken, authJwt.isStudent, controller.apply);

//Get Student informations by ID with UUID validation
router.get("/:id", authJwt.verifyToken, validation.validate(validation.schemas.uuidParam, 'params'), controller.getStudentById);
//Update Student informations with validation
router.patch("/:id", authJwt.verifyToken, authJwt.isStudent, validation.validate(validation.schemas.uuidParam, 'params'), validation.sqlInjectionCheck, validation.validate(validation.schemas.updateStudent), controller.updateStudent);
//Delete Student from database with UUID validation
router.delete("/:id", authJwt.verifyToken, authJwt.isStudent, validation.validate(validation.schemas.uuidParam, 'params'), controller.deleteStudent);

module.exports = router;
