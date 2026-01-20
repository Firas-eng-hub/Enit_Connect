const { notificationRepository } = require("../repositories");

const fetchNotifications = async (recipientType, req, res) => {
  try {
    const limit = Number.parseInt(req.query.limit, 10);
    const notifications = await notificationRepository.listByRecipient(
      recipientType,
      req.id,
      !Number.isNaN(limit) && limit > 0 ? limit : null
    );
    res.status(200).send(
      notifications.map(notificationRepository.mapNotificationRow)
    );
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

const fetchUnreadCount = async (recipientType, req, res) => {
  try {
    const count = await notificationRepository.countUnread(recipientType, req.id);
    res.status(200).send({ count });
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

const markRead = async (recipientType, req, res) => {
  try {
    const updated = await notificationRepository.markRead(req.params.id, recipientType, req.id);
    if (!updated) {
      return res.status(404).send({ message: "Notification not found." });
    }
    res.status(200).send({ message: "Notification updated." });
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

const markAllRead = async (recipientType, req, res) => {
  try {
    await notificationRepository.markAllRead(recipientType, req.id);
    res.status(200).send({ message: "Notifications updated." });
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

const deleteNotification = async (recipientType, req, res) => {
  try {
    const deleted = await notificationRepository.deleteNotification(req.params.id, recipientType, req.id);
    if (!deleted) {
      return res.status(404).send({ message: "Notification not found." });
    }
    res.status(200).send({ message: "Notification deleted." });
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

exports.getStudentNotifications = (req, res) => fetchNotifications("student", req, res);
exports.getCompanyNotifications = (req, res) => fetchNotifications("company", req, res);
exports.getAdminNotifications = (req, res) => fetchNotifications("admin", req, res);

exports.getStudentUnreadCount = (req, res) => fetchUnreadCount("student", req, res);
exports.getCompanyUnreadCount = (req, res) => fetchUnreadCount("company", req, res);
exports.getAdminUnreadCount = (req, res) => fetchUnreadCount("admin", req, res);

exports.markStudentRead = (req, res) => markRead("student", req, res);
exports.markCompanyRead = (req, res) => markRead("company", req, res);
exports.markAdminRead = (req, res) => markRead("admin", req, res);

exports.markStudentReadAll = (req, res) => markAllRead("student", req, res);
exports.markCompanyReadAll = (req, res) => markAllRead("company", req, res);
exports.markAdminReadAll = (req, res) => markAllRead("admin", req, res);

exports.deleteStudentNotification = (req, res) => deleteNotification("student", req, res);
exports.deleteCompanyNotification = (req, res) => deleteNotification("company", req, res);
exports.deleteAdminNotification = (req, res) => deleteNotification("admin", req, res);
