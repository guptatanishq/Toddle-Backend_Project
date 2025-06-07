const { ApolloServer } = require('apollo-server-express');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { createServer } = require('http');
const { WebSocketServer } = require('ws');
const { useServer } = require('graphql-ws/lib/use/ws');
const { PubSub } = require('graphql-subscriptions');

// Import type definitions
const baseTypeDefs = require('./schema/index');
const notificationTypeDefs = require('./schema/notification');

// Import resolvers
const { notificationResolvers } = require('./resolvers/notification');

// Create PubSub instance
const pubsub = new PubSub();

// Create schema
const schema = makeExecutableSchema({
  typeDefs: [baseTypeDefs, notificationTypeDefs],
  resolvers: [notificationResolvers]
});

// Create Apollo Server
const server = new ApolloServer({
  schema,
  context: ({ req }) => {
    // Get the user token from the headers
    const token = req.headers.authorization || '';
    
    // Add the user to the context
    return { 
      user: req.user, // This comes from your auth middleware
      pubsub 
    };
  },
  plugins: [
    {
      async serverWillStart() {
        console.log('GraphQL server starting up!');
      },
    },
  ],
});

// Function to start the server
async function startGraphQLServer(app) {
  try {
    await server.start();
    
    // Apply middleware with explicit path
    server.applyMiddleware({ 
      app, 
      path: '/graphql',
      cors: true // Enable CORS for GraphQL endpoint
    });

    console.log('GraphQL middleware applied successfully');

    // Create HTTP server
    const httpServer = createServer(app);

    // Create WebSocket server
    const wsServer = new WebSocketServer({
      server: httpServer,
      path: '/graphql',
    });

    // Set up WebSocket server
    useServer({ schema }, wsServer);

    return httpServer;
  } catch (error) {
    console.error('Error starting GraphQL server:', error);
    throw error;
  }
}

module.exports = { startGraphQLServer }; 