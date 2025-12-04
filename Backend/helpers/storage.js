const multer = require('multer');
const storage1 = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + uniqueSuffix + '.' + file.mimetype.split('/')[1])
  }
})

const upload = multer({ storage: storage1 });

const storage = upload.single('image');

module.exports = storage;