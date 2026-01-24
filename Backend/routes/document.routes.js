const express = require("express");
const router = express.Router();
const controller = require("../controllers/document.controller");
const { authJwt } = require("../middlewares");

// Shared links require an authenticated user (enforced by constitution + feature spec).
router.get("/share/:token", authJwt.verifyToken, controller.getSharedDocument);
router.post("/share/:token", authJwt.verifyToken, controller.accessSharedDocument);

module.exports = router;
