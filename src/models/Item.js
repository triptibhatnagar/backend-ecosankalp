const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },

  description: { type: String, default: "" },

  price: { type: Number, required: true }, // eco-coin price

  stock: { type: Number, default: 100 }, // simple MVP stock

  image: { type: String, default: "" } // optional
});

module.exports = mongoose.model('Item', itemSchema);
