const { AuthenticationError, ForbiddenError } = require('apollo-server-express');
const { PubSub } = require('graphql-subscriptions');

const pubsub = new PubSub();
const NOTIFICATION_CREATED = 'NOTIFICATION_CREATED';

const notificationResolvers = {
  Query: {
    notifications: async (_, { page = 1, limit = 10 }, { user, dataSources }) => {
      if (!user) throw new AuthenticationError('Not authenticated');

      const offset = (page - 1) * limit;
      const { notifications, totalCount } = await dataSources.notifications.getNotifications(
        user.id,
        offset,
        limit
      );

      const edges = notifications.map(notification => ({
        node: notification,
        cursor: Buffer.from(notification.id.toString()).toString('base64')
      }));

      return {
        edges,
        pageInfo: {
          hasNextPage: offset + notifications.length < totalCount,
          hasPreviousPage: page > 1,
          startCursor: edges[0]?.cursor,
          endCursor: edges[edges.length - 1]?.cursor
        },
        totalCount
      };
    },

    notificationPreferences: async (_, __, { user, dataSources }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      return dataSources.notifications.getNotificationPreferences(user.id);
    }
  },

  Mutation: {
    updateNotificationPreferences: async (
      _,
      { emailEnabled, inAppEnabled, pushEnabled, emailFrequency },
      { user, dataSources }
    ) => {
      if (!user) throw new AuthenticationError('Not authenticated');

      return dataSources.notifications.updateNotificationPreferences(
        user.id,
        {
          emailEnabled,
          inAppEnabled,
          pushEnabled,
          emailFrequency
        }
      );
    },

    markNotificationAsRead: async (_, { id }, { user, dataSources }) => {
      if (!user) throw new AuthenticationError('Not authenticated');

      const notification = await dataSources.notifications.getNotificationById(id);
      if (!notification) {
        throw new Error('Notification not found');
      }

      if (notification.userId !== user.id) {
        throw new ForbiddenError('Not authorized to mark this notification as read');
      }

      return dataSources.notifications.markNotificationAsRead(id);
    },

    markAllNotificationsAsRead: async (_, __, { user, dataSources }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      return dataSources.notifications.markAllNotificationsAsRead(user.id);
    }
  },

  Subscription: {
    notificationCreated: {
      subscribe: (_, __, { user }) => {
        if (!user) throw new AuthenticationError('Not authenticated');
        return pubsub.asyncIterator([NOTIFICATION_CREATED]);
      }
    }
  },

  Notification: {
    user: (parent, _, { dataSources }) => {
      return dataSources.users.getUserById(parent.userId);
    },
    journal: (parent, _, { dataSources }) => {
      return dataSources.journals.getJournalById(parent.journalId);
    }
  }
};

module.exports = {
  notificationResolvers,
  pubsub,
  NOTIFICATION_CREATED
}; 