const express = require("express");
const router = express.Router();
const controller = require("../controllers/document.controller");

router.get("/share/:token", controller.getSharedDocument);
router.post("/share/:token", controller.accessSharedDocument);

module.exports = router;
