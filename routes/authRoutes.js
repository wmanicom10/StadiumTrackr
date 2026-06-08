const express = require('express');
const router = express.Router();

const { authMiddleware } = require('../middleware');

const authController = require('../controllers/authController');

router.post('/deleteAccount', authMiddleware, authController.handleDeleteAccount);
router.post('/login', authController.handleLogin);
router.post('/signup', authController.handleSignup);

module.exports = router;