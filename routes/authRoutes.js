const express = require('express');
const router = express.Router();

const loginController = require('../controllers/loginController');
const signupController = require('../controllers/signupController');

router.post('/login', loginController.handleLogin);
router.post('/signup', signupController.handleSignup);

module.exports = router;
