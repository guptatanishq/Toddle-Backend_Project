const { DataSource } = require('apollo-datasource');
const { Op } = require('sequelize');
const { Notification, NotificationPreference } = require('../../database/models');

class NotificationDataSource extends DataSource {
  constructor() {
    super();
  }

  initialize(config) {
    this.context = config.context;
  }

  async getNotifications(userId, offset, limit) {
    const { rows: notifications, count: totalCount } = await Notification.findAndCountAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      offset,
      limit
    });

    return { notifications, totalCount };
  }

  async getNotificationById(id) {
    return Notification.findByPk(id);
  }

  async getNotificationPreferences(userId) {
    const [preferences] = await NotificationPreference.findOrCreate({
      where: { userId },
      defaults: {
        userId,
        emailEnabled: true,
        inAppEnabled: true,
        pushEnabled: false,
        emailFrequency: 'IMMEDIATE'
      }
    });

    return preferences;
  }

  async updateNotificationPreferences(userId, updates) {
    const [preferences] = await NotificationPreference.findOrCreate({
      where: { userId },
      defaults: {
        userId,
        emailEnabled: true,
        inAppEnabled: true,
        pushEnabled: false,
        emailFrequency: 'IMMEDIATE'
      }
    });

    await preferences.update(updates);
    return preferences;
  }

  async markNotificationAsRead(id) {
    const notification = await Notification.findByPk(id);
    if (!notification) {
      throw new Error('Notification not found');
    }

    await notification.update({ isRead: true });
    return notification;
  }

  async markAllNotificationsAsRead(userId) {
    await Notification.update(
      { isRead: true },
      {
        where: {
          userId,
          isRead: false
        }
      }
    );
    return true;
  }

  async createNotification(userId, journalId, type, message) {
    const notification = await Notification.create({
      userId,
      journalId,
      type,
      message,
      isRead: false
    });

    // Get user preferences
    const preferences = await this.getNotificationPreferences(userId);

    // Handle different notification channels based on preferences
    if (preferences.inAppEnabled) {
      // Publish to GraphQL subscription
      this.context.pubsub.publish('NOTIFICATION_CREATED', {
        notificationCreated: notification
      });
    }

    if (preferences.emailEnabled) {
      // Queue email notification based on frequency
      if (preferences.emailFrequency === 'IMMEDIATE') {
        await this.queueEmailNotification(notification);
      } else {
        await this.queueDigestEmailNotification(notification, preferences.emailFrequency);
      }
    }

    if (preferences.pushEnabled) {
      await this.sendPushNotification(notification);
    }

    return notification;
  }

  async queueEmailNotification(notification) {
    // Implementation for immediate email notification
    // This would typically use a message queue or email service
    console.log('Queueing immediate email notification:', notification.id);
  }

  async queueDigestEmailNotification(notification, frequency) {
    // Implementation for digest email notifications
    // This would typically use a message queue or email service
    console.log(`Queueing ${frequency.toLowerCase()} digest email notification:`, notification.id);
  }

  async sendPushNotification(notification) {
    // Implementation for push notifications
    // This would typically use a push notification service
    console.log('Sending push notification:', notification.id);
  }
}

module.exports = NotificationDataSource; 