const express = require('express');
const router = express.Router();

const { authMiddleware } = require('../middleware');

const userController = require('../controllers/userController');

const rateLimit = require('express-rate-limit');

const resetLimiter = rateLimit({
    windowMs: 900000,
    max: 5,
    message: { error: 'Too many password reset requests. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false
});

router.post('/addStadium', authMiddleware, userController.handleAddStadium);
router.post('/loadFavoriteStadiums', authMiddleware, userController.handleLoadFavoriteStadiums);
router.post('/loadUserAchievements', authMiddleware, userController.handleLoadUserAchievements);
router.post('/loadUserActivity', authMiddleware, userController.handleLoadUserActivity);
router.post('/loadUserHomeMap', authMiddleware, userController.handleLoadUserHomeMap);
router.post('/loadUserInfo', authMiddleware, userController.handleLoadUserInfo);
router.post('/loadUserList', authMiddleware, userController.handleLoadUserList);
router.post('/loadUserLists', authMiddleware, userController.handleLoadUserLists);
router.post('/loadUserStadiums', authMiddleware, userController.handleLoadUserStadiums);
router.post('/loadUserVisits', authMiddleware, userController.handleLoadUserVisits);
router.post('/loadUserWishlist', authMiddleware, userController.handleLoadUserWishlist);
router.post('/refreshToken', authMiddleware, userController.handleRefreshToken);
router.post('/saveFavoriteStadiums', authMiddleware, userController.handleSaveFavoriteStadiums);
router.post('/sendPasswordReset', resetLimiter, userController.handleSendPasswordReset);

module.exports = router;