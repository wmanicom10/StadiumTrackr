const express = require('express');
const router = express.Router();

const { authMiddleware } = require('../middleware');

const updateController = require('../controllers/updateController');

router.post('/createUserList', authMiddleware, updateController.handleCreateUserList);
router.post('/deleteLog', authMiddleware, updateController.handleDeleteLog);
router.post('/deleteUserList', authMiddleware, updateController.handleDeleteUserList);
router.post('/deleteTempVisitPhoto', authMiddleware, updateController.handleDeleteTempVisitPhoto);
router.post('/deleteVisitPhoto', authMiddleware, updateController.handleDeleteVisitPhoto);
router.post('/editLog', authMiddleware, updateController.handleEditLog);
router.post('/updateEmail', authMiddleware, updateController.handleUpdateEmail);
router.post('/updatePassword', authMiddleware, updateController.handleUpdatePassword);
router.post('/updateProfilePic', authMiddleware, updateController.upload.single('profilePic'), updateController.handleUpdateProfilePic);
router.post('/updateUserList', authMiddleware, updateController.handleUpdateUserList);
router.post('/updateUsername', authMiddleware, updateController.handleUpdateUsername);
router.post('/updateUserStadium', authMiddleware, updateController.handleUpdateUserStadium);
router.post('/updateUserWishlist', authMiddleware, updateController.handleUpdateUserWishlist);
router.post('/resetPassword', updateController.handleResetPassword);

module.exports = router;