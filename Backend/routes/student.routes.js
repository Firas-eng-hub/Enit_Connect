const express = require("express");
const router = express.Router();

const { verifySignUp } = require("../middlewares");
const { authJwt } = require("../middlewares");
const controller = require("../controllers/student.controller");
const company = require("../controllers/company.controller");
const storage = require('../helpers/storage');
const savedoc = require('../helpers/savedoc');

// Get posts
router.get("/posts", controller.getPosts);
// Add Post
router.post('/posts',controller.addPost);
//Register Student
router.post("/signup", verifySignUp.checkDuplicateEmail, controller.signup);
//Confirm Email
router.get("/confirm/:confirmationCode", controller.verifyUser);
//Login Student
router.post("/login", controller.signin);
//Get All Student
router.get("/all", controller.getAll);

//Get All Companies
router.get("/companies", authJwt.verifyToken, company.getAllCompanies);
//Get Student's Locations
router.get("/location", authJwt.verifyToken, controller.getStudentLocations);
//Search for Students by Property & Key
router.get("/search", authJwt.verifyToken, controller.getByKey);
//Search for Students by Name using String Similarity
router.get("/find", authJwt.verifyToken, controller.getByName);
//Get Student informations by ID
router.get("/:id", authJwt.verifyToken, controller.getStudentById);
//Update Student informations
router.patch("/:id", authJwt.verifyToken, authJwt.isStudent, controller.updateStudent);
//Delete Student from database
router.delete("/:id", authJwt.verifyToken, authJwt.isStudent, controller.deleteStudent);
//Upload picture
router.post("/upload/:id",  authJwt.verifyToken, authJwt.isStudent,storage, controller.updatePicture);
//Add folder
router.post('/folder',authJwt.verifyToken, authJwt.isStudent, controller.createFolder);
//Add file
router.post('/file', savedoc, controller.createFile);
//Get documents
router.post('/documents',authJwt.verifyToken, controller.getDocuments);
//Delete document
router.post('/deldoc', authJwt.verifyToken, controller.deleteDocument);
//Search for document
router.post('/searchdoc', authJwt.verifyToken, controller.searchDocument);
//Get compnies info
router.post('/companiesinfo', authJwt.verifyToken, controller.companiesInfo);
// Add Candidacy
router.post('/apply/:id', authJwt.verifyToken, controller.apply);

module.exports = router;



