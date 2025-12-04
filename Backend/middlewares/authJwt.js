const jwt = require("jsonwebtoken");
const config = require("../config/auth.config.js");
const db = require("../models");
const Company = db.company;
const Student = db.student;
const Admin = db.admin;



exports.verifyToken = (req, res, next) => {
  let token = req.headers["authorization"];
  if (!token) {
    return res.status(403).send({ message: "No token provided !" });
  }
  token = token.split(' ')[1];

  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized!" });
    }
    req.id = decoded.id;
    next();
  });
};

exports.isAdmin = ( req, res, next ) => {
  Admin.findById({ _id: req.id }).then((admin) => {
    if (!admin) {
      res.status(401).send({ message: "Unauthorized!" });
    } else {
      next();
    }
  }).catch(
    err => {
      res.status(500).send({ message: "error" + err });
  });
};

exports.isStudent = ( req, res, next ) => {
  Student.findById({ _id: req.id }).then((student) => {
    if (!student) {
      res.status(401).send({ message: "Unauthorized!" });
    } else {
      next();
    }
  }).catch(
    err => {
      res.status(500).send({ message: "error" + err });
  });
};

exports.isCompany = ( req, res, next ) => {
  Company.findById({ _id: req.query.id }).then((company) => {
    if (!company) {
      res.status(401).send({ message: "Unauthorized!" });
    } else {
      next();
    }
  }).catch(
    err => {
      res.status(500).send({ message: "error " + err });
  });
};