const express = require('express');
const router = express.Router();

const loadUserInfoController = require('../controllers/loadUserInfoController');
const loadUserStadiumInfoController = require('../controllers/loadUserStadiumInfoController');
const loadUserStadiumsController = require('../controllers/loadUserStadiumsController');
const loadUserWishlistController = require('../controllers/loadUserWishlistController');
const loadUserAchievementsController = require('../controllers/loadUserAchievementsController');
const loadUserActivityController = require('../controllers/loadUserActivityController');
const loadUserHomeMapController = require('../controllers/loadUserHomeMapController');
const updateUsernameController = require('../controllers/updateUsernameController');
const updateProfilePicController = require('../controllers/updateProfilePicController');
const updateEmailController = require('../controllers/updateEmailController');
const updatePasswordController = require('../controllers/updatePasswordController');
const deleteAccountController = require('../controllers/deleteAccountController');
const saveFavoriteStadiumsController = require('../controllers/saveFavoriteStadiumsController');
const loadFavoriteStadiumsController = require('../controllers/loadFavoriteStadiumsController');

router.post('/loadUserInfo', loadUserInfoController.handleLoadUserInfo);
router.post('/loadUserStadiumInfo', loadUserStadiumInfoController.handleLoadUserStadiumInfo);
router.post('/loadUserStadiums', loadUserStadiumsController.handleLoadUserStadiums);
router.post('/loadUserWishlist', loadUserWishlistController.handleLoadUserWishlist);
router.post('/loadUserAchievements', loadUserAchievementsController.handleLoadUserAchievements);
router.post('/loadUserActivity', loadUserActivityController.handleLoadUserActivity);
router.post('/loadUserHomeMap', loadUserHomeMapController.handleLoadUserHomeMap);
router.post('/updateUsername', updateUsernameController.handleUpdateUsername);
router.post('/updateProfilePic', updateProfilePicController.upload.single('profilePic'), updateProfilePicController.handleUpdateProfilePic);
router.post('/updateEmail', updateEmailController.handleUpdateEmail);
router.post('/updatePassword', updatePasswordController.handleUpdatePassword);
router.post('/deleteAccount', deleteAccountController.handleDeleteAccount);
router.post('/saveFavoriteStadiums', saveFavoriteStadiumsController.handleSaveFavoriteStadiums);
router.post('/loadFavoriteStadiums', loadFavoriteStadiumsController.handleLoadFavoriteStadiums);

module.exports = router;