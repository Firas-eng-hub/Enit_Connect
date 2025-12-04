const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const PORT = 3000;

const app = express();

app.use(bodyParser.json());
app.use(cors());

app.get('/', function (req, res) {
    res.send("hello from server");
})
app.post('/posts', function (req, res) {

    res.status(200).send({ "message": "data received" });
})

app.listen(PORT, function () {
    console.log("sever running on localhost:" + PORT);
})