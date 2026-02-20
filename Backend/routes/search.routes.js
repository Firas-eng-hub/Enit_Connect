const router = require("express").Router();
const controller = require("../controllers/search.controller");
const { authJwt } = require("../middlewares");

// Advanced offer search
router.get(
    "/offers/advanced",
    [authJwt.verifyToken],
    controller.searchAdvanced
);

// Saved searches CRUD
router.get(
    "/saved",
    [authJwt.verifyToken],
    controller.listSavedSearches
);

router.post(
    "/saved",
    [authJwt.verifyToken],
    controller.createSavedSearch
);

router.patch(
    "/saved/:id",
    [authJwt.verifyToken],
    controller.updateSavedSearch
);

router.delete(
    "/saved/:id",
    [authJwt.verifyToken],
    controller.deleteSavedSearch
);

module.exports = router;
