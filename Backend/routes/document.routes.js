const express = require("express");
const router = express.Router();
const controller = require("../controllers/document.controller");
const { authJwt } = require("../middlewares");

// Shared links support public access (no auth required) or restricted access (students/companies only)
router.get("/share/:token", authJwt.verifyTokenOptional, controller.getSharedDocument);
router.post("/share/:token", authJwt.verifyTokenOptional, controller.accessSharedDocument);

module.exports = router;
