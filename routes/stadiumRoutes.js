const express = require('express');
const router = express.Router();

const loadStadiumInfoController = require('../controllers/loadStadiumInfoController');

router.post('/loadStadiumInfo', loadStadiumInfoController.handleLoadStadiumInfo);

module.exports = router;