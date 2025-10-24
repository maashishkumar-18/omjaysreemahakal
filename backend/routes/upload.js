const express = require('express');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  uploadImage,
  deleteFile
} = require('../controllers/uploadController');

const router = express.Router();

router.use(protect);

router.post('/image', upload.single('file'), uploadImage);
router.delete('/', deleteFile);

module.exports = router;