const express = require("express");
const router = express.Router();
const rateLimit = require('express-rate-limit');

const { verifySignUp } = require("../middlewares");
const { authJwt } = require("../middlewares");
const { company, offer } = require("../controllers");

// Rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true,
});

//Register Company
router.post("/signup", authLimiter, verifySignUp.checkDuplicateCompany, company.signup);
//Confirm Email
router.get("/confirm/:confirmationCode", company.verifyCompany);
//Login Company
router.post("/login", authLimiter, company.signin);
//Get Companies Locations
router.get("/location", authJwt.verifyToken, company.getCompanyLocations);
//Search for Companies with Property and Key
router.get("/search", authJwt.verifyToken, company.getByKey);
//Search for Companies by Name using String Similarity
router.get("/find", authJwt.verifyToken, company.getByName);
//Get Company informations by ID
router.get("/info", authJwt.verifyToken, company.getCompanyById);
//Edit Company informations
router.patch("/update", authJwt.verifyToken, authJwt.isCompany, company.updateCompany);
//Delete Company from database
router.delete("/:id", authJwt.verifyToken, authJwt.isCompany, company.deleteCompany);
//Get Company's Offers
router.get("/:id/offers", authJwt.verifyToken, offer.getCompanyOffers);
//Get User info
router.get("/user/:id", authJwt.verifyToken, company.getUserInfo);

module.exports = router;