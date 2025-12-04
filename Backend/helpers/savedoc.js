const multer = require('multer');
const storage1 = multer.diskStorage({
  destination: function (req, file, cb) {

    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + uniqueSuffix + '.' + req.query.type)
  }
})

const upload = multer({ storage: storage1 });

const savedoc = upload.single('file');

module.exports = savedoc;