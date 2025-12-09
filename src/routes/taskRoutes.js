const express = require('express');
const router = express.Router();
const { Task, User } = require('../models');

// Use a test user ID (replace later when auth is added)
let TEST_USER_ID = null;

// Automatically assign a test user if not created yet
router.use(async (req, res, next) => {
  if (!TEST_USER_ID) {
    let testUser = await User.findOne({ userId: 'U001' });
    if (!testUser) {
      testUser = await User.create({
        userId: 'U001',
        name: 'Test User',
        email: 'test@example.com'
      });
    }
    TEST_USER_ID = testUser._id;
  }
  next();
});

// Create a new task
router.post('/create', async (req, res) => {
  try {
    const { title, description, category } = req.body;

    const task = await Task.create({
      taskId: 'TASK-' + Date.now(),
      title,
      description,
      category,
      assignedTo: TEST_USER_ID,
      expectedLocation: {
        coordinates: [77.123, 28.654],
        address: "Default Test Location"
      }
    });

    res.json({ success: true, task });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all tasks
router.get('/', async (req, res) => {
  const tasks = await Task.find().populate('assignedTo', 'name email');
  res.json(tasks);
});

// Update task progress
router.put('/:id/progress', async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { $set: { progress: req.body } },
      { new: true }
    );
    res.json(task);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;