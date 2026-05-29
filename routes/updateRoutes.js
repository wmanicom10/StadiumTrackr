const express = require('express');
const router = express.Router();

const updateController = require('../controllers/updateController');

router.post('/deleteLog', updateController.handleDeleteLog);
router.post('/editLog', updateController.handleEditLog);
router.post('/updateEmail', updateController.handleUpdateEmail);
router.post('/updatePassword', updateController.handleUpdatePassword);
router.post('/updateProfilePic', updateController.upload.single('profilePic'), updateController.handleUpdateProfilePic);
router.post('/updateUsername', updateController.handleUpdateUsername);
router.post('/updateUserStadium', updateController.handleUpdateUserStadium);
router.post('/updateUserWishlist', updateController.handleUpdateUserWishlist);

module.exports = router;