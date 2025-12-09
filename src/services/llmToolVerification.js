// services/llmToolVerification.js
const { PhotoVerification, Task, LLMToolCallLog } = require('../models');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios'); // For optional URL validation
// const sharp = require('sharp'); // For image quality checks (npm i sharp)


// --- TOOL IMPLEMENTATIONS ---
const toolFunctions = {
  // 1️⃣ Verify location
  verify_location: async ({ capturedLat, capturedLng, expectedLat, expectedLng, radiusMeters = 100 }) => {
    const R = 6371e3;
    const φ1 = capturedLat * Math.PI / 180;
    const φ2 = expectedLat * Math.PI / 180;
    const Δφ = (expectedLat - capturedLat) * Math.PI / 180;
    const Δλ = (expectedLng - capturedLng) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return {
      distance: Math.round(distance),
      withinRadius: distance <= radiusMeters,
      status: distance <= radiusMeters
    };
  },

  // 2️⃣ Analyze photo quality using sharp
  analyze_photo_quality: async ({ photoUrl }) => {
    try {
      const response = await axios.get(photoUrl, { responseType: 'arraybuffer' });
      const imageBuffer = Buffer.from(response.data);

      const metadata = await sharp(imageBuffer).metadata();
      const isBlurry = metadata.width < 500 || metadata.height < 500; // simple check
      const brightness = metadata.isProgressive ? 'normal' : 'low'; // placeholder

      return {
        isBlurry,
        brightness,
        isAuthentic: true, // we assume true
        qualityScore: isBlurry ? 40 : 90
      };
    } catch (err) {
      return { error: 'Failed to fetch or analyze image', raw: err.message };
    }
  },

  // 3️⃣ Detect required objects (placeholder)
  detect_required_objects: async ({ photoUrl, requiredObjects }) => {
    // For now, assume all objects are present
    const detectedObjects = requiredObjects.map(label => ({
      label,
      present: true,
      confidence: 0.9
    }));

    return {
      detectedObjects,
      foundObjects: requiredObjects,
      missingObjects: [],
      status: true
    };
  },

  // 4️⃣ Save verification result
  save_verification_result: async ({ verificationData }) => {
    const verification = new PhotoVerification(verificationData);
    await verification.save();

    await Task.findByIdAndUpdate(verificationData.taskId, {
      status: verificationData.geminiAnalysis.overallVerification.status === 'verified'
        ? 'completed'
        : 'rejected'
    });

    return { success: true, verificationId: verification.verificationId };
  }
};


// --- MAIN FUNCTION ---
async function verifyPhotoWithLLM(photoData) {
  const verificationId = uuidv4();
  const start = Date.now();

  // 1️⃣ Fetch Task
  const task = await Task.findOne({
    $or: [
      { _id: photoData.taskId },
      { taskId: photoData.taskId }
    ]
  });
  if (!task) throw new Error('Task not found');

  // 2️⃣ Expected Data
  const [expectedLng, expectedLat] = task.expectedLocation.coordinates;
  const requiredObjects = task.verificationRequirements.requiredObjects || [];

  // 3️⃣ Perform tool calls
  const locationRes = await toolFunctions.verify_location({
    capturedLat: photoData.capturedLocation.lat,
    capturedLng: photoData.capturedLocation.lng,
    expectedLat,
    expectedLng,
    radiusMeters: task.expectedLocation.radius
  });

  const qualityRes = await toolFunctions.analyze_photo_quality({
    photoUrl: photoData.photoUrl
  });

  const objectsRes = await toolFunctions.detect_required_objects({
    photoUrl: photoData.photoUrl,
    requiredObjects
  });

  // 4️⃣ Decision logic
  const decision = {
    status: locationRes.withinRadius && !qualityRes.isBlurry && objectsRes.status
      ? 'verified'
      : 'manual_review',
    confidence: Number((
      (locationRes.withinRadius ? 0.4 : 0) +
      (!qualityRes.isBlurry ? 0.3 : 0) +
      (objectsRes.status ? 0.3 : 0)
    ).toFixed(2)),
    reasoning: `location:${locationRes.withinRadius}, quality:${!qualityRes.isBlurry}, objects:${objectsRes.status}`,
    pointsRecommended: locationRes.withinRadius ? task.pointsConfig.base || 20 : 0,
    milestoneAchieved: task.progress.currentMilestone || 1
  };

  // 5️⃣ Save verification result
  const verificationData = {
    verificationId,
    taskId: task._id,
    userId: photoData.userId,
    photoUrl: photoData.photoUrl || '',
    capturedLocation: {
      type: 'Point',
      coordinates: [photoData.capturedLocation.lng, photoData.capturedLocation.lat],
      accuracy: photoData.capturedLocation.accuracy || 5,
      address: photoData.capturedLocation.address || 'Unknown'
    },
    geminiAnalysis: {
      model: 'local-checks',
      analysisTimestamp: new Date(),
      verificationChecks: {
        locationMatch: locationRes,
        photoQuality: qualityRes,
        requiredObjectsPresent: objectsRes
      },
      overallVerification: decision
    },
    pointsAwarded: decision.pointsRecommended,
    createdAt: new Date()
  };

  await toolFunctions.save_verification_result({ verificationData });

  // 6️⃣ Log steps
  const log = new LLMToolCallLog({
    logId: uuidv4(),
    verificationId,
    taskId: task._id,
    userId: photoData.userId,
    model: 'local-checks',
    prompt: 'Photo verification using URL only (no LLM)',
    steps: [
      { name: 'verify_location', result: locationRes },
      { name: 'analyze_photo_quality', result: qualityRes },
      { name: 'detect_required_objects', result: objectsRes }
    ],
    finalDecision: decision,
    durationMs: Date.now() - start
  });

  await log.save();

  return { success: true, verificationId, decision };
}

module.exports = { verifyPhotoWithLLM };
