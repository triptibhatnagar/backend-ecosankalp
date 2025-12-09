const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const mediaController = require('../controllers/mediaController');

// Upload media
router.post('/upload', upload.single('media'), mediaController.uploadMedia);

// Get all media (with pagination)
router.get('/', mediaController.getAllMedia);

// Get media by ID
router.get('/:id', mediaController.getMediaById);

// Find nearby media for a specific location
router.get('/nearby/:id', mediaController.getNearbyMedia);

// Delete media
router.delete('/:id', mediaController.deleteMedia);

module.exports = router;
