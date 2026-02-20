const router = require("express").Router();
const controller = require("../controllers/matching.controller");
const { authJwt } = require("../middlewares");

router.get(
    "/recommendations",
    [authJwt.verifyToken, authJwt.isStudent],
    controller.getRecommendations
);

module.exports = router;
