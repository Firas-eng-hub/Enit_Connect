const router = require("express").Router();
const controller = require("../controllers/companyStats.controller");
const { authJwt } = require("../middlewares");

router.get(
    "/overview",
    [authJwt.verifyToken, authJwt.isCompany],
    controller.getOverview
);

router.get(
    "/trends",
    [authJwt.verifyToken, authJwt.isCompany],
    controller.getTrends
);

router.get(
    "/conversions",
    [authJwt.verifyToken, authJwt.isCompany],
    controller.getConversions
);

router.get(
    "/demographics",
    [authJwt.verifyToken, authJwt.isCompany],
    controller.getDemographics
);

module.exports = router;
