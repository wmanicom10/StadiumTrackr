const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');

router.post('/addStadium', userController.handleAddStadium);
router.post('/loadFavoriteStadiums', userController.handleLoadFavoriteStadiums);
router.post('/loadUserAchievements', userController.handleLoadUserAchievements);
router.post('/loadUserActivity', userController.handleLoadUserActivity);
router.post('/loadUserHomeMap', userController.handleLoadUserHomeMap);
router.post('/loadUserInfo', userController.handleLoadUserInfo);
router.post('/loadUserStadiums', userController.handleLoadUserStadiums);
router.post('/loadUserVisits', userController.handleLoadUserVisits);
router.post('/loadUserWishlist', userController.handleLoadUserWishlist);
router.post('/saveFavoriteStadiums', userController.handleSaveFavoriteStadiums);

module.exports = router;