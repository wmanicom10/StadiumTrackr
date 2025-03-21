const express = require('express');
const router = express.Router();

const loadUserInfoController = require('../controllers/loadUserInfoController');
const loadUserStadiumInfoController = require('../controllers/loadUserStadiumInfoController');

router.post('/loadUserInfo', loadUserInfoController.handleLoadUserInfo);
router.post('/loadUserStadiumInfo', loadUserStadiumInfoController.handleLoadUserStadiumInfo);

module.exports = router;