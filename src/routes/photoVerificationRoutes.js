// routes/photoVerificationRoutes.js
const express = require('express');
const router = express.Router();
const { verifyPhotoWithLLM } = require('../services/llmToolVerification');

// POST /api/verify/photo
router.post('/photo', async (req, res) => {
  try {
    const { taskId, userId, photoUrl, capturedLocation } = req.body;

    // Basic validation
    if (!taskId || !userId || !photoUrl || !capturedLocation) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const photoData = { taskId, userId, photoUrl, capturedLocation };
    const result = await verifyPhotoWithLLM(photoData);

    return res.json(result);
  } catch (err) {
    console.error('Photo Verification Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
