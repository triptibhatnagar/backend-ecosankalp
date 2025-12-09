const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    // For MVP, send ?userId=<id> in header
    const userId = req.headers['userid'];

    if (!userId) {
      return res.status(401).json({ success: false, error: "No userId provided" });
    }

    const user = await User.findOne({ userId });

    if (!user) {
      return res.status(401).json({ success: false, error: "Invalid user" });
    }

    req.user = user;
    next();

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
