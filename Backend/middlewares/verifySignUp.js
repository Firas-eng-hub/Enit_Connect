const db = require("../models");
const Student = db.student;
const Company = db.company;

exports.checkDuplicateEmail = (req, res, next) => {
    Student.findOne({
        email: req.body.email
    }).exec((err, student) => {
        if (err) {
            return res.status(500).send({ message: err });
        }

        if (student) {
            return res.status(400).send({ message: "Failed! Email is already in use!" });
        }

        next();
    });
};

exports.checkDuplicateCompany = (req, res, next) => {
    Company.findOne({
        name: req.body.name
    }).exec((err, company) => {
        if (err) {
            return res.status(500).send({ message: err });
        }

        if (company) {
            return res.status(400).send({ message: "Failed! Company is already registred" });
        }

        next();
    });
};

