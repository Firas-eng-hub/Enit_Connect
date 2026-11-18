const { studentRepository } = require("../repositories");
const { serverError } = require("../utils/http");
const { pickAllowed } = require("../utils/validation");
const { snapCoord, isValidLatLng } = require("../utils/geo");

const SEARCHABLE_COLUMNS = {
  firstname: "firstname",
  lastname: "lastname",
  country: "country",
  city: "city",
  class: "\"class\"",
  promotion: "promotion",
  type: "type",
};

// Map projection: directory-safe fields only (see mapStudentDirectoryRow in
// student.controller.js) plus city-level coordinates. Never email, phone,
// address or raw geocoded coordinates.
const toMapPerson = (row) => {
  if (!row || row.status !== "Active") return null;
  const lat = snapCoord(row.latitude);
  const lng = snapCoord(row.longitude);
  if (!isValidLatLng(lat, lng)) return null;
  return {
    id: row.id,
    name: `${row.firstname || ""} ${row.lastname || ""}`.trim(),
    picture: row.picture || null,
    type: row.type || null,
    promotion: row.promotion || null,
    class: row.class || null,
    workAt: row.work_at || null,
    city: row.city || null,
    country: row.country || null,
    lat,
    lng,
  };
};

exports.toMapPerson = toMapPerson;

exports.getStudentLocations = async (req, res) => {
  const column = pickAllowed(SEARCHABLE_COLUMNS, req.query.property);
  if (!column) {
    return res.status(400).send({ message: "Invalid search parameters." });
  }

  try {
    const key = typeof req.query.key === "string" ? req.query.key.trim() : "";
    const rows = key
      ? await studentRepository.searchByKey(column, key)
      : await studentRepository.listAll();
    const people = rows.map(toMapPerson).filter(Boolean);
    res.status(200).send(people);
  } catch (err) {
    serverError(res, err);
  }
};
