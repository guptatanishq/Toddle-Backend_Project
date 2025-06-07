const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const journalController = require('../controllers/journalController');
const { authenticate, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  },
});

const fileFilter = (req, file, cb) => {
  // Accept images, videos, and PDFs
  if (
    file.mimetype.startsWith('image/') ||
    file.mimetype.startsWith('video/') ||
    file.mimetype === 'application/pdf'
  ) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Journal:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         teacherId:
 *           type: integer
 *         publishedAt:
 *           type: string
 *           format: date-time
 *         isPublished:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/journals:
 *   post:
 *     summary: Create a new journal
 *     tags: [Journals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               studentIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *               publishedAt:
 *                 type: string
 *                 format: date-time
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Journal created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 */
router.post(
  '/',
  authenticate,
  authorize(['teacher']),
  upload.array('attachments', 5),
  [
    body('title').not().isEmpty().withMessage('Title is required'),
    body('description').not().isEmpty().withMessage('Description is required'),
    body('studentIds').optional().isArray(),
    body('publishedAt').optional().isISO8601().toDate(),
  ],
  journalController.createJournal
);

/**
 * @swagger
 * /api/journals/{id}:
 *   put:
 *     summary: Update a journal
 *     tags: [Journals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               studentIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *               publishedAt:
 *                 type: string
 *                 format: date-time
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Journal updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Journal not found
 */
router.put(
  '/:id',
  authenticate,
  authorize(['teacher']),
  upload.array('attachments', 5),
  [
    param('id').isInt().withMessage('Invalid journal ID'),
    body('title').optional(),
    body('description').optional(),
    body('studentIds').optional().isArray(),
    body('publishedAt').optional().isISO8601().toDate(),
  ],
  journalController.updateJournal
);

/**
 * @swagger
 * /api/journals/{id}:
 *   delete:
 *     summary: Delete a journal
 *     tags: [Journals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Journal deleted successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Journal not found
 */
router.delete(
  '/:id',
  authenticate,
  authorize(['teacher']),
  [param('id').isInt().withMessage('Invalid journal ID')],
  journalController.deleteJournal
);

/**
 * @swagger
 * /api/journals/{id}/publish:
 *   put:
 *     summary: Publish a journal
 *     tags: [Journals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               publishedAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Journal published successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Journal not found
 */
router.put(
  '/:id/publish',
  authenticate,
  authorize(['teacher']),
  [
    param('id').isInt().withMessage('Invalid journal ID'),
    body('publishedAt').optional().isISO8601().toDate(),
  ],
  journalController.publishJournal
);

/**
 * @swagger
 * /api/journals/feed:
 *   get:
 *     summary: Get journal feed based on user role
 *     tags: [Journals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         default: 10
 *     responses:
 *       200:
 *         description: Journal feed retrieved successfully
 *       401:
 *         description: Not authenticated
 */
router.get('/feed', authenticate, journalController.getJournalFeed);

/**
 * @swagger
 * /api/journals/{id}:
 *   get:
 *     summary: Get a journal by ID
 *     tags: [Journals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Journal retrieved successfully
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Journal not found
 */
router.get(
  '/:id',
  authenticate,
  [param('id').isInt().withMessage('Invalid journal ID')],
  journalController.getJournalById
);

module.exports = router;