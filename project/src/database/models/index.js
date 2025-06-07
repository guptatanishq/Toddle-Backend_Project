const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

// Initialize Sequelize with SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
});

// Import models
const User = require('./user')(sequelize);
const Journal = require('./journal')(sequelize);
const Attachment = require('./attachment')(sequelize);
const JournalStudent = require('./journalStudent')(sequelize);

// Define associations
User.hasMany(Journal, { foreignKey: 'teacherId', as: 'journals' });
Journal.belongsTo(User, { foreignKey: 'teacherId', as: 'teacher' });

Journal.hasMany(Attachment, { foreignKey: 'journalId', as: 'attachments' });
Attachment.belongsTo(Journal, { foreignKey: 'journalId' });

// Many-to-many relationship between journals and students
Journal.belongsToMany(User, { 
  through: JournalStudent,
  foreignKey: 'journalId',
  otherKey: 'studentId',
  as: 'taggedStudents' 
});

User.belongsToMany(Journal, { 
  through: JournalStudent,
  foreignKey: 'studentId',
  otherKey: 'journalId',
  as: 'taggedInJournals' 
});

module.exports = {
  sequelize,
  User,
  Journal,
  Attachment,
  JournalStudent
};