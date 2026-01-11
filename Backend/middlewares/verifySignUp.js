const db = require("../models");
const Student = db.student;
const Company = db.company;

exports.checkDuplicateEmail = async (req, res, next) => {
    try {
        const student = await Student.findOne({ email: req.body.email }).exec();

        if (student) {
            return res.status(400).send({ message: "Failed! Email is already in use!" });
        }

        next();
    } catch (err) {
        return res.status(500).send({ message: err.message || err });
    }
};

exports.checkDuplicateCompany = async (req, res, next) => {
    try {
        const company = await Company.findOne({ name: req.body.name }).exec();

        if (company) {
            return res.status(400).send({ message: "Failed! Company is already registered" });
        }

        next();
    } catch (err) {
        return res.status(500).send({ message: err.message || err });
    }
};

