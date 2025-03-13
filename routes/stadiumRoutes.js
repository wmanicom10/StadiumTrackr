const express = require('express');
const router = express.Router();

const loadStadiumInfoController = require('../controllers/loadStadiumInfoController');
const addStadiumController = require('../controllers/addStadiumController');

router.post('/loadStadiumInfo', loadStadiumInfoController.handleLoadStadiumInfo);
router.post('/addStadium', addStadiumController.handleAddStadium);

module.exports = router;