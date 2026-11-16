// Log the real error server-side; never leak internal error text to clients.
const serverError = (res, err, message = "Internal server error.") => {
  console.error(err);
  return res.status(500).send({ message });
};

module.exports = { serverError };
