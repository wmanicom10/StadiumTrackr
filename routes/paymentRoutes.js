const express = require('express');
const router = express.Router();

const { authMiddleware } = require('../middleware');

const paymentController = require('../controllers/paymentController');

router.post('/createCheckoutSession', authMiddleware, paymentController.handleCreateCheckoutSession);
router.post('/createPortalSession', authMiddleware, paymentController.handleCreatePortalSession);

module.exports = router;