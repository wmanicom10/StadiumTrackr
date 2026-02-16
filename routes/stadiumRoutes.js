const express = require('express');
const router = express.Router();

const loadStadiumInfoController = require('../controllers/loadStadiumInfoController');
const loadStadiumsController = require('../controllers/loadStadiumsController');
const searchStadiumsController = require('../controllers/searchStadiumsController');
const loadMapStadiumsController = require('../controllers/loadMapStadiumsController');
const loadStadiumMapController = require('../controllers/loadStadiumMapController');

router.post('/loadStadiumInfo', loadStadiumInfoController.handleLoadStadiumInfo);
router.post('/loadStadiums', loadStadiumsController.handleLoadStadiums);
router.post('/searchStadiums', searchStadiumsController.handleSearchStadiums);
router.post('/loadMapStadiums', loadMapStadiumsController.handleLoadMapStadiums);
router.post('/loadStadiumMap', loadStadiumMapController.handleLoadStadiumMap);

module.exports = router;