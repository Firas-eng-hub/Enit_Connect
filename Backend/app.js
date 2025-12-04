const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const dotenv = require('dotenv');
const trimmer = require('express-trimmer');
dotenv.config({ path: '.env' })
const student_routes = require("./routes/student.routes");
const admin_routes = require("./routes/admin.routes");
const company_routes = require("./routes/company.routes");
const offer_routes = require("./routes/offer.routes");
const app = express();
const path = require('path');

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
    return res.status(200).json({});
  }
  next();
});



app.use(trimmer);

const db = require("./models");
const dbConfig = require("./config/db.config");
//`mongodb://${dbConfig.HOST}:${dbConfig.PORT}/${dbConfig.DB}`
//`mongodb+srv://${dbConfig.user}:${dbConfig.pwd}@${dbConfig.domain}/${dbConfig.DB}?retryWrites=true&w=majority`
db.mongoose
  .connect(`mongodb+srv://${dbConfig.user}:${dbConfig.pwd}@${dbConfig.domain}/${dbConfig.DB}?retryWrites=true&w=majority`, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log("Successfully connect to MongoDB.");
  })
  .catch(err => {
    console.error("Connection error", err);
    process.exit();
  });

db.mongoose.set('useCreateIndex', true);

//Home Page
app.get("/", (req, res) => {
  res.json({ message: "Welcome to TIC-ENIT API." });
});

//Routes
// Static files (if needed in future)
app.use("/admin", admin_routes);
app.use("/student", student_routes);
app.use("/company", company_routes);
app.use("/offers", offer_routes);

module.exports = app;
