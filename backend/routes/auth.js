const express = require('express');
const { login } = require('../controllers/authController');
const { validateUserCreation } = require('../middleware/validation');

const router = express.Router();

router.post('/login', login);

module.exports = router;