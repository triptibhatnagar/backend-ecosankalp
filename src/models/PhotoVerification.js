const mongoose = require('mongoose');

const photoVerificationSchema = new mongoose.Schema({
  verificationId: {
    type: String,
    required: true,
    unique: true
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sequenceNumber: Number,
  photoUrl: {
    type: String,
    required: true
  },
  photoMetadata: {
    fileName: String,
    fileSize: Number,
    mimeType: String,
    uploadedAt: { type: Date, default: Date.now }
  },
  capturedLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: { type: [Number], required: true },
    accuracy: Number,
    address: String,
    timestamp: Date
  },
  geminiAnalysis: {
    model: { type: String, default: 'gemini-1.5-flash' },
    analysisTimestamp: Date,
    taskVerification: {
      pitDetails: {
        detected: Boolean,
        estimatedDepth: Number,
        estimatedWidth: Number,
        estimatedLength: Number,
        soilType: String,
        confidence: Number
      },
      waterDetails: {
        containerDetected: Boolean,
        estimatedVolume: Number,
        waterVisible: Boolean,
        containerType: String,
        confidence: Number
      },
      detectedObjects: [
        {
          label: String,
          confidence: Number,
          relevance: String
        }
      ],
      sceneDescription: String,
      environmentalContext: String
    },
    verificationChecks: {
      photoQuality: {
        isBlurry: Boolean,
        brightness: String,
        isAuthentic: Boolean,
        qualityScore: Number
      },
      requiredObjectsPresent: {
        status: Boolean,
        foundObjects: [String],
        missingObjects: [String],
        confidence: Number
      },
      locationMatch: {
        status: Boolean,
        distance: Number,
        withinRadius: Boolean
      },
      measurementsValid: {
        status: Boolean,
        meetsMinimum: Boolean,
        details: String
      },
      progressEstimate: {
        percentage: Number,
        reasoning: String
      }
    },
    overallVerification: {
      status: {
        type: String,
        enum: ['verified', 'rejected', 'manual_review', 'partial'],
        required: true
      },
      confidence: Number,
      reasoning: String,
      pointsRecommended: Number,
      milestoneAchieved: Number
    },
    rawResponse: mongoose.Schema.Types.Mixed
  },
  manualReview: {
    required: Boolean,
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
    decision: {
      type: String,
      enum: ['approved', 'rejected', 'request_resubmit']
    },
    adjustedPoints: Number,
    comments: String
  },
  pointsAwarded: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

photoVerificationSchema.index({ capturedLocation: '2dsphere' });
photoVerificationSchema.index({ taskId: 1, createdAt: -1 });

module.exports = mongoose.model('PhotoVerification', photoVerificationSchema);