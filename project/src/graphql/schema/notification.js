const { gql } = require('apollo-server-express');

const notificationTypeDefs = gql`
  type Notification {
    id: ID!
    user: User!
    journal: Journal!
    type: NotificationType!
    message: String!
    isRead: Boolean!
    createdAt: DateTime!
  }

  enum NotificationType {
    JOURNAL_TAG
    JOURNAL_PUBLISH
    JOURNAL_UPDATE
  }

  type NotificationPreference {
    userId: ID!
    emailEnabled: Boolean!
    inAppEnabled: Boolean!
    pushEnabled: Boolean!
    emailFrequency: EmailFrequency!
  }

  enum EmailFrequency {
    IMMEDIATE
    DAILY_DIGEST
    WEEKLY_DIGEST
  }

  type NotificationConnection {
    edges: [NotificationEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type NotificationEdge {
    node: Notification!
    cursor: String!
  }

  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }

  extend type Query {
    notifications(page: Int, limit: Int): NotificationConnection!
    notificationPreferences: NotificationPreference!
  }

  extend type Mutation {
    updateNotificationPreferences(
      emailEnabled: Boolean
      inAppEnabled: Boolean
      pushEnabled: Boolean
      emailFrequency: EmailFrequency
    ): NotificationPreference!
    
    markNotificationAsRead(id: ID!): Notification!
    markAllNotificationsAsRead: Boolean!
  }

  extend type Subscription {
    notificationCreated: Notification!
  }
`;

module.exports = notificationTypeDefs; 