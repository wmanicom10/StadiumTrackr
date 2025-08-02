const express = require('express');
const router = express.Router();

const loadUserInfoController = require('../controllers/loadUserInfoController');
const loadUserStadiumInfoController = require('../controllers/loadUserStadiumInfoController');
const loadUserStadiumsController = require('../controllers/loadUserStadiumsController');
const loadUserWishlistStadiumsController = require('../controllers/loadUserWishlistStadiumsController');

router.post('/loadUserInfo', loadUserInfoController.handleLoadUserInfo);
router.post('/loadUserStadiumInfo', loadUserStadiumInfoController.handleLoadUserStadiumInfo);
router.post('/loadUserStadiums', loadUserStadiumsController.handleLoadUserStadiums);
router.post('/loadUserWishlistStadiums', loadUserWishlistStadiumsController.handleLoadUserWishlistStadiums);

module.exports = router;