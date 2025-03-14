const express = require('express');
const router = express.Router();

const loadStadiumInfoController = require('../controllers/loadStadiumInfoController');
const loadStadiumsController = require('../controllers/loadStadiumsController');
const addStadiumController = require('../controllers/addStadiumController');

router.post('/loadStadiumInfo', loadStadiumInfoController.handleLoadStadiumInfo);
router.post('/loadStadiums', loadStadiumsController.handleLoadStadiums);
router.post('/addStadium', addStadiumController.handleAddStadium);

module.exports = router;