const multer = require('multer');
let storage1 = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log(req.query);
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + uniqueSuffix + '.' + req.query.type)
  }
});

let upload = multer({storage: storage1});

const newsdoc =upload.single('file');

module.exports = newsdoc;