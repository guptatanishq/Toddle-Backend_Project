const { User, Journal, Attachment, JournalStudent, sequelize } = require('../models');
const bcrypt = require('bcryptjs');

const seedDatabase = async () => {
  try {
    console.log('Starting seed process...');
    
    await sequelize.sync({ force: true });

    // Create teachers
    const teacherPassword = await bcrypt.hash('password123', 10);
    const teachers = await User.bulkCreate([
      {
        username: 'teacher1',
        password: teacherPassword,
        role: 'teacher'
      },
      {
        username: 'teacher2',
        password: teacherPassword,
        role: 'teacher'
      }
    ]);

    // Create students
    const studentPassword = await bcrypt.hash('student123', 10);
    const students = await User.bulkCreate([
      {
        username: 'student1',
        password: studentPassword,
        role: 'student'
      },
      {
        username: 'student2',
        password: studentPassword,
        role: 'student'
      },
      {
        username: 'student3',
        password: studentPassword,
        role: 'student'
      }
    ]);

    // Create journals for the first teacher
    const journals = await Journal.bulkCreate([
      {
        title: 'Art Class Activities',
        description: 'Today we learned about primary colors and created a color wheel.',
        teacherId: teachers[0].id,
        publishedAt: new Date(),
        isPublished: true
      },
      {
        title: 'Science Experiment',
        description: 'Students conducted an experiment about plant growth in different light conditions.',
        teacherId: teachers[0].id,
        publishedAt: new Date(),
        isPublished: true
      },
      {
        title: 'Future Math Lesson',
        description: 'Next week we will be learning about fractions.',
        teacherId: teachers[0].id,
        publishedAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days in the future
        isPublished: false
      }
    ]);

    // Create journals for the second teacher
    await Journal.bulkCreate([
      {
        title: 'English Literature Discussion',
        description: 'We discussed "Charlotte\'s Web" and its themes of friendship and sacrifice.',
        teacherId: teachers[1].id,
        publishedAt: new Date(),
        isPublished: true
      },
      {
        title: 'Physical Education - Soccer',
        description: 'Students practiced passing and shooting skills in soccer today.',
        teacherId: teachers[1].id,
        publishedAt: new Date(),
        isPublished: true
      }
    ]);

    // Add example attachments
    await Attachment.bulkCreate([
      {
        journalId: journals[0].id,
        type: 'image',
        url: '/uploads/sample-art-class.jpg',
        filename: 'sample-art-class.jpg',
        mimeType: 'image/jpeg',
        size: 102400
      },
      {
        journalId: journals[1].id,
        type: 'pdf',
        url: '/uploads/science-experiment-worksheet.pdf',
        filename: 'science-experiment-worksheet.pdf',
        mimeType: 'application/pdf',
        size: 204800
      }
    ]);

    // Tag students in journals
    await JournalStudent.bulkCreate([
      {
        journalId: journals[0].id,
        studentId: students[0].id
      },
      {
        journalId: journals[0].id,
        studentId: students[1].id
      },
      {
        journalId: journals[1].id,
        studentId: students[0].id
      },
      {
        journalId: journals[1].id,
        studentId: students[2].id
      },
      {
        journalId: journals[2].id,
        studentId: students[1].id
      }
    ]);

    console.log('Database seed completed. Default users and journals created.');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();