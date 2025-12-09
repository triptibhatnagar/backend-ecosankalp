const mongoose = require('mongoose');

const pointsTransactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  },
  verificationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PhotoVerification'
  },
  type: {
    type: String,
    enum: ['earned', 'bonus', 'penalty', 'adjustment'],
    required: true
  },
  category: String,
  points: { type: Number, required: true },
  milestone: Number,
  description: String,
  createdAt: { type: Date, default: Date.now }
});

pointsTransactionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('PointsTransaction', pointsTransactionSchema);