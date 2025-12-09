const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const auth = require('../middleware/auth');

// BUY item
router.post('/buy', orderController.buyItem);

// My orders
router.get('/my-orders', orderController.getMyOrders);

module.exports = router;
