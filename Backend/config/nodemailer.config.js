const nodemailer = require('nodemailer');
const sendinBlue = require('nodemailer-sendinblue-transport');
const Email = require('email-templates');

// Create transport with error handling
let transport;
try {
    transport = nodemailer.createTransport({
        service: 'SendinBlue',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
} catch (err) {
    console.error('Failed to create email transport:', err.message);
}

let emailsender;
try {
    emailsender = new Email({
        transport: transport,
        send: true,
        preview: false,
    });
} catch (err) {
    console.error('Failed to create email sender:', err.message);
}

exports.sendConfirmationEmail = (name, email, confirmationCode) => {
    if (!emailsender) {
        console.log('Email sender not configured. Skipping confirmation email for:', email);
        return;
    }

    emailsender.send({
        template: 'confirmation',
        message: {
            from: 'ENIT TIC <support@tic-enit.tn>',
            to: email,
        },
        locals: {
            name: name,
            confirmationCode: confirmationCode,
        }
    }).then(() => {
        console.log("Confirmation email sent to:", email);
    }).catch((err) => {
        console.error("Failed to send confirmation email:", err.message);
        // Don't throw - registration should still succeed even if email fails
    });

};

exports.sendSearchEmail = (maillist, object, message) => {
    if (!emailsender) {
        console.log('Email sender not configured. Skipping search email.');
        return;
    }

    maillist.forEach(function (to, i, array) {
        const msg = {
            template: 'search',
            message: {
                from: 'ENIT TIC <support@tic-enit.tn>',
            },
            locals: {
                object: object,
                message: message,
            }
        }
        msg.message.to = to;
        emailsender.send(msg).catch((err) => {
            console.error("Failed to send search email to", to, ":", err.message);
        });
    });
};