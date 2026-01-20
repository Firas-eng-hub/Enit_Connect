const { studentRepository, companyRepository } = require("../repositories");

exports.checkDuplicateEmail = async (req, res, next) => {
    try {
        const student = await studentRepository.findByEmail(req.body.email);

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
        const company = await companyRepository.findByName(req.body.name);

        if (company) {
            return res.status(400).send({ message: "Failed! Company is already registered" });
        }

        next();
    } catch (err) {
        return res.status(500).send({ message: err.message || err });
    }
};
