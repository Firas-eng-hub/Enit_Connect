const express = require("express");
const router = express.Router();
const rateLimit = require('express-rate-limit');

const { authJwt } = require("../middlewares");
const controller = require("../controllers/admin.controller");
const notifications = require("../controllers/notification.controller");
const savedoc = require('../helpers/savedoc');
const newsdoc = require('../helpers/newsdoc');

// Rate limiter for admin authentication (stricter)
const adminAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3, // Only 3 attempts for admin
  message: 'Too many admin login attempts, please try again later.',
  skipSuccessfulRequests: true,
});

//Login Admin
router.post("/", adminAuthLimiter, controller.signin);
router.post("/login", adminAuthLimiter, controller.signin);
//Get All Students
router.get("/allstudents", authJwt.verifyToken, controller.getAllStudents);
//Get All Companies
router.get("/allcompanies", authJwt.verifyToken, controller.getAllCompanies);
//Get Students by key
router.get("/search/student", authJwt.verifyToken, controller.getStudentsByKey);
//Get Companies by key
router.get("/search/company", authJwt.verifyToken, controller.getCompaniesByKey);
//Admin Notifications
router.get("/notifications", authJwt.verifyToken, authJwt.isAdmin, notifications.getAdminNotifications);
router.get("/notifications/unread-count", authJwt.verifyToken, authJwt.isAdmin, notifications.getAdminUnreadCount);
router.patch("/notifications/read-all", authJwt.verifyToken, authJwt.isAdmin, notifications.markAdminReadAll);
router.patch("/notifications/:id/read", authJwt.verifyToken, authJwt.isAdmin, notifications.markAdminRead);
router.delete("/notifications/:id", authJwt.verifyToken, authJwt.isAdmin, notifications.deleteAdminNotification);
//Send Email
router.post("/contact", authJwt.verifyToken, controller.sendEmail);
//Delete Students from database
router.post("/student/delete", authJwt.verifyToken, authJwt.isAdmin, controller.deleteStudents);
//Delete Companies from database
router.post("/company/delete", authJwt.verifyToken, authJwt.isAdmin, controller.deleteCompanies);
//Get Student informations by ID
router.get("/student/:id", authJwt.verifyToken, controller.getStudentById);
//Add Students
router.post("/student/add", authJwt.verifyToken, authJwt.isAdmin, controller.addStudents);
//Add Companies
router.post("/company/add", authJwt.verifyToken, authJwt.isAdmin, controller.addCompany);
//Update Student informations
router.patch("/student/:id", authJwt.verifyToken, authJwt.isAdmin, controller.updateStudent);
//Delete Student from database
router.delete("/student/:id", authJwt.verifyToken, authJwt.isAdmin, controller.deleteStudent);
//Get Company informations by ID
router.get("/company/:id", authJwt.verifyToken, controller.getCompanyById);
//Edit Company informations
router.patch("/company/:id", authJwt.verifyToken, authJwt.isAdmin, controller.updateCompany);
//Delete Company from database
router.delete("/company/:id", authJwt.verifyToken, authJwt.isAdmin, controller.deleteCompany);
//Add folder
router.post('/folder', authJwt.verifyToken, authJwt.isAdmin, controller.createFolder);
//Add file
router.post('/file', savedoc, controller.createFile);
//Get documents
router.post('/documents', authJwt.verifyToken, controller.getDocuments);
//Delete document
router.post('/deldoc', authJwt.verifyToken, controller.deleteDocument);
//Search for document
router.post('/searchdoc', authJwt.verifyToken, controller.searchDocument);
//Receive message
router.post('/message', controller.saveMessage);
//Get messages
router.get('/message', authJwt.verifyToken, authJwt.isAdmin, controller.getMessage);
//Mark message read/unread
router.patch('/message/:id/read', authJwt.verifyToken, authJwt.isAdmin, controller.markMessageRead);
//Archive/unarchive message
router.patch('/message/:id/archive', authJwt.verifyToken, authJwt.isAdmin, controller.archiveMessage);
//Bulk update messages
router.patch('/message/bulk', authJwt.verifyToken, authJwt.isAdmin, controller.bulkUpdateMessages);
//Mark all as read/unread
router.patch('/message/read-all', authJwt.verifyToken, authJwt.isAdmin, controller.markAllMessagesRead);
router.patch('/message/unread-all', authJwt.verifyToken, authJwt.isAdmin, controller.markAllMessagesUnread);
//Get number of unread messages
router.get('/nbmessage', authJwt.verifyToken, controller.getNbMessage);
//Delete message
router.delete('/message/:id', authJwt.verifyToken, authJwt.isAdmin, controller.deleteMessage);
//Delete news
router.delete('/news/:id', authJwt.verifyToken, controller.deleteNews);
//Add news
router.post('/news', authJwt.verifyToken, authJwt.isAdmin, controller.addNews);
//Update news
router.patch('/news/:id', authJwt.verifyToken, authJwt.isAdmin, controller.updateNews);
//Save docs for news
router.post('/newsdoc', newsdoc, controller.newsDoc);
//Get news
router.get('/news', controller.getNews);


module.exports = router;
