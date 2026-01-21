const express = require("express");
const router = express.Router();
const rateLimit = require('express-rate-limit');

const { verifySignUp } = require("../middlewares");
const { authJwt } = require("../middlewares");
const controller = require("../controllers/student.controller");
const company = require("../controllers/company.controller");
const notifications = require("../controllers/notification.controller");
const storage = require('../helpers/storage');
const savedoc = require('../helpers/savedoc');

// Rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true,
});

// Get posts
router.get("/posts", controller.getPosts);
// Add Post
router.post('/posts',controller.addPost);
//Register Student
router.post("/signup", authLimiter, verifySignUp.checkDuplicateEmail, controller.signup);
//Confirm Email
router.post("/confirm", controller.verifyUser);
router.post("/resend-confirmation", authLimiter, controller.resendVerificationCode);
//Login Student
router.post("/login", authLimiter, controller.signin);
//Get All Student
router.get("/all", controller.getAll);

//Get All Companies
router.get("/companies", authJwt.verifyToken, company.getAllCompanies);
//Get Student's Locations
router.get("/location", authJwt.verifyToken, controller.getStudentLocations);
//Search for Students by Property & Key
router.get("/search", authJwt.verifyToken, controller.getByKey);
//Student Notifications
router.get("/notifications", authJwt.verifyToken, authJwt.isStudent, notifications.getStudentNotifications);
router.get("/notifications/unread-count", authJwt.verifyToken, authJwt.isStudent, notifications.getStudentUnreadCount);
router.patch("/notifications/read-all", authJwt.verifyToken, authJwt.isStudent, notifications.markStudentReadAll);
router.patch("/notifications/:id/read", authJwt.verifyToken, authJwt.isStudent, notifications.markStudentRead);
router.delete("/notifications/:id", authJwt.verifyToken, authJwt.isStudent, notifications.deleteStudentNotification);
//Search for Students by multiple filters
router.get("/filter", authJwt.verifyToken, controller.getByFilters);
//Search for Students by Name using String Similarity
router.get("/find", authJwt.verifyToken, controller.getByName);
//Upload picture
router.post("/upload/:id",  authJwt.verifyToken, authJwt.isStudent,storage, controller.updatePicture);
//Add folder
router.post('/folder',authJwt.verifyToken, authJwt.isStudent, controller.createFolder);
//Add file
router.post('/file', savedoc, controller.createFile);
//Get documents
router.get('/documents', authJwt.verifyToken, authJwt.isStudent, controller.listDocuments);
router.post('/documents', authJwt.verifyToken, controller.getDocuments);
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
//Delete document
router.post('/deldoc', authJwt.verifyToken, controller.deleteDocument);
//Search for document
router.post('/searchdoc', authJwt.verifyToken, controller.searchDocument);
//Get compnies info
router.post('/companiesinfo', authJwt.verifyToken, controller.companiesInfo);
// Add Candidacy
router.post('/apply/:id', authJwt.verifyToken, controller.apply);

//Get Student informations by ID
router.get("/:id", authJwt.verifyToken, controller.getStudentById);
//Update Student informations
router.patch("/:id", authJwt.verifyToken, authJwt.isStudent, controller.updateStudent);
//Delete Student from database
router.delete("/:id", authJwt.verifyToken, authJwt.isStudent, controller.deleteStudent);

module.exports = router;
