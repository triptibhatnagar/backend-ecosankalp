const Item = require('../models/Item');

// GET all items
exports.getItems = async (req, res) => {
  try {
    const items = await Item.find();
    res.json({ success: true, items });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Admin — Add item
exports.addItem = async (req, res) => {
  try {
    const item = new Item(req.body);
    await item.save();
    res.json({ success: true, item });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get item by ID
exports.getItemById = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }
    res.json({ success: true, item });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};