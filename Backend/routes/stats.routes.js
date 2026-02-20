const router = require("express").Router();
const controller = require("../controllers/stats.controller");
const { authJwt } = require("../middlewares");

router.get(
    "/overview",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.getOverview
);

router.get(
    "/trends",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.getTrends
);

module.exports = router;
