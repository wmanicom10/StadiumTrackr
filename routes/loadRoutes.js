const express = require('express');
const router = express.Router();

const loadController = require('../controllers/loadController');

router.post('/loadAboutInfo', loadController.handleLoadAboutInfo);
router.post('/loadFeaturedEvents', loadController.handleLoadFeaturedEvents);
router.post('/loadMapStadiums', loadController.handleLoadMapStadiums);
router.post('/loadPopularStadiums', loadController.handleLoadPopularStadiums);
router.post('/loadStadiumEvents', loadController.handleLoadStadiumEvents);
router.post('/loadStadiumInfo', loadController.handleLoadStadiumInfo);
router.post('/loadStadiumMap', loadController.handleLoadStadiumMap);
router.post('/loadStadiums', loadController.handleLoadStadiums);
router.post('/loadUserEvents', loadController.handleLoadUserEvents);
router.post('/searchStadiums', loadController.handleSearchStadiums);

module.exports = router;