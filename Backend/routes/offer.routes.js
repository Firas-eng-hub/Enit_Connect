const express = require("express");
const router = express.Router();

const { authJwt } = require("../middlewares");
const { validation } = require("../middlewares");
const { offer } = require("../controllers");

//Get All Offers
router.get("/", authJwt.verifyToken, offer.getAll);
//Get All Offers of a company
router.get("/myoffers", authJwt.verifyToken, offer.getCompanyOffers);
//Get All candidacies of an offer
router.get("/candidacies", authJwt.verifyToken, offer.getCandidacies);
//Update candidacy status with UUID validation
router.patch("/candidacies/:offerId", authJwt.verifyToken, authJwt.isCompany, validation.validate(validation.schemas.uuidParam, 'params'), offer.updateCandidacyStatus);
//Search for Offers by Property & Key
router.get("/search", authJwt.verifyToken, offer.getByKey);
//Add Offer to Company with validation
router.post("/", authJwt.verifyToken, authJwt.isCompany, validation.sqlInjectionCheck, validation.validate(validation.schemas.createOffer), offer.addOffer);
//Get Offer by ID with UUID validation
router.get("/:id", authJwt.verifyToken, validation.validate(validation.schemas.uuidParam, 'params'), offer.getOfferById);
//Edit Offer of Company with validation
router.patch("/", authJwt.verifyToken, validation.sqlInjectionCheck, validation.validate(validation.schemas.updateOffer), offer.updateOffer);
//Delete Offer of Company with UUID validation
router.delete("/", authJwt.verifyToken, offer.deleteOffre);
router.delete("/:id", authJwt.verifyToken, validation.validate(validation.schemas.uuidParam, 'params'), offer.deleteOffre);

module.exports = router;
