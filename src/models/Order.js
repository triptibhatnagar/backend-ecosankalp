const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },

  status: { type: String, default: "completed" },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
