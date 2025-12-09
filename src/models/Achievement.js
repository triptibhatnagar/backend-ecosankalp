const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  achievementId: {
    type: String,
    required: true,
    unique: true
  },
  title: String,
  description: String,
  icon: String,
  category: String,
  criteria: {
    type: {
      type: String,
      enum: ['points_total', 'tasks_completed', 'milestone', 'streak', 'category_specific']
    },
    threshold: Number,
    category: String
  },
  reward: {
    points: Number,
    badge: String
  },
  rarity: {
    type: String,
    enum: ['common', 'rare', 'epic', 'legendary']
  }
});

module.exports = mongoose.model('Achievement', achievementSchema);