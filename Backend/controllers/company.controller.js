const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const stringSimilarity = require("string-similarity");
const nodemailer = require("../config/nodemailer.config");
const location = require("../config/geocoder.config");
const config = require("../config/auth.config");
const db = require("../models");
const Company = db.company;
const Offer = db.offer;
const Student = db.student;
exports.getUserInfo = (req, res) => {
    Student.findById({
        _id: req.params.id
    }).then((student) => {
        if (!student) {
            return res.status(404).send({ message: "User Not found." });
        }

        return res.status(200).send({
            firstname: student.firstname,
            lastname: student.lastname,
            email: student.email,
            country: student.country,
            city: student.city,
            address: student.address,
            phone: student.phone,
            type: student.type,
            workAt: student.workAt,
            class: student.class,
            promotion: student.promotion,
            linkedin: student.linkedin,
            picture: student.picture,
            aboutme: student.aboutme,
            latitude: student.latitude,
            longitude: student.longitude
        });

    }).catch(err => {
        res.status(500).send({ message: err });
    });
}
exports.signup = (req, res) => {
    bcrypt.hash(req.body.password, 10, (err, hash) => {
        if (err) {
            return res.status(500).json({
                message: err
            });
        } else {
            const characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
            let confirmCode = '';
            for (let i = 0; i < 25; i++) {
                confirmCode += characters[Math.floor(Math.random() * characters.length)];
            }

            location.latlng(req, res, (result) => {
                let latitude = null;
                let longitude = null;

                if (result) {
                    latitude = result.latitude;
                    longitude = result.longitude;
                }
                const company = new Company({
                    _id: new db.mongoose.Types.ObjectId(),
                    name: req.body.name,
                    email: req.body.email,
                    password: hash,
                    confirmationCode: confirmCode,
                    country: req.body.country,
                    address: req.body.address,
                    city: req.body.city,
                    website: req.body.website,
                    phone: req.body.phone,
                    logo: req.body.logo,
                    about: req.body.about,
                    latitude: latitude,
                    longitude: longitude
                });
                company.save((err, company) => {
                    if (err) {
                        return res.status(500).send({ message: err });
                    }

                    res.status(201).send({ message: "Company was registered successfully! Please check your email" });

                    /*nodemailer.sendConfirmationEmail(
                        company.name,
                        student.email,
                        student.confirmationCode
                    );*/
                });
            });

        }
    })
};

exports.signin = (req, res) => {
    const authJwt = require("../middlewares/authJwt");

    Company.findOne({
        email: req.body.email
    }).exec((err, company) => {
        if (err) {
            return res.status(500).send({ message: err });
        }

        if (!company) {
            return res.status(404).send({ message: "Company Not found." });
        }

        if (company.status != "Active") {
            return res.status(401).send({
                message: "Pending Account. Please Verify Your Email!",
            });
        }

        const passwordIsValid = bcrypt.compareSync(req.body.password, company.password);

        if (!passwordIsValid) {
            return res.status(401).send({
                message: "Invalid Password!"
            });
        }

        const token = jwt.sign({ email: company.email, id: company._id }, config.secret, { expiresIn: "24h" });

        // Create refresh token
        const RefreshToken = db.refreshToken;
        RefreshToken.createToken(company._id, 'Company').then(refreshToken => {
            // Set HTTP-only cookies (XSS protection)
            authJwt.setAuthCookies(res, token, refreshToken, 'company');

            return res.status(200).send({
                id: company._id,
                email: company.email,
                name: company.name,
                userType: 'company'
            });
        }).catch(err => {
            return res.status(500).send({ message: "Error creating refresh token", error: err });
        });
    });
};

exports.verifyCompany = (req, res) => {
    Company.findOne({
        confirmationCode: req.params.confirmationCode,
    }).then((company) => {
        if (!company) {
            return res.status(404).send({ message: "Company Not found." });
        }

        company.status = "Active";
        company.save((err) => {
            if (err) {
                return res.status(500).send({ message: err });
            }

            res.status(200).send({ message: "Account Verified!" })
        });
    }).catch(err => {
        res.status(500).send({ message: err });
    });
};


exports.getByKey = (req, res) => {
    Company.find({ [req.query.property]: { $regex: new RegExp("^" + req.query.key, "i") } }).exec()
        .then(docs => {
            const response = [];
            docs.forEach((doc) => {
                response.push({
                    name: doc.name,
                    email: doc.email,
                    country: doc.country,
                    city: doc.city,
                    address: doc.address,
                    phone: doc.phone,
                    website: doc.website,
                    logo: doc.logo,
                    about: doc.about,
                    id: doc._id
                });
            });
            if (docs.length >= 0) {
                res.status(200).send(response);
            } else {
                res.status(404).send({ message: 'No entries found' });
            }

        }).catch(err => {
            res.status(500).send({ message: err });
        });
};

exports.getByName = (req, res) => {
    Company.find()
        .exec()
        .then(docs => {
            const response = [];
            docs.forEach((doc) => {
                ;
                if (stringSimilarity.compareTwoStrings(doc.name.toLowerCase(), req.query.q.toLowerCase()) > 0.45) {
                    response.push({
                        name: doc.name,
                        email: doc.email,
                        country: doc.country,
                        city: doc.city,
                        address: doc.address,
                        phone: doc.phone,
                        website: doc.website,
                        logo: doc.logo,
                        about: doc.about,
                        id: doc._id
                    });
                }
            });
            if (docs.length >= 0) {
                res.status(200).send(response);
            } else {
                res.status(404).send({ message: 'No entries found' });
            }
        })
        .catch(err => {
            res.status(500).send({ message: err });
        });
};

exports.getCompanyById = async (req, res) => {
    Company.findById({
        _id: req.query.id
    }).then((company) => {
        if (!company) {
            return res.status(404).send({ message: "Company Not found." });
        }
        const response = [];
        const result = Offer.find({ company_id: req.params.id })
            .exec()
            .then(docs => {
                if (!docs) {
                    return res.status(200).send({
                        name: company.name,
                        email: company.email,
                        country: company.country,
                        city: company.city,
                        address: company.address,
                        phone: company.phone,
                        website: company.website,
                        logo: company.logo,
                        about: company.about,
                        offers: "No Offers found.",
                    });
                }
                docs.forEach((doc) => {
                    response.push({
                        id: doc._id,
                        title: doc.title,
                        type: doc.type,
                        duration: doc.duration,
                        content: doc.content,
                        company: doc.company_id,
                        createdAt: doc.createdAt
                    });
                });
                return res.status(200).send({
                    name: company.name,
                    email: company.email,
                    country: company.country,
                    city: company.city,
                    address: company.address,
                    phone: company.phone,
                    website: company.website,
                    logo: company.logo,
                    about: company.about,
                    offers: response,
                });
            }).catch(err => {
                res.status(500).send({ message: "error" + err });
            });

    }).catch(err => {
        res.status(500).send({ message: err });
    });
};

exports.getCompanyLocations = (req, res) => {
    Company.find({ [req.query.property]: req.query.key }).exec()
        .then(docs => {
            const response = [];
            docs.forEach((doc) => {
                response.push({
                    lat: doc.latitude,
                    lng: doc.longitude,
                    name: doc.name,
                    url: process.env.BASE_URL + "/company/" + doc._id
                });
            });
            if (docs.length >= 0) {
                res.status(200).send(response);
            } else {
                res.status(404).send({ message: 'No entries found' });
            }

        }).catch(err => {
            res.status(500).send({ message: err });
        });
};

exports.updateCompany = (req, res) => {
    const newData = new Company({
        status: 'Active',
        name: req.body.name,
        email: req.body.email,
        country: req.body.country,
        city: req.body.city,
        address: req.body.address,
        phone: req.body.phone,
        website: req.body.website,
        logo: req.body.logo,
        about: req.body.about,
    });
    Company.updateOne({ _id: req.query.id }, newData)
        .then(() => {
            res.status(200).send({ message: "Company updated" });
        }).catch(err => {
            console.error(err);
            res.status(500).send({ message: err });
        });
};

exports.deleteCompany = (req, res) => {
    if (req.id == req.params.id) {
        Company.deleteOne({
            _id: req.params.id
        }).exec()
            .then(() => {
                res.status(200).send({ message: "Company deleted" });
            })
            .catch(err => {
                console.error(err);
                res.status(500).send({ message: err });
            });
    } else {
        res.status(404).send({ message: "Unauthorized!" })
    }
};

exports.getAllCompanies = (req, res, next) => {
    Company.find()
        .exec()
        .then(docs => {
            const response = [];
            docs.forEach((company) => {
                response.push({
                    name: company.name,
                    email: company.email,
                    country: company.country,
                    city: company.city,
                    address: company.address,
                    phone: company.phone,
                    website: company.website,
                    logo: company.logo,
                    about: company.about,
                    id: company._id
                });
            });
            if (docs.length >= 0) {
                res.status(200).send(response);
            } else {
                res.status(404).send({ message: 'No entries found' });
            }
        })
        .catch(err => {
            res.status(500).send({ message: err });
        });
};