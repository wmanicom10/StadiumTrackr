const express = require('express');
const router = express.Router();

const loadUserInfoController = require('../controllers/loadUserInfoController');

router.post('/loadUserInfo', loadUserInfoController.handleLoadUserInfo);

module.exports = router;