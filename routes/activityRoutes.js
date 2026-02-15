const express = require('express');
const router = express.Router();

const addStadiumController = require('../controllers/addStadiumController');
const updateUserActivityController = require('../controllers/updateUserActivityController');

router.post('/addStadium', addStadiumController.handleAddStadium);
router.post('/updateUserStadium', updateUserActivityController.handleUpdateUserStadium);
router.post('/updateUserWishlist', updateUserActivityController.handleUpdateUserWishlist);
router.post('/removeActivityWishlist', updateUserActivityController.handleRemoveActivityWishlist);
router.post('/removeActivityVisited', updateUserActivityController.handleRemoveActivityVisited);
router.post('/editLog', updateUserActivityController.handleEditLog);
router.post('/deleteLog', updateUserActivityController.handleDeleteLog);

module.exports = router;