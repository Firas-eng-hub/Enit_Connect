const express = require("express");
const rateLimit = require("express-rate-limit");

const { authJwt, validation } = require("../middlewares");
const controller = require("../controllers/mail.controller");

const router = express.Router();

const composeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: "Too many messages sent. Please try again later.",
  skipSuccessfulRequests: false,
});

router.get(
  "/folders/:folder",
  authJwt.verifyToken,
  validation.validate(validation.schemas.mailFolderParams, "params"),
  validation.validate(validation.schemas.mailFolderQuery, "query"),
  controller.listFolder
);

router.get(
  "/recipients",
  authJwt.verifyToken,
  validation.validate(validation.schemas.mailRecipientsQuery, "query"),
  controller.searchRecipients
);

router.post(
  "/compose",
  authJwt.verifyToken,
  composeLimiter,
  validation.validate(validation.schemas.mailCompose),
  controller.compose
);

router.post(
  "/drafts",
  authJwt.verifyToken,
  validation.validate(validation.schemas.mailDraft),
  controller.saveDraft
);

router.post(
  "/admin/moderation/lock-user",
  authJwt.verifyToken,
  authJwt.isAdmin,
  validation.validate(validation.schemas.mailLock),
  controller.lockUserMessaging
);

router.post(
  "/admin/moderation/unlock-user",
  authJwt.verifyToken,
  authJwt.isAdmin,
  validation.validate(validation.schemas.mailLock),
  controller.unlockUserMessaging
);

router.delete(
  "/admin/messages/:messageId",
  authJwt.verifyToken,
  authJwt.isAdmin,
  validation.validate(validation.schemas.mailMessageParams, "params"),
  controller.hardDeleteMessage
);

router.get(
  "/:itemId",
  authJwt.verifyToken,
  validation.validate(validation.schemas.mailItemParams, "params"),
  controller.getItem
);

router.patch(
  "/:itemId",
  authJwt.verifyToken,
  validation.validate(validation.schemas.mailItemParams, "params"),
  validation.validate(validation.schemas.mailPatch),
  controller.updateItem
);

router.delete(
  "/:itemId",
  authJwt.verifyToken,
  validation.validate(validation.schemas.mailItemParams, "params"),
  controller.deleteItem
);

module.exports = router;
