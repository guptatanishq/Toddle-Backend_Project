const express = require('express');
const cors = require('cors');
const { ApolloServer } = require('apollo-server-express');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { createServer } = require('http');
const { WebSocketServer } = require('ws');
const { useServer } = require('graphql-ws/lib/use/ws');
const { PubSub } = require('graphql-subscriptions');

// Import type definitions
const baseTypeDefs = require('./graphql/schema/index');
const notificationTypeDefs = require('./graphql/schema/notification');

// Import resolvers
const { notificationResolvers } = require('./graphql/resolvers/notification');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

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
    return { 
      user: req.user,
      pubsub 
    };
  }
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/journals', require('./routes/journalRoutes'));

// Start server
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    console.log('Starting server...');
    
    // Start Apollo Server
    await server.start();
    
    // Apply middleware
    server.applyMiddleware({ 
      app,
      path: '/graphql',
      cors: true
    });

    // Create HTTP server
    const httpServer = createServer(app);

    // Create WebSocket server
    const wsServer = new WebSocketServer({
      server: httpServer,
      path: '/graphql',
    });

    // Set up WebSocket server
    useServer({ schema }, wsServer);

    // Start listening
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`GraphQL endpoint: http://localhost:${PORT}/graphql`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer(); 