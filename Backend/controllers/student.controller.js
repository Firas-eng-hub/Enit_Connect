const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const stringSimilarity = require("string-similarity");
const nodemailer = require("../config/nodemailer.config");
const location = require("../config/geocoder.config");
const config = require("../config/auth.config");
const fs = require("fs");
const {
  studentRepository,
  documentRepository,
  offerRepository,
  postRepository,
  notificationRepository,
  adminRepository,
  companyRepository,
  refreshTokenRepository,
} = require("../repositories");
const { isUuid } = require("../utils/validation");

const mapStudentRow = (row) => ({
  firstname: row.firstname,
  lastname: row.lastname,
  email: row.email,
  status: row.status,
  country: row.country,
  city: row.city,
  address: row.address,
  phone: row.phone,
  type: row.type,
  workAt: row.work_at,
  class: row.class,
  promotion: row.promotion,
  linkedin: row.linkedin,
  picture: row.picture,
  aboutme: row.aboutme,
  latitude: row.latitude,
  longitude: row.longitude,
  id: row.id,
  _id: row.id,
});

exports.getPosts = async (req, res) => {
  try {
    const posts = await postRepository.listAll();
    const response = posts.map(postRepository.mapPostRow);
    res.status(200).send(response);
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

exports.addPost = async (req, res) => {
  try {
    await postRepository.createPost({
      title: req.body.title,
      topic: req.body.topic,
      date: req.body.date,
      userName: req.body.userName,
      body: req.body.body,
      description: req.body.description,
    });
    res.status(201).send({ message: "Post was added successfully!" });
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

exports.apply = async (req, res) => {
  try {
    if (!isUuid(req.id)) {
      return res.status(401).send({ message: "Unauthorized!" });
    }
    if (!isUuid(req.params.id)) {
      return res.status(400).send({ message: "Invalid offer id." });
    }

    const offer = await offerRepository.findById(req.params.id);
    if (!offer) {
      return res.status(404).send({ message: "Offer not found!" });
    }

    const existingCandidacies = await offerRepository.listCandidacies(offer.id);
    const studentDetails = await studentRepository.findById(req.id);
    const studentName = studentDetails
      ? `${studentDetails.firstname} ${studentDetails.lastname}`
      : "A student";

    await offerRepository.createCandidacy({
      offerId: offer.id,
      sourceIndex: existingCandidacies.length,
      studentId: req.id,
      body: req.body.body,
      documents: req.body.documents || [],
      status: "pending",
      createdAt: new Date(),
      extra: studentDetails
        ? {
            studentSnapshot: {
              firstname: studentDetails.firstname,
              lastname: studentDetails.lastname,
              email: studentDetails.email,
              class: studentDetails.class,
              promotion: studentDetails.promotion,
              picture: studentDetails.picture,
              type: studentDetails.type,
            },
          }
        : {},
    });

    const notifications = [
      {
        recipientType: "student",
        recipientId: req.id,
        title: "Application Submitted",
        message: `Your application for "${offer.title}" has been sent.`,
        type: "success",
      },
    ];

    if (offer.company_id) {
      notifications.push({
        recipientType: "company",
        recipientId: offer.company_id,
        title: "New Application",
        message: `${studentName} applied for "${offer.title}".`,
        type: "info",
      });
    }

    try {
      await notificationRepository.createMany(notifications);
    } catch (notifyError) {
      console.warn("Apply notifications failed:", notifyError.message || notifyError);
    }

    res.status(200).send({ message: "Application submitted successfully!" });
  } catch (err) {
    console.error("Apply error:", err);
    res.status(500).send({ message: err.message || "Error applying to offer" });
  }
};

exports.searchDocument = async (req, res) => {
  try {
    const docs = await documentRepository.searchByTitle(req.body.title || "");
    res.status(200).send(docs.map(documentRepository.mapDocumentRow));
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

exports.deleteDocument = async (req, res) => {
  if (req.body.type === "file") {
    try {
      fs.unlinkSync(`uploads/${req.body.link.split("/").pop()}`);
    } catch (err) {
      console.error(err);
    }
  }

  try {
    await documentRepository.deleteByTitleAndEmplacement(req.body.title, req.body.emplacement);
    res.status(200).send({ message: `${req.body.type} deleted` });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: err.message || err });
  }
};

exports.createFile = async (req, res) => {
  let filePath = `${process.env.BASE_URL}/uploads/`;
  if (req.file && req.file.filename) {
    filePath += req.file.filename;
  }

  try {
    const creatorId = isUuid(req.query.idcreator) ? req.query.idcreator : null;
    await documentRepository.createDocument({
      creatorId,
      creatorName: req.query.namecreator,
      date: req.query.date,
      title: req.query.title,
      type: "file",
      link: filePath,
      extension: req.query.type,
      emplacement: req.query.emplacement,
      size: req.query.size,
    });
    res.status(201).send({ message: "File was uploaded successfully!" });
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

exports.createFolder = async (req, res) => {
  try {
    const creatorId = isUuid(req.body.idcreator) ? req.body.idcreator : null;
    await documentRepository.createDocument({
      creatorId,
      creatorName: req.body.namecreator,
      date: req.body.date,
      title: req.body.title,
      type: "folder",
      link: "",
      extension: "",
      emplacement: req.body.emplacement,
      size: "",
    });
    res.status(201).send({ message: "Folder was created successfully!" });
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

exports.getDocuments = async (req, res) => {
  try {
    const docs = await documentRepository.listByEmplacement(req.body.emp);
    res.status(200).send(docs.map(documentRepository.mapDocumentRow));
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

exports.updatePicture = async (req, res) => {
  let imagePath = `${process.env.BASE_URL}/uploads/`;
  if (req.file && req.file.filename) {
    imagePath += req.file.filename;
  }

  if (req.id !== req.params.id) {
    return res.status(404).send({ message: "Unauthorized!" });
  }

  try {
    await studentRepository.updatePicture(req.params.id, imagePath);
    res.status(200).send({ message: "User updated" });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: err.message || err });
  }
};

exports.signup = async (req, res) => {
  try {
    const hash = await bcrypt.hash(req.body.password, 10);
    const email = (req.body.email || "").trim().toLowerCase();
    const characters = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let confirmCode = "";
    for (let i = 0; i < 25; i += 1) {
      confirmCode += characters[Math.floor(Math.random() * characters.length)];
    }

    const getLocation = () =>
      new Promise((resolve) => {
        location.latlng(req, res, (result) => {
          resolve(result);
        });
      });

    const locationResult = await getLocation();
    const latitude = locationResult ? locationResult.latitude : null;
    const longitude = locationResult ? locationResult.longitude : null;

    const student = await studentRepository.createStudent({
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      email,
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
      latitude,
      longitude,
      status: "Pending",
      confirmationCode: confirmCode,
    });

    try {
      const admins = await adminRepository.listIds();
      if (admins.length > 0) {
        await notificationRepository.createMany(
          admins.map((adminId) => ({
            recipientType: "admin",
            recipientId: adminId,
            title: "New Student Signup",
            message: `${student.firstname} ${student.lastname} created a student account.`,
            type: "info",
          }))
        );
      }
    } catch (notifyError) {
      console.warn("Student signup notifications failed:", notifyError.message || notifyError);
    }

    res.status(201).send({ message: "User was registered successfully! Please check your email" });

    nodemailer.sendConfirmationEmail(
      student.firstname,
      student.email,
      student.confirmation_code
    );
  } catch (err) {
    console.error("Student signin failed:", err);
    return res.status(500).send({ message: "Login failed. Please try again later." });
  }
};

exports.signin = async (req, res) => {
  const authJwt = require("../middlewares/authJwt");

  try {
    const email = (req.body.email || "").trim().toLowerCase();
    const student = await studentRepository.findByEmail(email);

    if (!student) {
      return res.status(401).send({ message: "Invalid email or password." });
    }

    if (student.status !== "Active") {
      return res.status(401).send({
        message: "Pending Account. Please Verify Your Email!",
      });
    }

    let passwordIsValid = false;
    try {
      passwordIsValid = bcrypt.compareSync(req.body.password, student.password);
    } catch (compareError) {
      return res.status(401).send({ message: "Invalid email or password." });
    }

    if (!passwordIsValid) {
      return res.status(401).send({
        message: "Invalid email or password.",
      });
    }

    const token = jwt.sign({ email: student.email, id: student.id }, config.secret, {
      expiresIn: "24h",
    });

    const refreshToken = await refreshTokenRepository.createToken(student.id, "Student");
    authJwt.setAuthCookies(res, token, refreshToken, "student");

    return res.status(200).send({
      id: student.id,
      email: student.email,
      name: `${student.firstname} ${student.lastname}`,
      userType: "student",
    });
  } catch (err) {
    return res.status(500).send({ message: err.message || err });
  }
};

exports.verifyUser = async (req, res) => {
  try {
    const student = await studentRepository.findByConfirmationCode(req.params.confirmationCode);
    if (!student) {
      return res.status(404).send({ message: "User Not found." });
    }

    await studentRepository.verifyStudent(student.id);
    res.status(200).send({ message: "Account Verified!" });
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

exports.getLocation = (req, res) => {
  let query = req.query.q;
  query = query.replace(/\+/g, " ");
  location
    .geocodeText(query, "Tunisie", "FR")
    .then((result) => {
      res.status(200).send(result);
    })
    .catch(() => {
      res.status(500).send({ message: "err here" });
    });
};

exports.getAll = async (req, res) => {
  try {
    const students = await studentRepository.listAll();
    const response = students.map(mapStudentRow);
    res.status(200).send(response);
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

exports.getByName = async (req, res) => {
  try {
    if (!req.query.q) {
      return res.status(400).send({ message: "Missing search query." });
    }
    const students = await studentRepository.listAll();
    const response = [];
    students.forEach((doc) => {
      const name = `${doc.firstname} ${doc.lastname}`;
      if (stringSimilarity.compareTwoStrings(name.toLowerCase(), req.query.q.toLowerCase()) > 0.45) {
        response.push(mapStudentRow(doc));
      }
    });
    res.status(200).send(response);
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

exports.getStudentLocations = async (req, res) => {
  const allowed = {
    country: "country",
    city: "city",
    class: "\"class\"",
    promotion: "promotion",
  };
  const column = allowed[req.query.property];
  if (!column || !req.query.key) {
    return res.status(400).send({ message: "Invalid search parameters." });
  }

  try {
    const docs = await studentRepository.searchByKey(column, req.query.key);
    const response = docs.map((doc) => ({
      id: doc.id,
      lat: doc.latitude,
      lng: doc.longitude,
      name: `${doc.firstname} ${doc.lastname}`,
    }));
    res.status(200).send(response);
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

exports.getByKey = async (req, res) => {
  const allowed = {
    firstname: "firstname",
    lastname: "lastname",
    email: "email",
    country: "country",
    city: "city",
    class: "\"class\"",
    promotion: "promotion",
    type: "type",
  };
  const column = allowed[req.query.property];
  if (!column || !req.query.key) {
    return res.status(400).send({ message: "Invalid search parameters." });
  }

  try {
    const docs = await studentRepository.searchByKey(column, req.query.key);
    const response = docs.map(mapStudentRow);
    res.status(200).send(response);
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

exports.getByFilters = async (req, res) => {
  const { country, city, promotion, class: className } = req.query;
  if (!country && !city && !promotion && !className) {
    return res.status(400).send({ message: "At least one filter is required" });
  }

  try {
    const docs = await studentRepository.searchByFilters({
      country,
      city,
      promotion,
      className,
    });
    res.status(200).send(docs.map(mapStudentRow));
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

exports.getStudentById = async (req, res) => {
  try {
    if (!isUuid(req.params.id)) {
      return res.status(400).send({ message: "Invalid student id." });
    }
    const student = await studentRepository.findById(req.params.id);
    if (!student) {
      return res.status(404).send({ message: "User Not found." });
    }
    return res.status(200).send(mapStudentRow(student));
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

exports.updateStudent = async (req, res) => {
  if (!isUuid(req.params.id)) {
    return res.status(400).send({ message: "Invalid student id." });
  }
  if (req.id !== req.params.id) {
    return res.status(403).send({ message: "Unauthorized!" });
  }

  try {
    const getLocation = () =>
      new Promise((resolve) => {
        location.latlng(req, res, (result) => {
          resolve(result);
        });
      });

    let locationResult = null;
    try {
      locationResult = await getLocation();
    } catch (err) {
      console.error("Location lookup failed:", err);
    }

    const updateData = {
      status: "Active",
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
    };

    if (locationResult) {
      updateData.latitude = locationResult.latitude;
      updateData.longitude = locationResult.longitude;
    }

    await studentRepository.updateStudent(req.params.id, updateData);
    return res.status(200).send({ message: "User updated" });
  } catch (err) {
    console.error("Failed to update student:", err);
    return res.status(500).send({ message: err.message || err });
  }
};

exports.companiesInfo = async (req, res) => {
  const info = [];
  if (!req.body.companies || req.body.companies.length === 0) {
    return res.status(200).send(info);
  }

  try {
    const companyIds = req.body.companies.filter((id) => isUuid(id));
    const companies = await companyRepository.findByIds(companyIds);
    companies.forEach((company) => {
      info.push({
        id: company.id,
        name: company.name,
        about: company.about,
        address: company.address,
        city: company.city,
        country: company.country,
        email: company.email,
        phone: company.phone,
        website: company.website,
        logo: company.logo,
      });
    });
    res.status(200).send(info);
  } catch (err) {
    console.error("Error finding company:", err);
    res.status(200).send(info);
  }
};

exports.deleteStudent = async (req, res) => {
  if (req.id !== req.params.id) {
    return res.status(404).send({ message: "Unauthorized!" });
  }
  try {
    const deleted = await studentRepository.deleteStudent(req.params.id);
    if (!deleted) {
      return res.status(404).send({ message: "User Not found." });
    }
    res.status(200).send({ message: "User deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: err.message || err });
  }
};
