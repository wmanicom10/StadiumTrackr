const express = require('express');
const router = express.Router();

const loadStadiumInfoController = require('../controllers/loadStadiumInfoController');
const loadStadiumsController = require('../controllers/loadStadiumsController');
const addStadiumController = require('../controllers/addStadiumController');
const removeStadiumController = require('../controllers/removeStadiumController');

router.post('/loadStadiumInfo', loadStadiumInfoController.handleLoadStadiumInfo);
router.post('/loadStadiums', loadStadiumsController.handleLoadStadiums);
router.post('/addStadium', addStadiumController.handleAddStadium);
router.post('/removeStadium', removeStadiumController.handleRemoveStadium);

module.exports = router;