const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');

router.post('/deleteAccount', authController.handleDeleteAccount);
router.post('/login', authController.handleLogin);
router.post('/signup', authController.handleSignup);

module.exports = router;