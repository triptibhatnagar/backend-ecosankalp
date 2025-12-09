const mongoose = require('mongoose');

const LLMToolCallLogSchema = new mongoose.Schema({
  logId: { type: String, required: true },
  verificationId: { type: String, required: true },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  model: String,
  prompt: String,
  steps: Array,
  finalDecision: Object,
  durationMs: Number,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LLMToolCallLog', LLMToolCallLogSchema);
