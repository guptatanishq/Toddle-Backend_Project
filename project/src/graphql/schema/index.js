const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type Query {
    _empty: String
  }

  type Mutation {
    _empty: String
  }

  type Subscription {
    _empty: String
  }

  type User {
    id: ID!
    username: String!
    email: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Journal {
    id: ID!
    title: String!
    content: String!
    authorId: ID!
    author: User!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  scalar DateTime
`;

module.exports = typeDefs; 