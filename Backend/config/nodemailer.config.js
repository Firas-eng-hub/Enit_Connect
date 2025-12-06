const nodemailer = require('nodemailer');
const Email = require('email-templates');

// Gmail SMTP Configuration
const transport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,  // Your Gmail address
        pass: process.env.EMAIL_PASS   // Your Gmail App Password (NOT regular password)
    }
});

const emailsender = new Email({
    transport: transport,
    send: true,
    preview: false,
});

exports.sendConfirmationEmail = (name, email, confirmationCode) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log('Email credentials not configured. Skipping confirmation email for:', email);
        return;
    }

    emailsender.send({
        template: 'confirmation',
        message: {
            from: `TIC-ENIT <${process.env.EMAIL_USER}>`,
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
    });
};

exports.sendSearchEmail = (maillist, object, message) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log('Email credentials not configured. Skipping search email.');
        return;
    }

    maillist.forEach(function (to) {
        emailsender.send({
            template: 'search',
            message: {
                from: `TIC-ENIT <${process.env.EMAIL_USER}>`,
                to: to,
            },
            locals: {
                object: object,
                message: message,
            }
        }).catch((err) => {
            console.error("Failed to send search email to", to, ":", err.message);
        });
    });
};