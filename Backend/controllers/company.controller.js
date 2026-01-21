const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { generateVerificationCode, getVerificationExpiry, getVerificationLimits } = require("../utils/verification");
const stringSimilarity = require("string-similarity");
const location = require("../config/geocoder.config");
const config = require("../config/auth.config");
const nodemailer = require("../config/nodemailer.config");
const {
  companyRepository,
  offerRepository,
  studentRepository,
  notificationRepository,
  adminRepository,
  refreshTokenRepository,
  documentRepository,
  documentAccessRepository,
  documentRequestRepository,
} = require("../repositories");
const { isUuid } = require("../utils/validation");

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

exports.getUserInfo = async (req, res) => {
  if (!req.params.id || !isUuid(req.params.id)) {
    return res.status(400).send({ message: "Invalid student id." });
  }

  try {
    const student = await studentRepository.findById(req.params.id);
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
      workAt: student.work_at,
      class: student.class,
      promotion: student.promotion,
      linkedin: student.linkedin,
      picture: student.picture,
      aboutme: student.aboutme,
      latitude: student.latitude,
      longitude: student.longitude,
    });
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

exports.signup = async (req, res) => {
  try {
    const hash = await bcrypt.hash(req.body.password, 10);
    const email = (req.body.email || "").trim().toLowerCase();

    const getLocation = () =>
      new Promise((resolve) => {
        location.latlng(req, res, (result) => {
          resolve(result);
        });
      });

    const locationResult = await getLocation();
    const latitude = locationResult ? locationResult.latitude : null;
    const longitude = locationResult ? locationResult.longitude : null;

    let confirmCode = generateVerificationCode();
    const verificationExpiresAt = getVerificationExpiry();
    while (await companyRepository.findByConfirmationCode(confirmCode)) {
      confirmCode = generateVerificationCode();
    }
    const company = await companyRepository.createCompany({
      name: req.body.name,
      email,
      password: hash,
      confirmationCode: confirmCode,
      verificationExpiresAt,
      verificationAttempts: 0,
      country: req.body.country,
      address: req.body.address,
      city: req.body.city,
      website: req.body.website,
      phone: req.body.phone,
      logo: req.body.logo,
      about: req.body.about,
      latitude,
      longitude,
      status: "Pending",
    });

    try {
      const admins = await adminRepository.listIds();
      if (admins.length > 0) {
        await notificationRepository.createMany(
          admins.map((adminId) => ({
            recipientType: "admin",
            recipientId: adminId,
            title: "New Company Signup",
            message: `${company.name} created a company account.`,
            type: "info",
          }))
        );
      }
    } catch (notifyError) {
      console.warn("Company signup notifications failed:", notifyError.message || notifyError);
    }

    res.status(201).send({ message: "Company was registered successfully! Please check your email." });

    nodemailer.sendConfirmationEmail(
      company.name,
      company.email,
      company.confirmation_code
    );
  } catch (err) {
    console.error("Company signin failed:", err);
    return res.status(500).send({ message: "Login failed. Please try again later." });
  }
};

exports.signin = async (req, res) => {
  const authJwt = require("../middlewares/authJwt");

  try {
    const email = (req.body.email || "").trim().toLowerCase();
    const company = await companyRepository.findByEmail(email);

    if (!company) {
      return res.status(401).send({ message: "Invalid email or password." });
    }

    if (company.status !== "Active") {
      return res.status(401).send({
        message: "Pending Account. Please Verify Your Email!",
      });
    }

    let passwordIsValid = false;
    try {
      passwordIsValid = bcrypt.compareSync(req.body.password, company.password);
    } catch (compareError) {
      return res.status(401).send({ message: "Invalid email or password." });
    }

    if (!passwordIsValid) {
      return res.status(401).send({
        message: "Invalid email or password.",
      });
    }

    const token = jwt.sign({ email: company.email, id: company.id }, config.secret, {
      expiresIn: "24h",
    });

    const refreshToken = await refreshTokenRepository.createToken(company.id, "Company");
    authJwt.setAuthCookies(res, token, refreshToken, "company");

    return res.status(200).send({
      id: company.id,
      email: company.email,
      name: company.name,
      userType: "company",
    });
  } catch (err) {
    return res.status(500).send({ message: err.message || err });
  }
};

exports.verifyCompany = async (req, res) => {
  try {
    const code = req.body.code;
    const email = (req.body.email || "").trim().toLowerCase();
    if (!code) {
      return res.status(400).send({ message: "Verification code is required." });
    }

    const { maxAttempts } = getVerificationLimits();
    const isExpired = (expiresAt) =>
      expiresAt && new Date(expiresAt).getTime() < Date.now();

    let company = null;
    if (email) {
      company = await companyRepository.findByEmail(email);
      if (!company) {
        return res.status(400).send({ message: "Invalid verification code." });
      }
      if (company.status === "Active") {
        return res.status(400).send({ message: "Account already verified." });
      }
      if ((company.verification_attempts || 0) >= maxAttempts) {
        return res.status(429).send({ message: "Too many attempts. Please request a new code." });
      }
      if (isExpired(company.verification_expires_at)) {
        return res.status(400).send({ message: "Verification code expired. Please request a new one." });
      }
      if (company.confirmation_code !== code) {
        await companyRepository.incrementVerificationAttempts(company.id);
        return res.status(400).send({ message: "Invalid verification code." });
      }
    } else {
      company = await companyRepository.findByConfirmationCode(code);
      if (!company) {
        return res.status(404).send({ message: "Company Not found." });
      }
      if (company.status === "Active") {
        return res.status(400).send({ message: "Account already verified." });
      }
      if ((company.verification_attempts || 0) >= maxAttempts) {
        return res.status(429).send({ message: "Too many attempts. Please request a new code." });
      }
      if (isExpired(company.verification_expires_at)) {
        return res.status(400).send({ message: "Verification code expired. Please request a new one." });
      }
    }

    await companyRepository.verifyCompany(company.id);
    res.status(200).send({ message: "Account Verified!" });
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

exports.resendVerificationCode = async (req, res) => {
  try {
    const email = (req.body.email || "").trim().toLowerCase();
    if (!email) {
      return res.status(400).send({ message: "Email is required." });
    }

    let confirmCode = generateVerificationCode();
    while (await companyRepository.findByConfirmationCode(confirmCode)) {
      confirmCode = generateVerificationCode();
    }

    const verificationExpiresAt = getVerificationExpiry();
    const company = await companyRepository.updateConfirmationCodeByEmail(
      email,
      confirmCode,
      verificationExpiresAt
    );
    if (company) {
      nodemailer.sendConfirmationEmail(
        company.name,
        company.email,
        company.confirmation_code
      );
    }

    return res.status(200).send({
      message: "If that email exists, a new verification code has been sent.",
    });
  } catch (err) {
    console.error("Resend company verification failed:", err);
    return res.status(500).send({ message: "Unable to resend verification code." });
  }
};

exports.listSharedDocuments = async (req, res) => {
  try {
    if (!isUuid(req.id)) {
      return res.status(401).send({ message: "Unauthorized!" });
    }

    const docs = await documentAccessRepository.listSharedDocumentsByUser({
      userId: req.id,
      userType: "company",
    });

    res.status(200).send(docs.map(documentRepository.mapDocumentRow));
  } catch (err) {
    console.error("List shared documents failed:", err);
    res.status(500).send({ message: "Failed to fetch shared documents." });
  }
};

exports.createDocumentRequest = async (req, res) => {
  try {
    if (!isUuid(req.id)) {
      return res.status(401).send({ message: "Unauthorized!" });
    }

    const studentId = req.body.studentId;
    if (!isUuid(studentId)) {
      return res.status(400).send({ message: "Invalid student id." });
    }

    const title = (req.body.title || "").trim();
    if (!title) {
      return res.status(400).send({ message: "Request title is required." });
    }

    const request = await documentRequestRepository.createRequest({
      requesterId: req.id,
      requesterType: "company",
      targetId: studentId,
      targetType: "student",
      title,
      message: req.body.message || null,
      dueDate: req.body.dueDate || null,
    });

    res.status(201).send(request);
  } catch (err) {
    console.error("Create document request failed:", err);
    res.status(500).send({ message: "Failed to create request." });
  }
};

exports.listDocumentRequests = async (req, res) => {
  try {
    if (!isUuid(req.id)) {
      return res.status(401).send({ message: "Unauthorized!" });
    }

    const requests = await documentRequestRepository.listByRequester({
      requesterId: req.id,
      requesterType: "company",
    });

    res.status(200).send(requests);
  } catch (err) {
    console.error("List requests failed:", err);
    res.status(500).send({ message: "Failed to fetch requests." });
  }
};

exports.getByKey = async (req, res) => {
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
    const response = docs.map(mapCompanyRow);
    res.status(200).send(response);
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

exports.getByName = async (req, res) => {
  if (!req.query.q) {
    return res.status(400).send({ message: "Search query is required." });
  }

  try {
    const docs = await companyRepository.listAll();
    const response = [];
    docs.forEach((doc) => {
      if (stringSimilarity.compareTwoStrings(doc.name.toLowerCase(), req.query.q.toLowerCase()) > 0.45) {
        response.push(mapCompanyRow(doc));
      }
    });
    res.status(200).send(response);
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

exports.getCompanyById = async (req, res) => {
  if (!isUuid(req.query.id)) {
    return res.status(400).send({ message: "Invalid company id." });
  }

  try {
    const company = await companyRepository.findById(req.query.id);
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
      offers: response,
    });
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

exports.getCompanyLocations = async (req, res) => {
  const allowed = {
    country: "country",
    city: "city",
    name: "name",
  };
  const column = allowed[req.query.property];
  if (!column || !req.query.key) {
    return res.status(400).send({ message: "Invalid search parameters." });
  }

  try {
    const docs = await companyRepository.searchByKey(column, req.query.key);
    const response = docs.map((doc) => ({
      lat: doc.latitude,
      lng: doc.longitude,
      name: doc.name,
      url: `${process.env.BASE_URL}/company/${doc.id}`,
    }));
    res.status(200).send(response);
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};

exports.updateCompany = async (req, res) => {
  try {
    const companyId = req.query.id || req.id;
    if (!isUuid(companyId)) {
      return res.status(400).send({ message: "Invalid company id." });
    }
    const updated = await companyRepository.updateCompany(companyId, {
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

exports.updateLogo = async (req, res) => {
  if (req.id !== req.params.id) {
    return res.status(404).send({ message: "Unauthorized!" });
  }

  try {
    if (!isUuid(req.params.id)) {
      return res.status(400).send({ message: "Invalid company id." });
    }
    const updateFields = req.file?.filename
      ? `${process.env.BASE_URL}/uploads/${req.file.filename}`
      : null;
    if (updateFields) {
      await companyRepository.updateLogo(req.params.id, updateFields);
    } else {
      await companyRepository.updateCompany(req.params.id, { status: "Active" });
    }
    res.status(200).send({ message: "Company updated" });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: err.message || err });
  }
};

exports.deleteCompany = async (req, res) => {
  if (req.id !== req.params.id) {
    return res.status(404).send({ message: "Unauthorized!" });
  }
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

exports.getAllCompanies = async (req, res) => {
  try {
    const companies = await companyRepository.listAll();
    const response = companies.map(mapCompanyRow);
    res.status(200).send(response);
  } catch (err) {
    res.status(500).send({ message: err.message || err });
  }
};
