const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/me', authenticate, userController.getCurrentUser);

router.get(
  '/students',
  authenticate,
  authorize(['teacher']),
  userController.getAllStudents
);

module.exports = router;