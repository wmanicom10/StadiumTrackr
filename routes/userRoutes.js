const express = require('express');
const router = express.Router();

const loadUserInfoController = require('../controllers/loadUserInfoController');
const loadUserStadiumInfoController = require('../controllers/loadUserStadiumInfoController');
const loadUserStadiumsController = require('../controllers/loadUserStadiumsController');
const loadUserWishlistStadiumsController = require('../controllers/loadUserWishlistStadiumsController');
const loadUserAchievementsController = require('../controllers/loadUserAchievementsController');

router.post('/loadUserInfo', loadUserInfoController.handleLoadUserInfo);
router.post('/loadUserStadiumInfo', loadUserStadiumInfoController.handleLoadUserStadiumInfo);
router.post('/loadUserStadiums', loadUserStadiumsController.handleLoadUserStadiums);
router.post('/loadUserWishlistStadiums', loadUserWishlistStadiumsController.handleLoadUserWishlistStadiums);
router.post('/loadUserAchievements', loadUserAchievementsController.handleLoadUserAchievements);

module.exports = router;