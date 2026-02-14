const nodemailer = require("../config/nodemailer.config");

const notificationsEnabled = () =>
  String(process.env.MAIL_NOTIFICATIONS_ENABLED || "true").toLowerCase() !== "false";

const immediateAdminNoticesEnabled = () =>
  String(process.env.MAIL_IMMEDIATE_ADMIN_NOTICE || "true").toLowerCase() !== "false";

const isImmediateMode = (senderType) => {
  if (!notificationsEnabled()) return false;
  if (senderType === "admin") return immediateAdminNoticesEnabled();
  return false;
};

const sendMailboxNotification = async ({ to, recipientName, senderName, subject, preview }) => {
  const safeRecipient = recipientName || "there";
  const safeSender = senderName || "ENIT Connect";
  const safeSubject = subject || "(no subject)";
  const safePreview = preview || "";

  const text = [
    `Hello ${safeRecipient},`,
    "",
    `You received a new message on ENIT Connect from ${safeSender}.`,
    "",
    `Subject: ${safeSubject}`,
    "",
    safePreview,
    "",
    "Sign in to your ENIT Connect mailbox to read and reply.",
  ].join("\n");

  return nodemailer.sendRawEmail({
    to,
    subject: `New ENIT Connect message: ${safeSubject}`,
    text,
  });
};

const notifyNewMessage = ({ sender, recipients, subject, body }) => {
  if (!isImmediateMode(sender?.type)) {
    return;
  }

  const preview = String(body || "").slice(0, 180);
  recipients.forEach((recipient) => {
    if (recipient.emailNotificationsEnabled === false) return;
    if (!recipient.email) return;
    setImmediate(() => {
      sendMailboxNotification({
        to: recipient.email,
        recipientName: recipient.name,
        senderName: sender.name,
        subject,
        preview,
      }).catch((err) => {
        console.error("Mailbox notification failed:", err.message || err);
      });
    });
  });
};

module.exports = {
  notifyNewMessage,
};
