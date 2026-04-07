const express = require('express');
const router = express.Router();

const loadStadiumInfoController = require('../controllers/loadStadiumInfoController');
const loadStadiumsController = require('../controllers/loadStadiumsController');
const searchStadiumsController = require('../controllers/searchStadiumsController');
const loadMapStadiumsController = require('../controllers/loadMapStadiumsController');
const loadStadiumMapController = require('../controllers/loadStadiumMapController');
const loadPopularStadiumsController = require('../controllers/loadPopularStadiumsController');
const loadUpcomingEventsController = require('../controllers/loadUpcomingEventsController');
const loadEventsController = require('../controllers/loadEventsController');
const loadAboutInfoController = require('../controllers/loadAboutInfoController');

router.post('/loadStadiumInfo', loadStadiumInfoController.handleLoadStadiumInfo);
router.post('/loadStadiums', loadStadiumsController.handleLoadStadiums);
router.post('/searchStadiums', searchStadiumsController.handleSearchStadiums);
router.post('/loadMapStadiums', loadMapStadiumsController.handleLoadMapStadiums);
router.post('/loadStadiumMap', loadStadiumMapController.handleLoadStadiumMap);
router.post('/loadPopularStadiums', loadPopularStadiumsController.handleLoadPopularStadiums);
router.post('/loadUpcomingEvents', loadUpcomingEventsController.handleLoadUpcomingEvents);
router.post('/loadLoggedOutEvents', loadEventsController.handleLoadLoggedOutEvents);
router.post('/loadLoggedInEvents', loadEventsController.handleLoadLoggedInEvents);
router.post('/loadStadiumEvents', loadEventsController.handleLoadStadiumEvents);
router.post('/loadAboutInfo', loadAboutInfoController.handleLoadAboutInfo);

module.exports = router;