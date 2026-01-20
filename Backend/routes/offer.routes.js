const express = require("express");
const router = express.Router();

const { authJwt } = require("../middlewares");
const { offer } = require("../controllers");

//Get All Offers
router.get("/", authJwt.verifyToken, offer.getAll);
//Get All Offers of a company
router.get("/myoffers", authJwt.verifyToken, offer.getCompanyOffers);
//Get All candidacies of an offer
router.get("/candidacies", authJwt.verifyToken, offer.getCandidacies);
//Update candidacy status
router.patch("/candidacies/:offerId", authJwt.verifyToken, authJwt.isCompany, offer.updateCandidacyStatus);
//Search for Offers by Property & Key
router.get("/search", authJwt.verifyToken, offer.getByKey);
//Add Offer to Company
router.post("/", authJwt.verifyToken, authJwt.isCompany, offer.addOffer);
//Get Offer by ID
router.get("/:id", authJwt.verifyToken, offer.getOfferById);
//Edit Offer of Company
router.patch("/", authJwt.verifyToken, offer.updateOffer);
//Delete Offer of Company
router.delete("/", authJwt.verifyToken, offer.deleteOffre);
router.delete("/:id", authJwt.verifyToken, offer.deleteOffre);

module.exports = router;
