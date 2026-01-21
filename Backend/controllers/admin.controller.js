const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { generateVerificationCode, getVerificationExpiry } = require("../utils/verification");
const config = require("../config/auth.config");
const nodemailer = require("../config/nodemailer.config");
const location = require("../config/geocoder.config");
const fs = require("fs");
const {
  studentRepository,
  companyRepository,
  adminRepository,
  offerRepository,
  documentRepository,
  messageRepository,
  newsRepository,
  notificationRepository,
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

const mapCompanyRow = (row) => ({
  name: row.name,
  email: row.email,
  status: row.status,
  country: row.country,
  city: row.city,
  address: row.address,
  phone: row.phone,
  website: row.website,
  logo: row.logo,
  about: row.about,
  latitude: row.latitude,
  longitude: row.longitude,
  id: row.id,
  _id: row.id,
});

exports.getNews = async (req, res) => {
  try {
    const docs = await newsRepository.listAll();
    const response = docs.map(newsRepository.mapNewsRow);
    res.status(200).send(response);
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

exports.deleteNews = async (req, res) => {
  try {
    const deleted = await newsRepository.deleteNews(req.params.id);
    if (!deleted) {
      return res.status(404).send({ message: "News not found." });
    }
    res.status(200).send({ message: "News deleted !" });
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

exports.newsDoc = (req, res) => {
  let filePath = `${process.env.BASE_URL}/uploads/`;
  if (req.file && req.file.filename) {
    filePath += req.file.filename;
    res.status(201).send({ link: filePath, name: req.file.originalname });
  } else {
    return res.status(500).send({ message: "Error !" });
  }
};

exports.addNews = async (req, res) => {
  const dateValue = req.body.date || new Date().toISOString();
  const audienceValue =
    Array.isArray(req.body.audience) && req.body.audience.length
      ? req.body.audience
      : ["visitor", "student", "company"];
  const statusValue = req.body.status || "published";
  const tagsValue = Array.isArray(req.body.tags) ? req.body.tags : [];

  try {
    const news = await newsRepository.createNews({
      title: req.body.title,
      content: req.body.content,
      date: dateValue,
      picture: req.body.picture,
      docs: req.body.docs,
      status: statusValue,
      audience: audienceValue,
      category: req.body.category,
      tags: tagsValue,
    });

    if (statusValue === "published") {
      try {
        const notifications = [];
        if (audienceValue.includes("student")) {
          const students = await studentRepository.listIds();
          students.forEach((studentId) => {
            notifications.push({
              recipientType: "student",
              recipientId: studentId,
              title: "News Published",
              message: `"${news.title}" is now available.`,
              type: "info",
            });
          });
        }
        if (audienceValue.includes("company")) {
          const companies = await companyRepository.listIds();
          companies.forEach((companyId) => {
            notifications.push({
              recipientType: "company",
              recipientId: companyId,
              title: "News Published",
              message: `"${news.title}" is now available.`,
              type: "info",
            });
          });
        }
        if (notifications.length > 0) {
          await notificationRepository.createMany(notifications);
        }
      } catch (notifyError) {
        console.warn("News notifications failed:", notifyError.message || notifyError);
      }
    }

    res.status(201).send({ message: "News was added successfully!" });
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

exports.updateNews = async (req, res) => {
  const dateValue = req.body.date || new Date().toISOString();
  const audienceValue =
    Array.isArray(req.body.audience) && req.body.audience.length
      ? req.body.audience
      : ["visitor", "student", "company"];
  const statusValue = req.body.status || "published";
  const tagsValue = Array.isArray(req.body.tags) ? req.body.tags : [];

  try {
    const existing = await newsRepository.findById(req.params.id);
    if (!existing) {
      return res.status(404).send({ message: "News not found." });
    }

    const updated = await newsRepository.updateNews(req.params.id, {
      title: req.body.title,
      content: req.body.content,
      date: dateValue,
      picture: req.body.picture,
      docs: req.body.docs,
      status: statusValue,
      audience: audienceValue,
      category: req.body.category,
      tags: tagsValue,
    });

    const wasPublished = existing.status === "published";
    const isPublished = statusValue === "published";

    if (!wasPublished && isPublished) {
      try {
        const notifications = [];
        if (audienceValue.includes("student")) {
          const students = await studentRepository.listIds();
          students.forEach((studentId) => {
            notifications.push({
              recipientType: "student",
              recipientId: studentId,
              title: "News Published",
              message: `"${updated.title}" is now available.`,
              type: "info",
            });
          });
        }
        if (audienceValue.includes("company")) {
          const companies = await companyRepository.listIds();
          companies.forEach((companyId) => {
            notifications.push({
              recipientType: "company",
              recipientId: companyId,
              title: "News Published",
              message: `"${updated.title}" is now available.`,
              type: "info",
            });
          });
        }
        if (notifications.length > 0) {
          await notificationRepository.createMany(notifications);
        }
      } catch (notifyError) {
        console.warn("News notifications failed:", notifyError.message || notifyError);
      }
    }

    res.status(200).send({ message: "News was updated successfully!" });
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const deleted = await messageRepository.deleteMessage(req.params.id);
    if (!deleted) {
      return res.status(404).send({ message: "Message not found." });
    }
    res.status(200).send({ message: "Message deleted !" });
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

exports.getNbMessage = async (req, res) => {
  try {
    const count = await messageRepository.countUnread();
    res.status(200).send({ nb: count });
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

exports.getMessage = async (req, res) => {
  try {
    const includeArchived = req.query.includeArchived === "true";
    const docs = await messageRepository.listAll({ includeArchived });
    const response = docs.map(messageRepository.mapMessageRow);
    res.status(200).send(response);
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

exports.markMessageRead = async (req, res) => {
  try {
    const read = Boolean(req.body.read);
    const updated = await messageRepository.updateReadStatus(req.params.id, read);
    if (!updated) {
      return res.status(404).send({ message: "Message not found." });
    }
    res.status(200).send({ message: "Message updated." });
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

exports.archiveMessage = async (req, res) => {
  try {
    const archived = Boolean(req.body.archived);
    const updated = await messageRepository.updateArchiveStatus(req.params.id, archived);
    if (!updated) {
      return res.status(404).send({ message: "Message not found." });
    }
    res.status(200).send({ message: "Message updated." });
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

exports.bulkUpdateMessages = async (req, res) => {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
    const read = req.body.read;
    const archived = req.body.archived;

    if (!ids.length) {
      return res.status(400).send({ message: "No message ids provided." });
    }

    const updated = await messageRepository.bulkUpdate({ ids, read, archived });
    res.status(200).send({ updated: updated.length });
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

exports.markAllMessagesRead = async (req, res) => {
  try {
    await messageRepository.markAllRead();
    res.status(200).send({ message: "Messages updated." });
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

exports.markAllMessagesUnread = async (req, res) => {
  try {
    await messageRepository.markAllUnread();
    res.status(200).send({ message: "Messages updated." });
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

exports.saveMessage = async (req, res) => {
  try {
    await messageRepository.createMessage({
      name: req.body.name,
      email: req.body.email,
      date: req.body.date,
      message: req.body.message,
      read: req.body.lu,
    });
    res.status(201).send({ message: "Message was sent successfully!" });
  } catch (err) {
    res.status(500).send({ message: err.message || err });
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

exports.getDocuments = async (req, res) => {
  try {
    const docs = await documentRepository.listByEmplacement(req.body.emp);
    res.status(200).send(docs.map(documentRepository.mapDocumentRow));
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

exports.signin = async (req, res) => {
  const authJwt = require("../middlewares/authJwt");

  try {
    const email = (req.body.email || "").trim().toLowerCase();
    const admin = await adminRepository.findByEmail(email);

    if (!admin) {
      return res.status(401).send({ message: "Invalid email or password." });
    }

    if (req.body.password !== admin.password) {
      return res.status(401).send({
        message: "Invalid email or password.",
      });
    }

    const token = jwt.sign({ email: admin.email, id: admin.id }, config.secret, { expiresIn: "24h" });
    const refreshToken = await refreshTokenRepository.createToken(admin.id, "Admin");

    authJwt.setAuthCookies(res, token, refreshToken, "admin");

    return res.status(200).send({
      name: "Administrator",
      id: admin.id,
      email: admin.email,
      userType: "admin",
    });
  } catch (err) {
    console.error("Admin signin failed:", err);
    return res.status(500).send({ message: "Login failed. Please try again later." });
  }
};

exports.getAllStudents = async (req, res) => {
  try {
    const docs = await studentRepository.listAll();
    res.status(200).send(docs.map(mapStudentRow));
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

exports.getAllCompanies = async (req, res) => {
  try {
    const docs = await companyRepository.listAll();
    res.status(200).send(docs.map(mapCompanyRow));
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

exports.sendEmail = (req, res) => {
  nodemailer.sendSearchEmail(req.body.emails, req.body.object, req.body.message);
  return res.status(201).send({ message: "Email has been sent!" });
};

exports.getStudentsByKey = async (req, res) => {
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
    res.status(200).send(docs.map(mapStudentRow));
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

exports.getCompaniesByKey = async (req, res) => {
  const allowed = {
    name: "name",
    email: "email",
    country: "country",
    city: "city",
    address: "address",
    phone: "phone",
    website: "website",
  };
  const column = allowed[req.query.property];
  if (!column || !req.query.key) {
    return res.status(400).send({ message: "Invalid search parameters." });
  }
  try {
    const docs = await companyRepository.searchByKey(column, req.query.key);
    res.status(200).send(docs.map(mapCompanyRow));
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

exports.getStudentById = async (req, res) => {
  if (!isUuid(req.params.id)) {
    return res.status(400).send({ message: "Invalid student id." });
  }
  try {
    const student = await studentRepository.findById(req.params.id);
    if (!student) {
      return res.status(404).send({ message: "User Not found." });
    }
    return res.status(200).send(mapStudentRow(student));
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

exports.getCompanyById = async (req, res) => {
  if (!isUuid(req.params.id)) {
    return res.status(400).send({ message: "Invalid company id." });
  }
  try {
    const company = await companyRepository.findById(req.params.id);
    if (!company) {
      return res.status(404).send({ message: "Company Not found." });
    }
    const offers = await offerRepository.listOffersByCompany(company.id);
    const response = offers.map((offer) => offerRepository.mapOfferRow(offer, []));
    return res.status(200).send({
      id: company.id,
      name: company.name,
      email: company.email,
      status: company.status,
      country: company.country,
      city: company.city,
      address: company.address,
      phone: company.phone,
      website: company.website,
      logo: company.logo,
      about: company.about,
      latitude: company.latitude,
      longitude: company.longitude,
      offers: response,
    });
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

exports.updateStudent = async (req, res) => {
  try {
    if (!isUuid(req.params.id)) {
      return res.status(400).send({ message: "Invalid student id." });
    }
    const updated = await studentRepository.updateStudent(req.params.id, {
      status: "Active",
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      email: req.body.email,
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
      latitude: req.body.latitude,
      longitude: req.body.longitude,
    });
    if (!updated) {
      return res.status(404).send({ message: "User Not found." });
    }
    res.status(200).send({ message: "User updated" });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: err.message || err });
  }
};

exports.updateCompany = async (req, res) => {
  try {
    if (!isUuid(req.params.id)) {
      return res.status(400).send({ message: "Invalid company id." });
    }
    const updated = await companyRepository.updateCompany(req.params.id, {
      status: "Active",
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
    if (!updated) {
      return res.status(404).send({ message: "Company Not found." });
    }
    res.status(200).send({ message: "Company updated" });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: err.message || err });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    if (!isUuid(req.params.id)) {
      return res.status(400).send({ message: "Invalid student id." });
    }
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

exports.deleteCompany = async (req, res) => {
  try {
    if (!isUuid(req.params.id)) {
      return res.status(400).send({ message: "Invalid company id." });
    }
    const deleted = await companyRepository.deleteCompany(req.params.id);
    if (!deleted) {
      return res.status(404).send({ message: "Company Not found." });
    }
    res.status(200).send({ message: "Company deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: err.message || err });
  }
};

exports.deleteStudents = async (req, res) => {
  const ids = req.body.deleteArray || [];
  try {
    for (const id of ids) {
      if (isUuid(id)) {
        // eslint-disable-next-line no-await-in-loop
        await studentRepository.deleteStudent(id);
      }
    }
    res.status(200).send({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: err.message || err });
  }
};

exports.deleteCompanies = async (req, res) => {
  const ids = req.body.deleteArray || [];
  try {
    for (const item of ids) {
      const id = item.id || item;
      if (isUuid(id)) {
        // eslint-disable-next-line no-await-in-loop
        await companyRepository.deleteCompany(id);
      }
    }
    res.status(200).send({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: err.message || err });
  }
};

exports.addStudents = async (req, res) => {
  const st = Array.isArray(req.body.students) ? req.body.students : [req.body];
  try {
    for (const item of st) {
      const plainPassword = item.password || "123456789";
      const hash = await bcrypt.hash(plainPassword, 10);
      let confirmCode = generateVerificationCode();
      const verificationExpiresAt = getVerificationExpiry();
      while (await studentRepository.findByConfirmationCode(confirmCode)) {
        confirmCode = generateVerificationCode();
      }
      const student = await studentRepository.createStudent({
        firstname: item.firstname,
        lastname: item.lastname,
        email: item.email,
        password: hash,
        confirmationCode: confirmCode,
        verificationExpiresAt,
        verificationAttempts: 0,
        type: item.type,
        status: "Pending",
      });
      nodemailer.sendConfirmationEmail(
        student.firstname,
        student.email,
        student.confirmation_code
      );
    }
    return res.status(200).send({ message: "Users were registered successfully!" });
  } catch (err) {
    return res.status(500).send({ message: err.message || err });
  }
};

exports.addCompany = async (req, res) => {
  try {
    const hash = await bcrypt.hash(req.body.password, 10);
    let confirmCode = generateVerificationCode();
    const verificationExpiresAt = getVerificationExpiry();
    while (await companyRepository.findByConfirmationCode(confirmCode)) {
      confirmCode = generateVerificationCode();
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

    await companyRepository.createCompany({
      status: "Pending",
      name: req.body.name,
      email: req.body.email,
      password: hash,
      confirmationCode: confirmCode,
      verificationExpiresAt,
      verificationAttempts: 0,
      country: req.body.country,
      address: req.body.address,
      city: req.body.city,
      website: req.body.website,
      phone: req.body.phone,
      about: req.body.about,
      logo: req.body.logo,
      latitude,
      longitude,
    });

    nodemailer.sendConfirmationEmail(
      req.body.name,
      req.body.email,
      confirmCode
    );

    return res.status(201).send({ message: "Company was registered successfully!" });
  } catch (err) {
    return res.status(500).send({ message: err.message || err });
  }
};
