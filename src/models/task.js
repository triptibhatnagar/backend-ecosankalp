const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  taskId: { type: String, required: true, unique: true },
  title: String,
  description: String,
//   category: {
//     type: String,
//     enum: ['pit_digging', 'water_saving', 'tree_planting', 'waste_management', 'other'],
//     required: true
//   },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  pointsConfig: {
    base: { type: Number, required: true, default: 20 },
    milestones: [
      {
        threshold: Number,
        points: Number,
        title: String,
        description: String
      }
    ],
    bonus: {
      earlyCompletion: Number,
      qualityBonus: Number
    }
  },
  verificationRequirements: {
    requiredPhotos: { type: Number, default: 1 },
    requiredObjects: [String],
    minimumDepth: Number,
    minimumWidth: Number,
    waterQuantity: Number,
    locationRequired: { type: Boolean, default: true }
  },
  expectedLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: { type: [Number], required: true },
    address: String,
    radius: { type: Number, default: 100 }
  },
  progress: {
    percentage: { type: Number, default: 0, min: 0, max: 100 },
    currentMilestone: Number,
    completedMilestones: [Number],
    photosSubmitted: { type: Number, default: 0 }
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'submitted', 'verified', 'rejected', 'completed'],
    default: 'pending'
  },
  pointsEarned: { type: Number, default: 0 },
  dueDate: Date,
  startedAt: Date,
  completedAt: Date,
  createdAt: { type: Date, default: Date.now }
});

taskSchema.index({ expectedLocation: '2dsphere' });
taskSchema.index({ assignedTo: 1, status: 1 });

module.exports = mongoose.model('Task', taskSchema);