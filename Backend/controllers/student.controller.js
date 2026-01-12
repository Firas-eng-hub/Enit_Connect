const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const stringSimilarity = require("string-similarity");
const nodemailer = require("../config/nodemailer.config");
const NodeGeocoder = require('node-geocoder');
const location = require("../config/geocoder.config");
const config = require("../config/auth.config");
const db = require("../models");
const Student = db.student;
const Document = db.document;
const Offer = db.offer;
const Post = db.post;
const fs = require('fs');
const Company = require("../models/company.model");

exports.getPosts = (req, res) => {
    Post.find().exec()
        .then(docs => {
            const response = [];
            docs.forEach((doc) => {
                response.push(doc);
            });
            response.reverse();
            res.status(200).send(response);
        }).catch(err => {
            res.status(500).send({ message: err });
        });
}

exports.addPost = (req, res) => {
    const post = new Post({
        _id: new db.mongoose.Types.ObjectId(),
        title: req.body.title,
        topic: req.body.topic,
        date: req.body.date,
        userName: req.body.userName,
        body: req.body.body,
        description: req.body.description
    });
    post.save()
        .then(document => {
            res.status(201).send({ message: "Post was added successfully!" });
        })
        .catch(err => {
            res.status(500).send({ message: err.message || err });
        });
}

exports.apply = (req, res) => {
    let cand = [];
    Offer.findById({
        _id: req.params.id
    }).then((offer) => {
        cand = offer.candidacies;
    });
    cand.push(req.body);
    const offer = new Offer();
    offer.candidacies = cand;
    Offer.updateOne({ _id: req.params.id }, offer)
        .then(() => {
            res.status(200).send({ message: "Success !" });
        }).catch(err => {
            console.error(err);
            res.status(500).send({ message: err });
        });
}
exports.searchDocument = (req, res) => {
    Document.find({ ["title"]: { $regex: new RegExp("^" + req.body.title, "i") } }).exec()
        .then(docs => {
            const response = [];
            docs.forEach((doc) => {
                response.push({
                    idcreator: doc.idcreator,
                    namecreator: doc.namecreator,
                    date: doc.date,
                    title: doc.title,
                    extension: doc.extension,
                    type: doc.type,
                    link: doc.link,
                    emplacement: doc.emplacement,
                    id: doc._id,
                    size: doc.size
                });
            });
            res.status(200).send(response);
        }).catch(err => {
            res.status(500).send({ message: err });
        });
}
exports.deleteDocument = (req, res) => {
    if (req.body.type === 'file') {
        try {
            fs.unlinkSync("uploads/" + req.body.link.split('/')[req.body.link.split('/').length - 1])
        } catch (err) {
            console.error(err)
        }
        Document.deleteOne({
            title: req.body.title,
            emplacement: req.body.emplacement
        }).exec()
            .then(() => {
                res.status(200).send({ message: req.body.type + " deleted" });
            })
            .catch(err => {
                console.error(err);
                res.status(500).send({ message: err });
            });
    } else {
        Document.deleteOne({
            title: req.body.title,
            emplacement: req.body.emplacement
        }).exec()
            .then(() => {
                res.status(200).send({ message: req.body.type + " deleted" });
            })
            .catch(err => {
                console.error(err);
                res.status(500).send({ message: err });
            });
    }

}

exports.createFile = (req, res) => {
    let filePath = process.env.BASE_URL + '/uploads/';
    if (req.file && req.file.filename) {
        filePath += req.file.filename;
    }
    const document = new Document({
        _id: new db.mongoose.Types.ObjectId(),
        idcreator: req.query.idcreator,
        namecreator: req.query.namecreator,
        date: req.query.date,
        title: req.query.title,
        type: "file",
        link: filePath,
        extension: req.query.type,
        emplacement: req.query.emplacement,
        size: req.query.size,
    });

    document.save()
        .then(document => {
            res.status(201).send({ message: "File was uploaded successfully!" });
        })
        .catch(err => {
            res.status(500).send({ message: err.message || err });
        });
}

exports.createFolder = (req, res) => {
    const document = new Document({
        _id: new db.mongoose.Types.ObjectId(),
        idcreator: req.body.idcreator,
        namecreator: req.body.namecreator,
        date: req.body.date,
        title: req.body.title,
        type: "folder",
        link: "",
        extension: "",
        emplacement: req.body.emplacement,
        size: ""
    });
    
    document.save()
        .then(savedDocument => {
            res.status(201).send({ message: "Folder was created successfully!" });
        })
        .catch(err => {
            res.status(500).send({ message: err.message || err });
        });
}

exports.getDocuments = (req, res) => {

    Document.find({ ["emplacement"]: req.body.emp }).exec()
        .then(docs => {
            const response = [];
            docs.forEach((doc) => {
                response.push({
                    idcreator: doc.idcreator,
                    namecreator: doc.namecreator,
                    date: doc.date,
                    title: doc.title,
                    extension: doc.extension,
                    type: doc.type,
                    link: doc.link,
                    emplacement: doc.emplacement,
                    id: doc._id,
                    size: doc.size
                });
            });
            res.status(200).send(response);
        }).catch(err => {
            res.status(500).send({ message: err });
        });
}



exports.updatePicture = (req, res) => {
    let imagePath = process.env.BASE_URL + '/uploads/';// + req.file.filename; // Note: set path dynamically
    if (req.file && req.file.filename) {
        imagePath += req.file.filename;
    }

    if (req.id === req.params.id) {
        const newData = new Student({
            status: 'Active',
            picture: imagePath,
        });
        Student.updateOne({ _id: req.params.id }, newData)
            .then(() => {
                res.status(200).send({ message: "User updated" });
            }).catch(err => {
                console.error(err);
                res.status(500).send({ message: err });
            });
    } else {
        res.status(404).send({ message: "Unauthorized!" })
    }


};

exports.signup = async (req, res) => {
    try {
        const hash = await bcrypt.hash(req.body.password, 10);
        
        const characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let confirmCode = '';
        for (let i = 0; i < 25; i++) {
            confirmCode += characters[Math.floor(Math.random() * characters.length)];
        }

        // Get location (wrapped in promise)
        const getLocation = () => {
            return new Promise((resolve) => {
                location.latlng(req, res, (result) => {
                    resolve(result);
                });
            });
        };

        const locationResult = await getLocation();
        let latitude = null;
        let longitude = null;
        if (locationResult) {
            latitude = locationResult.latitude;
            longitude = locationResult.longitude;
        }

        const student = new Student({
            _id: new db.mongoose.Types.ObjectId(),
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            email: req.body.email,
            password: hash,
            confirmationCode: confirmCode,
            country: req.body.country,
            city: req.body.city,
            address: req.body.address,
            phone: req.body.phone,
            type: req.body.type,
            workAt: req.body.workAt,
            class: req.body.class,
            promotion: req.body.promotion,
            linkedin: req.body.linkedin,
            picture: req.body.picture,
            aboutme: req.body.aboutme,
            latitude: latitude,
            longitude: longitude
        });

        await student.save();

        res.status(201).send({ message: "User was registered successfully! Please check your email" });

        nodemailer.sendConfirmationEmail(
            student.firstname,
            student.email,
            student.confirmationCode
        );
    } catch (err) {
        return res.status(500).send({ message: err.message || err });
    }
};

exports.signin = async (req, res) => {
    const authJwt = require("../middlewares/authJwt");

    try {
        const student = await Student.findOne({ email: req.body.email }).exec();

        if (!student) {
            return res.status(401).send({ message: "Invalid email or password." });
        }

        if (student.status !== "Active") {
            return res.status(401).send({
                message: "Pending Account. Please Verify Your Email!",
            });
        }

        const passwordIsValid = bcrypt.compareSync(req.body.password, student.password);

        if (!passwordIsValid) {
            return res.status(401).send({
                message: "Invalid email or password."
            });
        }

        const token = jwt.sign({ email: student.email, id: student._id }, config.secret, { expiresIn: "24h" });

        // Create refresh token
        const RefreshToken = db.refreshToken;
        const refreshToken = await RefreshToken.createToken(student._id, 'Student');
        
        // Set HTTP-only cookies (XSS protection)
        authJwt.setAuthCookies(res, token, refreshToken, 'student');

        // Return user info without tokens in body
        return res.status(200).send({
            id: student._id,
            email: student.email,
            name: student.firstname + ' ' + student.lastname,
            userType: 'student'
        });
    } catch (err) {
        return res.status(500).send({ message: err.message || err });
    }
};

exports.verifyUser = async (req, res, next) => {
    try {
        const student = await Student.findOne({
            confirmationCode: req.params.confirmationCode,
        });

        if (!student) {
            return res.status(404).send({ message: "User Not found." });
        }

        student.status = "Active";
        await student.save();

        res.status(200).send({ message: "Account Verified!" });
    } catch (err) {
        res.status(500).send({ message: err.message || err });
    }
};

exports.getLocation = (req, res, next) => {
    let query = req.query.q;
    query = query.replace(/\+/g, ' ');
    const geocoder = NodeGeocoder(location.options);
    geocoder.geocode({
        address: query,
        country: 'Tunisie',
        language: 'FR'
    })
        .then(result => {
            res.status(200).send(result);
        })
        .catch(err => {
            res.status(500).send({ message: "err here" });
        });
};

exports.getAll = (req, res, next) => {
    Student.find()
        .exec()
        .then(docs => {
            const response = [];
            docs.forEach((doc) => {
                response.push({
                    firstname: doc.firstname,
                    lastname: doc.lastname,
                    email: doc.email,
                    country: doc.country,
                    city: doc.city,
                    address: doc.address,
                    phone: doc.phone,
                    type: doc.type,
                    workAt: doc.workAt,
                    class: doc.class,
                    promotion: doc.promotion,
                    linkedin: doc.linkedin,
                    picture: doc.picture,
                    aboutme: doc.aboutme,
                    id: doc._id
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

exports.getByName = (req, res, next) => {
    Student.find()
        .exec()
        .then(docs => {
            const response = [];
            docs.forEach((doc) => {
                const name = doc.firstname + ' ' + doc.lastname;
                if (stringSimilarity.compareTwoStrings(name.toLowerCase(), req.query.q.toLowerCase()) > 0.45) {
                    response.push({
                        firstname: doc.firstname,
                        lastname: doc.lastname,
                        email: doc.email,
                        country: doc.country,
                        city: doc.city,
                        address: doc.address,
                        phone: doc.phone,
                        type: doc.type,
                        workAt: doc.workAt,
                        class: doc.class,
                        promotion: doc.promotion,
                        linkedin: doc.linkedin,
                        picture: doc.picture,
                        aboutme: doc.aboutme,
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

exports.getStudentLocations = (req, res, next) => {
    Student.find({ [req.query.property]: { $regex: new RegExp("^" + req.query.key, "i") } }).exec()
        .then(docs => {
            const response = [];
            docs.forEach((doc) => {
                response.push({
                    lat: doc.latitude,
                    lng: doc.longitude,
                    name: doc.firstname + ' ' + doc.lastname,
                    url: process.env.BASE_URL + "/student/" + doc._id
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

exports.getByKey = (req, res, next) => {
    Student.find({ [req.query.property]: { $regex: new RegExp("^" + req.query.key, "i") } }).exec()
        .then(docs => {
            const response = [];
            docs.forEach((doc) => {
                response.push({
                    firstname: doc.firstname,
                    lastname: doc.lastname,
                    email: doc.email,
                    country: doc.country,
                    city: doc.city,
                    address: doc.address,
                    phone: doc.phone,
                    type: doc.type,
                    workAt: doc.workAt,
                    class: doc.class,
                    promotion: doc.promotion,
                    linkedin: doc.linkedin,
                    picture: doc.picture,
                    aboutme: doc.aboutme,
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


exports.getStudentById = (req, res, next) => {
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
            aboutme: student.aboutme
        });

    }).catch(err => {
        res.status(500).send({ message: err });
    });

};

exports.updateStudent = (req, res, next) => {
    if (req.id === req.params.id) {
        const newData = new Student({
            status: 'Active',
            country: req.body.country,
            city: req.body.city,
            address: req.body.address,
            phone: req.body.phone,
            type: req.body.type,
            workAt: req.body.workAt,
            class: req.body.class,
            promotion: req.body.promotion,
            linkedin: req.body.linkedin,
            picture: req.body.picture,
            aboutme: req.body.aboutme,
        });
        Student.updateOne({ _id: req.params.id }, newData)
            .then(() => {
                res.status(200).send({ message: "User updated" });
            }).catch(err => {

                res.status(500).send({ message: err });
            });
    } else {
        res.status(404).send({ message: "Unauthorized!" })
    }
};

exports.companiesInfo = (req, res) => {
    const info = [];
    let nb = 0;

    // Handle empty array - return immediately
    if (!req.body.companies || req.body.companies.length === 0) {
        return res.status(200).send(info);
    }

    req.body.companies.forEach(elt => {
        Company.findById({ _id: elt }).then((company) => {
            // Handle case where company is not found
            if (company) {
                info.push({
                    id: company._id,
                    name: company.name,
                    about: company.about,
                    address: company.address,
                    city: company.city,
                    country: company.country,
                    email: company.email,
                    phone: company.phone,
                    website: company.website,
                    logo: company.logo
                });
            }
            nb++;
            if (nb == req.body.companies.length) {
                res.status(200).send(info);
            }
        }).catch((erreur) => {
            nb++;
            console.error('Error finding company:', erreur);
            if (nb == req.body.companies.length) {
                res.status(200).send(info);
            }
        })
    });


}

exports.deleteStudent = (req, res, next) => {
    if (req.id == req.params.id) {
        Student.deleteOne({
            _id: req.params.id
        }).exec()
            .then(() => {
                res.status(200).send({ message: "User deleted" });
            })
            .catch(err => {
                console.error(err);
                res.status(500).send({ message: err });
            });
    } else {
        res.status(404).send({ message: "Unauthorized!" })
    }

};