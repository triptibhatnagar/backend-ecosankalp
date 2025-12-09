const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  name: String,
  email: String,
  phone: String,
  role: {
    type: String,
    enum: ['user', 'admin', 'verifier'],
    default: 'user'
  },
  points: {
    total: { type: Number, default: 0 },
    breakdown: {
      pitDigging: { type: Number, default: 0 },
      waterSaving: { type: Number, default: 0 },
      treePlanting: { type: Number, default: 0 },
      other: { type: Number, default: 0 }
    }
  },
  level: {
    current: { type: Number, default: 1 },
    title: { type: String, default: 'Beginner' }
  },
  achievements: [
    {
      achievementId: String,
      title: String,
      unlockedAt: Date
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);