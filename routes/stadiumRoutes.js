const express = require('express');
const router = express.Router();

const loadStadiumInfoController = require('../controllers/loadStadiumInfoController');
const loadStadiumsController = require('../controllers/loadStadiumsController');
const addStadiumController = require('../controllers/addStadiumController');
const removeStadiumController = require('../controllers/removeStadiumController');
const searchStadiumsController = require('../controllers/searchStadiumsController');
const loadMapStadiumsController = require('../controllers/loadMapStadiumsController');
const loadStadiumMapController = require('../controllers/loadStadiumMapController');
const updateUserActivityController = require('../controllers/updateUserActivityController');
const loadUserHomeMapController = require('../controllers/loadUserHomeMapController');

router.post('/loadStadiumInfo', loadStadiumInfoController.handleLoadStadiumInfo);
router.post('/loadStadiums', loadStadiumsController.handleLoadStadiums);
router.post('/addStadium', addStadiumController.handleAddStadium);
router.post('/removeStadium', removeStadiumController.handleRemoveStadium);
router.post('/searchStadiums', searchStadiumsController.handleSearchStadiums);
router.post('/loadMapStadiums', loadMapStadiumsController.handleLoadMapStadiums);
router.post('/loadStadiumMap', loadStadiumMapController.handleLoadStadiumMap);
router.post('/updateUserStadium', updateUserActivityController.handleUpdateUserStadium);
router.post('/updateUserWishlist', updateUserActivityController.handleUpdateUserWishlist);
router.post('/loadUserHomeMap', loadUserHomeMapController.handleLoadUserHomeMap);

module.exports = router;