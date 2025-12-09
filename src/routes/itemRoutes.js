const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const auth = require('../middleware/auth');

// MVP: Items visible to everyone
router.get('/', itemController.getItems);

// Admin route to add items 
router.post('/add', itemController.addItem);

// Get single item by ID
router.get('/:id', itemController.getItemById);

module.exports = router;