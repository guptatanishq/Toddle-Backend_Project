const { Journal, User, Attachment, JournalStudent, sequelize } = require('../database/models');
const { validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');

/**
 * @desc    Create a new journal
 * @route   POST /api/journals
 * @access  Private/Teacher
 */
exports.createJournal = async (req, res) => {
  const errors = validationResult(req);
  console.log("req.body", req.body);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { title, description, studentIds, publishedAt } = req.body;
  
  // Convert studentIds to array if it's a single value
  let parsedStudentIds = studentIds;
  if (studentIds) {
    if (typeof studentIds === 'string' || typeof studentIds === 'number') {
      parsedStudentIds = [Number(studentIds)];
    } else if (Array.isArray(studentIds)) {
      parsedStudentIds = studentIds.map(id => Number(id));
    }
  }

  try {
    const transaction = await sequelize.transaction();

    try {
      // Create journal
      const journal = await Journal.create(
        {
          title,
          description,
          teacherId: req.user.id,
          publishedAt: publishedAt || null,
          isPublished: publishedAt ? new Date(publishedAt) <= new Date() : false,
        },
        { transaction }
      );

      // Tag students if provided
      if (parsedStudentIds && parsedStudentIds.length > 0) {
        // Verify all studentIds exist and are students
        const students = await User.findAll({
          where: {
            id: parsedStudentIds,
            role: 'student',
          },
          transaction,
        });

        if (students.length !== parsedStudentIds.length) {
          throw new Error('One or more student IDs are invalid');
        }

        // Create journal-student associations
        await Promise.all(
          parsedStudentIds.map((studentId) =>
            JournalStudent.create(
              {
                journalId: journal.id,
                studentId,
              },
              { transaction }
            )
          )
        );
      }

      // Handle attachments if included
      if (req.files && req.files.length > 0) {
        const attachments = req.files.map((file) => ({
          journalId: journal.id,
          type: getFileType(file.mimetype),
          url: `/uploads/${file.filename}`,
          filename: file.filename,
          mimeType: file.mimetype,
          size: file.size,
        }));

        await Attachment.bulkCreate(attachments, { transaction });
      }

      await transaction.commit();

      // Fetch the created journal with its relationships
      const createdJournal = await Journal.findByPk(journal.id, {
        include: [
          {
            model: User,
            as: 'taggedStudents',
            attributes: ['id', 'username', 'role'],
            through: { attributes: [] },
          },
          {
            model: Attachment,
            as: 'attachments',
            attributes: ['id', 'type', 'url', 'filename'],
          },
          {
            model: User,
            as: 'teacher',
            attributes: ['id', 'username'],
          },
        ],
      });

      return res.status(201).json({
        success: true,
        data: createdJournal,
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Create journal error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error',
    });
  }
};

/**
 * @desc    Update a journal
 * @route   PUT /api/journals/:id
 * @access  Private/Teacher
 */
exports.updateJournal = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }

  const { title, description, studentIds, publishedAt } = req.body;
  const { id } = req.params;

  try {
    // Check if journal exists and belongs to teacher
    const journal = await Journal.findOne({
      where: {
        id,
        teacherId: req.user.id,
      },
    });

    if (!journal) {
      return res.status(404).json({
        success: false,
        error: 'Journal not found or you do not have permission to update it',
      });
    }

    const transaction = await sequelize.transaction();

    try {
      // Update journal
      await journal.update(
        {
          title: title || journal.title,
          description: description || journal.description,
          publishedAt: publishedAt || journal.publishedAt,
          isPublished: publishedAt ? new Date(publishedAt) <= new Date() : journal.isPublished,
        },
        { transaction }
      );

      // Update tagged students if provided
      if (studentIds) {
        // Remove all existing associations
        await JournalStudent.destroy({
          where: { journalId: journal.id },
          transaction,
        });

        // Add new associations
        if (studentIds.length > 0) {
          // Verify all studentIds exist and are students
          const students = await User.findAll({
            where: {
              id: studentIds,
              role: 'student',
            },
            transaction,
          });

          if (students.length !== studentIds.length) {
            throw new Error('One or more student IDs are invalid');
          }

          // Create journal-student associations
          await Promise.all(
            studentIds.map((studentId) =>
              JournalStudent.create(
                {
                  journalId: journal.id,
                  studentId,
                },
                { transaction }
              )
            )
          );
        }
      }

      // Handle new attachments if included
      if (req.files && req.files.length > 0) {
        const attachments = req.files.map((file) => ({
          journalId: journal.id,
          type: getFileType(file.mimetype),
          url: `/uploads/${file.filename}`,
          filename: file.filename,
          mimeType: file.mimetype,
          size: file.size,
        }));

        await Attachment.bulkCreate(attachments, { transaction });
      }

      await transaction.commit();

      // Fetch the updated journal with its relationships
      const updatedJournal = await Journal.findByPk(journal.id, {
        include: [
          {
            model: User,
            as: 'taggedStudents',
            attributes: ['id', 'username', 'role'],
            through: { attributes: [] },
          },
          {
            model: Attachment,
            as: 'attachments',
            attributes: ['id', 'type', 'url', 'filename'],
          },
          {
            model: User,
            as: 'teacher',
            attributes: ['id', 'username'],
          },
        ],
      });

      return res.json({
        success: true,
        data: updatedJournal,
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Update journal error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error',
    });
  }
};

/**
 * @desc    Delete a journal
 * @route   DELETE /api/journals/:id
 * @access  Private/Teacher
 */
exports.deleteJournal = async (req, res) => {
  const { id } = req.params;

  try {
    // Check if journal exists and belongs to teacher
    const journal = await Journal.findOne({
      where: {
        id,
        teacherId: req.user.id,
      },
      include: [
        {
          model: Attachment,
          as: 'attachments',
        },
      ],
    });

    if (!journal) {
      return res.status(404).json({
        success: false,
        error: 'Journal not found or you do not have permission to delete it',
      });
    }

    const transaction = await sequelize.transaction();

    try {
      // Delete attachments (both records and files)
      if (journal.attachments && journal.attachments.length > 0) {
        for (const attachment of journal.attachments) {
          if (attachment.filename) {
            const filePath = path.join(__dirname, '../../uploads', attachment.filename);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          }
        }

        await Attachment.destroy({
          where: { journalId: journal.id },
          transaction,
        });
      }

      // Delete journal-student associations
      await JournalStudent.destroy({
        where: { journalId: journal.id },
        transaction,
      });

      // Delete journal
      await journal.destroy({ transaction });

      await transaction.commit();

      return res.json({
        success: true,
        message: 'Journal deleted successfully',
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Delete journal error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error',
    });
  }
};

/**
 * @desc    Publish a journal
 * @route   PUT /api/journals/:id/publish
 * @access  Private/Teacher
 */
exports.publishJournal = async (req, res) => {
  const { id } = req.params;
  const { publishedAt } = req.body;

  try {
    // Check if journal exists and belongs to teacher
    const journal = await Journal.findOne({
      where: {
        id,
        teacherId: req.user.id,
      },
    });

    if (!journal) {
      return res.status(404).json({
        success: false,
        error: 'Journal not found or you do not have permission to publish it',
      });
    }

    // Set published date and status
    const publishDate = publishedAt ? new Date(publishedAt) : new Date();
    const isPublished = publishDate <= new Date();

    await journal.update({
      publishedAt: publishDate,
      isPublished,
    });

    // If published now, mark for notification (bonus feature)
    if (isPublished) {
      await JournalStudent.update(
        { notificationSent: false },
        { 
          where: { journalId: journal.id } 
        }
      );
      
      // In a real application, we would trigger notifications here
      // For the bonus feature, this is where we'd implement the notification system
    }

    // Fetch the published journal with its relationships
    const publishedJournal = await Journal.findByPk(journal.id, {
      include: [
        {
          model: User,
          as: 'taggedStudents',
          attributes: ['id', 'username', 'role'],
          through: { attributes: [] },
        },
        {
          model: Attachment,
          as: 'attachments',
          attributes: ['id', 'type', 'url', 'filename'],
        },
        {
          model: User,
          as: 'teacher',
          attributes: ['id', 'username'],
        },
      ],
    });

    return res.json({
      success: true,
      data: publishedJournal,
    });
  } catch (error) {
    console.error('Publish journal error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error',
    });
  }
};

/**
 * @desc    Get journal feed
 * @route   GET /api/journals/feed
 * @access  Private
 */
exports.getJournalFeed = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    let journals = [];
    const currentDate = new Date();

    if (req.user.role === 'teacher') {
      // Teacher feed - all journals created by the teacher
      journals = await Journal.findAndCountAll({
        where: {
          teacherId: req.user.id,
        },
        include: [
          {
            model: User,
            as: 'taggedStudents',
            attributes: ['id', 'username', 'role'],
            through: { attributes: [] },
          },
          {
            model: Attachment,
            as: 'attachments',
            attributes: ['id', 'type', 'url', 'filename'],
          },
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });
    } else {
      // Student feed - all journals where the student is tagged and that are published
      journals = await Journal.findAndCountAll({
        include: [
          {
            model: User,
            as: 'taggedStudents',
            attributes: ['id', 'username', 'role'],
            where: {
              id: req.user.id,
            },
            through: { attributes: [] },
          },
          {
            model: Attachment,
            as: 'attachments',
            attributes: ['id', 'type', 'url', 'filename'],
          },
          {
            model: User,
            as: 'teacher',
            attributes: ['id', 'username'],
          },
        ],
        where: {
          isPublished: true,
          publishedAt: {
            [Op.lte]: currentDate,
          },
        },
        order: [['publishedAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      // Mark journals as viewed
      if (journals.rows.length > 0) {
        const journalIds = journals.rows.map(journal => journal.id);
        await JournalStudent.update(
          { hasViewedJournal: true },
          { 
            where: { 
              journalId: journalIds,
              studentId: req.user.id 
            } 
          }
        );
      }
    }

    // Calculate pagination info
    const totalPages = Math.ceil(journals.count / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return res.json({
      success: true,
      data: {
        journals: journals.rows,
        pagination: {
          total: journals.count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages,
          hasNextPage,
          hasPrevPage,
        },
      },
    });
  } catch (error) {
    console.error('Get journal feed error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error',
    });
  }
};

/**
 * @desc    Get a single journal by ID
 * @route   GET /api/journals/:id
 * @access  Private
 */
exports.getJournalById = async (req, res) => {
  const { id } = req.params;

  try {
    let journal;
    
    if (req.user.role === 'teacher') {
      // Teachers can only view their own journals
      journal = await Journal.findOne({
        where: {
          id,
          teacherId: req.user.id,
        },
        include: [
          {
            model: User,
            as: 'taggedStudents',
            attributes: ['id', 'username', 'role'],
            through: { attributes: [] },
          },
          {
            model: Attachment,
            as: 'attachments',
            attributes: ['id', 'type', 'url', 'filename'],
          },
        ],
      });
    } else {
      // Students can only view journals they are tagged in and that are published
      journal = await Journal.findOne({
        where: {
          id,
          isPublished: true,
          publishedAt: {
            [Op.lte]: new Date(),
          },
        },
        include: [
          {
            model: User,
            as: 'taggedStudents',
            attributes: ['id', 'username', 'role'],
            where: {
              id: req.user.id,
            },
            through: { attributes: [] },
          },
          {
            model: Attachment,
            as: 'attachments',
            attributes: ['id', 'type', 'url', 'filename'],
          },
          {
            model: User,
            as: 'teacher',
            attributes: ['id', 'username'],
          },
        ],
      });

      // Mark journal as viewed
      if (journal) {
        await JournalStudent.update(
          { hasViewedJournal: true },
          { 
            where: { 
              journalId: journal.id,
              studentId: req.user.id 
            } 
          }
        );
      }
    }

    if (!journal) {
      return res.status(404).json({
        success: false,
        error: 'Journal not found or you do not have permission to view it',
      });
    }

    return res.json({
      success: true,
      data: journal,
    });
  } catch (error) {
    console.error('Get journal error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error',
    });
  }
};

/**
 * Helper function to determine file type from MIME type
 */
function getFileType(mimeType) {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType === 'application/pdf') return 'pdf';
  return 'url';
}