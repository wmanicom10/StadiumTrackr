const express = require('express');
const router = express.Router();

const { authMiddleware, optionalAuth } = require('../middleware');

const loadController = require('../controllers/loadController');

router.post('/loadAboutInfo', loadController.handleLoadAboutInfo);
router.post('/loadCaptchaConfig', loadController.handleLoadCaptchaConfig);
router.post('/loadFeaturedEvents', loadController.handleLoadFeaturedEvents);
router.post('/loadMapStadiums', loadController.handleLoadMapStadiums);
router.post('/loadPhotoCredits', loadController.handleLoadPhotoCredits);
router.post('/loadPopularStadiums', loadController.handleLoadPopularStadiums);
router.post('/loadStadiumEvents', loadController.handleLoadStadiumEvents);
router.post('/loadStadiumInfo', optionalAuth, loadController.handleLoadStadiumInfo);
router.post('/loadStadiumMap', loadController.handleLoadStadiumMap);
router.post('/loadStadiums', optionalAuth, loadController.handleLoadStadiums);
router.post('/loadUserEvents', authMiddleware, loadController.handleLoadUserEvents);
router.post('/searchStadiums', loadController.handleSearchStadiums);

module.exports = router;