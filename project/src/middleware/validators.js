const { body, param, query } = require('express-validator');

// Auth validators
exports.loginValidator = [
  body('username').not().isEmpty().withMessage('Username is required'),
  body('password').not().isEmpty().withMessage('Password is required'),
];

// Journal validators
exports.createJournalValidator = [
  body('title').not().isEmpty().withMessage('Title is required'),
  body('description').not().isEmpty().withMessage('Description is required'),
  body('studentIds').optional().isArray().withMessage('Student IDs must be an array'),
  body('publishedAt').optional().isISO8601().toDate().withMessage('Published date must be a valid date'),
];

exports.updateJournalValidator = [
  param('id').isInt().withMessage('Invalid journal ID'),
  body('title').optional(),
  body('description').optional(),
  body('studentIds').optional().isArray().withMessage('Student IDs must be an array'),
  body('publishedAt').optional().isISO8601().toDate().withMessage('Published date must be a valid date'),
];

exports.publishJournalValidator = [
  param('id').isInt().withMessage('Invalid journal ID'),
  body('publishedAt').optional().isISO8601().toDate().withMessage('Published date must be a valid date'),
];

exports.getJournalByIdValidator = [
  param('id').isInt().withMessage('Invalid journal ID'),
];

exports.journalFeedValidator = [
  query('page').optional().isInt().withMessage('Page must be an integer'),
  query('limit').optional().isInt().withMessage('Limit must be an integer'),
];