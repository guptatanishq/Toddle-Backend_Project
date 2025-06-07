const { User } = require('../database/models');
const { generateToken } = require('../utils/jwtUtils');
const { validationResult } = require('express-validator');

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { username, password } = req.body;

  try {
    // Check if user exists in database
    let user = await User.findOne({ where: { username } });

    // If user doesn't exist, we'll create a mock user (as per requirements)
    if (!user) {
      // For demo purposes, create the user with provided credentials
      // In a real app, we'd return an error for invalid credentials
      user = await User.create({
        username,
        password,
        role: username.toLowerCase().includes('teacher') ? 'teacher' : 'student',
      });
    } else {
      // Verify password for existing user
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials',
        });
      }
    }

    // Generate JWT token
    const token = generateToken(user);

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
};