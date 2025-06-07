const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const NotificationPreference = sequelize.define('NotificationPreference', {
    userId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    emailEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    inAppEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    pushEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    emailFrequency: {
      type: DataTypes.ENUM('IMMEDIATE', 'DAILY_DIGEST', 'WEEKLY_DIGEST'),
      defaultValue: 'IMMEDIATE',
    },
  }, {
    timestamps: true,
    tableName: 'notification_preferences',
  });

  return NotificationPreference;
}; 