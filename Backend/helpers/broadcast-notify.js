const { notificationRepository } = require("../repositories");

/**
 * Fire-and-forget audience-wide notifications. The HTTP response must not wait
 * for a fan-out to every user, and a failed broadcast must not fail the request
 * that triggered it.
 *
 * @param {Array<'student'|'company'>} audiences
 * @param {{ title: string, message: string, type?: string, extra?: object }} payload
 * @param {string} label used in logs
 * @returns {Promise<void>} resolves when every broadcast has settled (for tests)
 */
const broadcastInBackground = (audiences, payload, label) => {
  const tasks = audiences.map((recipientType) =>
    notificationRepository
      .broadcast({ recipientType, ...payload })
      .catch((err) => {
        console.warn(`${label}: ${recipientType} broadcast failed:`, err.message || err);
      })
  );
  return Promise.all(tasks).then(() => undefined);
};

module.exports = { broadcastInBackground };
