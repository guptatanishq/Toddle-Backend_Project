const express = require('express');
const router = express.Router();

// Import route files
const authRoutes = require('./authRoutes');
const journalRoutes = require('./journalRoutes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/journals', journalRoutes);

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is running',
  });
});

module.exports = router;