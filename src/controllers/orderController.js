const Order = require('../models/Order');
const Item = require('../models/Item');
const User = require('../models/User');

// BUY ITEM
exports.buyItem = async (req, res) => {
  try {
    const { itemId } = req.body;
    const userId = req.user._id; // from auth middleware

    const user = await User.findById(userId);
    const item = await Item.findById(itemId);

    if (!item) {
      return res.status(404).json({ success: false, error: "Item not found" });
    }

    if (item.stock <= 0) {
      return res.status(400).json({ success: false, error: "Out of stock" });
    }

    if (user.points.total < item.price) {
      return res.status(400).json({ success: false, error: "Not enough EcoCoins" });
    }

    // Deduct coins
    user.points.total -= item.price;
    await user.save();

    // Reduce stock
    item.stock -= 1;
    await item.save();

    // Create order
    const order = new Order({
      userId,
      itemId
    });
    await order.save();

    res.json({
      success: true,
      message: "Item purchased successfully",
      order
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// USER purchase history
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .populate('itemId')
      .sort({ createdAt: -1 });

    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
