const express = require('express');
const router = express.Router();

const loadLeaguesController = require('../controllers/loadLeaguesController');

router.post('/loadLeagues', loadLeaguesController.handleLoadLeagues);

module.exports = router;
