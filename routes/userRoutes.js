const express = require('express');
const router = express.Router();

const loadUserInfoController = require('../controllers/loadUserInfoController');
const loadUserStadiumInfoController = require('../controllers/loadUserStadiumInfoController');
const loadUserStadiumsController = require('../controllers/loadUserStadiumsController');
const loadUserWishlistController = require('../controllers/loadUserWishlistController');
const loadUserAchievementsController = require('../controllers/loadUserAchievementsController');
const loadUserActivityController = require('../controllers/loadUserActivityController');
const loadUserHomeMapController = require('../controllers/loadUserHomeMapController');

router.post('/loadUserInfo', loadUserInfoController.handleLoadUserInfo);
router.post('/loadUserStadiumInfo', loadUserStadiumInfoController.handleLoadUserStadiumInfo);
router.post('/loadUserStadiums', loadUserStadiumsController.handleLoadUserStadiums);
router.post('/loadUserWishlist', loadUserWishlistController.handleLoadUserWishlist);
router.post('/loadUserAchievements', loadUserAchievementsController.handleLoadUserAchievements);
router.post('/loadUserActivity', loadUserActivityController.handleLoadUserActivity);
router.post('/loadUserHomeMap', loadUserHomeMapController.handleLoadUserHomeMap);

module.exports = router;