const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const JournalStudent = sequelize.define('JournalStudent', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    journalId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'journals',
        key: 'id',
      },
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    hasViewedJournal: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    notificationSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  }, {
    timestamps: true,
    tableName: 'journal_students',
  });

  return JournalStudent;
};