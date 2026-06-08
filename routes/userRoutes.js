const express = require('express');
const router = express.Router();

const { authMiddleware } = require('../middleware');

const userController = require('../controllers/userController');

router.post('/addStadium', authMiddleware, userController.handleAddStadium);
router.post('/loadFavoriteStadiums', authMiddleware, userController.handleLoadFavoriteStadiums);
router.post('/loadUserAchievements', authMiddleware, userController.handleLoadUserAchievements);
router.post('/loadUserActivity', authMiddleware, userController.handleLoadUserActivity);
router.post('/loadUserHomeMap', authMiddleware, userController.handleLoadUserHomeMap);
router.post('/loadUserInfo', authMiddleware, userController.handleLoadUserInfo);
router.post('/loadUserStadiums', authMiddleware, userController.handleLoadUserStadiums);
router.post('/loadUserVisits', authMiddleware, userController.handleLoadUserVisits);
router.post('/loadUserWishlist', authMiddleware, userController.handleLoadUserWishlist);
router.post('/saveFavoriteStadiums', authMiddleware, userController.handleSaveFavoriteStadiums);

module.exports = router;