const {
  mailRepository,
  adminRepository,
  studentRepository,
  companyRepository,
  notificationRepository,
  documentRepository,
} = require("../repositories");
const { isUuid } = require("../utils/validation");
const { notifyNewMessage } = require("../utils/mail-notifier");

const USER_TYPES = ["student", "company", "admin"];
const BROADCAST_GROUPS = {
  all: ["student", "company", "admin"],
  all_students: ["student"],
  all_companies: ["company"],
};

const getAllowedRecipientTypes = (senderType) => {
  if (senderType === "admin") return ["student", "company", "admin"];
  if (senderType === "student") return ["student", "company", "admin"];
  if (senderType === "company") return ["student", "admin"];
  return [];
};

const normalizeUserType = (value) => {
  const type = String(value || "").trim().toLowerCase();
  return USER_TYPES.includes(type) ? type : null;
};

const normalizeBroadcastGroup = (value) => {
  const key = String(value || "").trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(BROADCAST_GROUPS, key) ? key : null;
};

const mapUserDisplay = (type, user) => {
  if (!user) return null;
  const extra =
    user.extra && typeof user.extra === "object"
      ? user.extra
      : {};
  const notifications = extra?.preferences?.notifications || {};
  const emailNotificationsEnabled =
    typeof notifications.emailNotifications === "boolean"
      ? notifications.emailNotifications
      : true;

  if (type === "student") {
    return {
      id: user.id,
      type,
      name: `${user.firstname || ""} ${user.lastname || ""}`.trim() || user.email,
      email: user.email,
      emailNotificationsEnabled,
    };
  }
  if (type === "company") {
    return {
      id: user.id,
      type,
      name: user.name || user.email,
      email: user.email,
      emailNotificationsEnabled,
    };
  }
  return {
    id: user.id,
    type: "admin",
    name: (user.extra && user.extra.name) || "Administrator",
    email: user.email,
    emailNotificationsEnabled,
  };
};

const findUserByType = async (userId, userType) => {
  if (!isUuid(userId)) return null;
  if (userType === "student") {
    const user = await studentRepository.findById(userId);
    return mapUserDisplay("student", user);
  }
  if (userType === "company") {
    const user = await companyRepository.findById(userId);
    return mapUserDisplay("company", user);
  }
  if (userType === "admin") {
    const user = await adminRepository.findById(userId);
    return mapUserDisplay("admin", user);
  }
  return null;
};

const detectActor = async (req) => {
  if (!isUuid(req.id)) {
    return null;
  }

  const preferredType = normalizeUserType(req.cookies?.userType);
  const tryTypes = preferredType
    ? [preferredType, ...USER_TYPES.filter((type) => type !== preferredType)]
    : USER_TYPES;

  for (const type of tryTypes) {
    const user = await findUserByType(req.id, type);
    if (user) {
      return user;
    }
  }

  return null;
};

const parseLimit = (value, fallback = 50, max = 100) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.floor(parsed), 1), max);
};

const parseOffset = (value, fallback = 0) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(Math.floor(parsed), 0);
};

const dedupeRecipients = (recipients) => {
  const seen = new Set();
  const deduped = [];

  recipients.forEach((recipient) => {
    const key = `${recipient.type}:${recipient.id}`;
    if (seen.has(key)) return;
    seen.add(key);
    deduped.push(recipient);
  });

  return deduped;
};

const resolveRecipients = async ({ actor, recipients }) => {
  const allowedTypes = getAllowedRecipientTypes(actor.type);
  const directRecipients = [];
  const broadcastGroups = new Set();

  recipients.forEach((recipient) => {
    const directType = normalizeUserType(recipient?.type);
    if (
      directType &&
      isUuid(recipient?.id) &&
      allowedTypes.includes(directType) &&
      !(recipient.id === actor.id && directType === actor.type)
    ) {
      directRecipients.push({
        id: recipient.id,
        type: directType,
      });
      return;
    }

    if (actor.type !== "admin") return;
    if (String(recipient?.type || "").trim().toLowerCase() !== "group") return;
    const groupId = normalizeBroadcastGroup(recipient?.id);
    if (groupId) {
      broadcastGroups.add(groupId);
    }
  });

  const validated = dedupeRecipients(directRecipients);

  const resolved = [];
  for (const recipient of validated) {
    const user = await findUserByType(recipient.id, recipient.type);
    if (user) {
      resolved.push(user);
    }
  }

  if (actor.type === "admin" && broadcastGroups.size > 0) {
    const broadcastTypes = Array.from(
      new Set(
        Array.from(broadcastGroups).flatMap(
          (groupId) => BROADCAST_GROUPS[groupId] || []
        )
      )
    ).filter((type) => allowedTypes.includes(type));

    if (broadcastTypes.length > 0) {
      const groupRecipients = await mailRepository.listRecipientsForTypes({
        types: broadcastTypes,
        excludeId: actor.id,
        excludeType: actor.type,
      });
      return dedupeRecipients([...resolved, ...groupRecipients]);
    }
  }

  return resolved;
};

const resolveAttachments = async ({ actor, attachments }) => {
  if (!Array.isArray(attachments) || attachments.length === 0) {
    return { attachments: [] };
  }

  if (actor.type !== "student") {
    return {
      error: "Attachments are currently available for student accounts only.",
    };
  }

  const ids = [];
  const seen = new Set();
  for (const attachment of attachments) {
    const documentId = attachment?.documentId;
    if (!isUuid(documentId)) {
      return { error: "Invalid attachment selection." };
    }
    if (seen.has(documentId)) continue;
    seen.add(documentId);
    ids.push(documentId);
  }

  if (ids.length === 0) {
    return { attachments: [] };
  }

  const docs = await documentRepository.listByIds(ids);
  const docsById = new Map(docs.map((doc) => [doc.id, doc]));
  const resolved = [];

  for (const documentId of ids) {
    const doc = docsById.get(documentId);
    if (!doc) {
      return { error: "One or more selected attachments were not found." };
    }
    if (doc.creator_id !== actor.id || doc.creator_type !== "student") {
      return { error: "You can only attach your own documents." };
    }
    if (doc.type !== "file" || !doc.link) {
      return { error: "Only uploaded file documents can be attached." };
    }
    if (doc.quarantined || doc.scan_status === "infected") {
      return {
        error: "One or more selected documents are quarantined and cannot be attached.",
      };
    }

    resolved.push({
      documentId: doc.id,
      title: doc.title,
      link: doc.link,
      extension: doc.extension || null,
      mimeType: doc.mime_type || null,
      sizeBytes: doc.size_bytes || null,
    });
  }

  return { attachments: resolved };
};

exports.listFolder = async (req, res) => {
  try {
    const actor = await detectActor(req);
    if (!actor) {
      return res.status(401).send({ message: "Unauthorized!" });
    }

    let ownerId = actor.id;
    let ownerType = actor.type;

    if (actor.type === "admin" && req.query.ownerId && req.query.ownerType) {
      const requestedType = normalizeUserType(req.query.ownerType);
      if (!requestedType || !isUuid(req.query.ownerId)) {
        return res.status(400).send({ message: "Invalid owner filter." });
      }

      const target = await findUserByType(req.query.ownerId, requestedType);
      if (!target) {
        return res.status(404).send({ message: "Target user not found." });
      }

      ownerId = target.id;
      ownerType = target.type;
    }

    const limit = parseLimit(req.query.limit, 50, 100);
    const offset = parseOffset(req.query.offset, 0);

    const { items, total } = await mailRepository.listMailboxItems({
      ownerId,
      ownerType,
      folder: req.params.folder,
      search: req.query.q || "",
      limit,
      offset,
    });

    return res.status(200).send({
      data: items,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + items.length < total,
      },
    });
  } catch (err) {
    console.error("List folder failed:", err);
    return res.status(500).send({ message: "Unable to list mailbox items." });
  }
};

exports.getItem = async (req, res) => {
  try {
    const actor = await detectActor(req);
    if (!actor) {
      return res.status(401).send({ message: "Unauthorized!" });
    }

    if (!isUuid(req.params.itemId)) {
      return res.status(400).send({ message: "Invalid mailbox item id." });
    }

    let item = await mailRepository.getMailboxItemById({
      itemId: req.params.itemId,
      ownerId: actor.id,
      ownerType: actor.type,
    });

    if (!item && actor.type === "admin") {
      item = await mailRepository.getMailboxItemById({
        itemId: req.params.itemId,
      });
    }

    if (!item) {
      return res.status(404).send({ message: "Mailbox item not found." });
    }

    return res.status(200).send(item);
  } catch (err) {
    console.error("Get mailbox item failed:", err);
    return res.status(500).send({ message: "Unable to fetch mailbox item." });
  }
};

exports.compose = async (req, res) => {
  try {
    const actor = await detectActor(req);
    if (!actor) {
      return res.status(401).send({ message: "Unauthorized!" });
    }

    if (actor.type !== "admin") {
      const policy = await mailRepository.getUserPolicy({
        userId: actor.id,
        userType: actor.type,
      });
      if (policy?.sending_locked) {
        return res.status(403).send({
          message: "Your messaging access is locked. Please contact an administrator.",
        });
      }
    }

    const recipients = await resolveRecipients({
      actor,
      recipients: Array.isArray(req.body.recipients) ? req.body.recipients : [],
    });
    if (!recipients.length) {
      return res.status(400).send({ message: "No valid recipients selected." });
    }

    const attachmentResult = await resolveAttachments({
      actor,
      attachments: req.body.attachments,
    });
    if (attachmentResult.error) {
      return res.status(400).send({ message: attachmentResult.error });
    }

    const message = await mailRepository.createMessageWithDelivery({
      senderId: actor.id,
      senderType: actor.type,
      subject: String(req.body.subject || "").trim(),
      body: String(req.body.body || "").trim(),
      recipients,
      messageExtra: {
        source: "mailbox",
        attachments: attachmentResult.attachments,
      },
    });

    const senderNotificationMeta = {
      admin: {
        title: "New Mail from Admin",
        type: "warning",
      },
      company: {
        title: "New Mail from Company",
        type: "info",
      },
      student: {
        title: "New Mail from Student",
        type: "success",
      },
    };
    const meta = senderNotificationMeta[actor.type] || {
      title: "New Mail",
      type: "info",
    };
    const notificationMessage = `${actor.name} sent you "${message.subject}".`;

    try {
      await notificationRepository.createMany(
        recipients.map((recipient) => ({
          recipientType: recipient.type,
          recipientId: recipient.id,
          title: meta.title,
          message: notificationMessage,
          type: meta.type,
          extra: {
            category: "mail",
            autoDeleteOnRead: true,
            mailMessageId: message.id,
            senderType: actor.type,
            senderId: actor.id,
            senderName: actor.name,
          },
        }))
      );
    } catch (notifyError) {
      console.warn("Mail notifications failed:", notifyError.message || notifyError);
    }

    notifyNewMessage({
      sender: actor,
      recipients,
      subject: message.subject,
      body: message.body,
    });

    return res.status(201).send({
      message: "Message sent successfully.",
      id: message.id,
      deliveredTo: recipients.length,
    });
  } catch (err) {
    console.error("Compose mail failed:", err);
    return res.status(500).send({ message: "Unable to send message." });
  }
};

exports.saveDraft = async (req, res) => {
  try {
    const actor = await detectActor(req);
    if (!actor) {
      return res.status(401).send({ message: "Unauthorized!" });
    }

    const recipients = await resolveRecipients({
      actor,
      recipients: Array.isArray(req.body.recipients) ? req.body.recipients : [],
    });
    const attachmentResult = await resolveAttachments({
      actor,
      attachments: req.body.attachments,
    });
    if (attachmentResult.error) {
      return res.status(400).send({ message: attachmentResult.error });
    }

    const draft = await mailRepository.saveDraft({
      ownerId: actor.id,
      ownerType: actor.type,
      subject: String(req.body.subject || "").trim(),
      body: String(req.body.body || "").trim(),
      recipients,
      messageExtra: {
        source: "mailbox",
        attachments: attachmentResult.attachments,
      },
    });

    return res.status(201).send({
      message: "Draft saved.",
      item: draft,
    });
  } catch (err) {
    console.error("Save draft failed:", err);
    return res.status(500).send({ message: "Unable to save draft." });
  }
};

exports.updateItem = async (req, res) => {
  try {
    const actor = await detectActor(req);
    if (!actor) {
      return res.status(401).send({ message: "Unauthorized!" });
    }

    if (!isUuid(req.params.itemId)) {
      return res.status(400).send({ message: "Invalid mailbox item id." });
    }

    const updated = await mailRepository.updateMailboxItem({
      itemId: req.params.itemId,
      ownerId: actor.id,
      ownerType: actor.type,
      read: req.body.read,
      starred: req.body.starred,
      folder: req.body.folder,
    });

    if (!updated) {
      return res.status(404).send({ message: "Mailbox item not found." });
    }

    return res.status(200).send(updated);
  } catch (err) {
    console.error("Update mailbox item failed:", err);
    return res.status(500).send({ message: "Unable to update mailbox item." });
  }
};

exports.deleteItem = async (req, res) => {
  try {
    const actor = await detectActor(req);
    if (!actor) {
      return res.status(401).send({ message: "Unauthorized!" });
    }

    if (!isUuid(req.params.itemId)) {
      return res.status(400).send({ message: "Invalid mailbox item id." });
    }

    const result = await mailRepository.deleteMailboxItemForOwner({
      itemId: req.params.itemId,
      ownerId: actor.id,
      ownerType: actor.type,
    });

    if (result.status === "not_found") {
      return res.status(404).send({ message: "Mailbox item not found." });
    }

    return res.status(200).send({ message: "Message permanently deleted." });
  } catch (err) {
    console.error("Delete mailbox item failed:", err);
    return res.status(500).send({ message: "Unable to delete mailbox item." });
  }
};

exports.searchRecipients = async (req, res) => {
  try {
    const actor = await detectActor(req);
    if (!actor) {
      return res.status(401).send({ message: "Unauthorized!" });
    }

    const requestedType = String(req.query.type || "all").trim().toLowerCase();
    const allowedTypes = getAllowedRecipientTypes(actor.type);
    const targetTypes =
      requestedType === "all"
        ? allowedTypes
        : allowedTypes.filter((type) => type === requestedType);

    const normalizedQuery = String(req.query.q || "").trim().toLowerCase();
    const recipients = await mailRepository.searchRecipients({
      types: targetTypes,
      query: normalizedQuery,
      limit: parseLimit(req.query.limit, 25, 100),
      excludeId: actor.id,
      excludeType: actor.type,
    });

    if (actor.type === "admin") {
      const broadcastOptions = [
        {
          id: "all",
          type: "group",
          name: "All",
          email: "All students, companies, and admins",
          status: "Active",
        },
        {
          id: "all_students",
          type: "group",
          name: "All Students",
          email: "Every student account",
          status: "Active",
        },
        {
          id: "all_companies",
          type: "group",
          name: "All Companies",
          email: "Every company account",
          status: "Active",
        },
      ]
        .filter((option) => {
          if (requestedType === "student") return option.id === "all_students";
          if (requestedType === "company") return option.id === "all_companies";
          if (requestedType === "admin") return false;
          return true;
        })
        .filter((option) => {
          if (!normalizedQuery) return true;
          return (
            option.name.toLowerCase().includes(normalizedQuery) ||
            option.email.toLowerCase().includes(normalizedQuery)
          );
        });

      return res.status(200).send({ data: [...broadcastOptions, ...recipients] });
    }

    return res.status(200).send({ data: recipients });
  } catch (err) {
    console.error("Search recipients failed:", err);
    return res.status(500).send({ message: "Unable to search recipients." });
  }
};

exports.lockUserMessaging = async (req, res) => {
  try {
    const actor = await detectActor(req);
    if (!actor || actor.type !== "admin") {
      return res.status(403).send({ message: "Forbidden." });
    }

    const userType = normalizeUserType(req.body.userType);
    const userId = req.body.userId;
    if (!userType || !isUuid(userId)) {
      return res.status(400).send({ message: "Invalid target user." });
    }

    const target = await findUserByType(userId, userType);
    if (!target) {
      return res.status(404).send({ message: "Target user not found." });
    }

    const reason = String(req.body.reason || "").trim() || null;
    await mailRepository.setUserLock({
      userId: target.id,
      userType: target.type,
      sendingLocked: true,
      reason,
    });

    await mailRepository.createAuditLog({
      actorId: actor.id,
      actorType: actor.type,
      action: "lock_user_messaging",
      targetUserId: target.id,
      metadata: { userType: target.type, reason },
    });

    return res.status(200).send({ message: "User messaging locked." });
  } catch (err) {
    console.error("Lock messaging failed:", err);
    return res.status(500).send({ message: "Unable to lock user messaging." });
  }
};

exports.unlockUserMessaging = async (req, res) => {
  try {
    const actor = await detectActor(req);
    if (!actor || actor.type !== "admin") {
      return res.status(403).send({ message: "Forbidden." });
    }

    const userType = normalizeUserType(req.body.userType);
    const userId = req.body.userId;
    if (!userType || !isUuid(userId)) {
      return res.status(400).send({ message: "Invalid target user." });
    }

    const target = await findUserByType(userId, userType);
    if (!target) {
      return res.status(404).send({ message: "Target user not found." });
    }

    await mailRepository.setUserLock({
      userId: target.id,
      userType: target.type,
      sendingLocked: false,
      reason: null,
    });

    await mailRepository.createAuditLog({
      actorId: actor.id,
      actorType: actor.type,
      action: "unlock_user_messaging",
      targetUserId: target.id,
      metadata: { userType: target.type },
    });

    return res.status(200).send({ message: "User messaging unlocked." });
  } catch (err) {
    console.error("Unlock messaging failed:", err);
    return res.status(500).send({ message: "Unable to unlock user messaging." });
  }
};

exports.hardDeleteMessage = async (req, res) => {
  try {
    const actor = await detectActor(req);
    if (!actor || actor.type !== "admin") {
      return res.status(403).send({ message: "Forbidden." });
    }

    if (!isUuid(req.params.messageId)) {
      return res.status(400).send({ message: "Invalid message id." });
    }

    const deleted = await mailRepository.hardDeleteMessage(req.params.messageId);
    if (!deleted) {
      return res.status(404).send({ message: "Message not found." });
    }

    await mailRepository.createAuditLog({
      actorId: actor.id,
      actorType: actor.type,
      action: "hard_delete_message",
      targetMessageId: req.params.messageId,
      metadata: {},
    });

    return res.status(200).send({ message: "Message permanently deleted." });
  } catch (err) {
    console.error("Hard delete message failed:", err);
    return res.status(500).send({ message: "Unable to delete message." });
  }
};
