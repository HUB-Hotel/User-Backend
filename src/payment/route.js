const express = require('express');
const router = express.Router();
const paymentController = require('./controller');

// POST /api/payments/complete
router.post('/complete', paymentController.completePayment);

module.exports = router;