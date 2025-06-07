const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { sequelize } = require('./database/models');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { startGraphQLServer } = require('./graphql/server');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', routes);

// Error handling
app.use(errorHandler);

// Sync database and start server
sequelize
  .sync()
  .then(async () => {
    console.log('Database connected successfully');
    // Start GraphQL server and HTTP server
    const httpServer = await startGraphQLServer(app);
    httpServer.listen(PORT, () => {
      console.log(`REST API running at http://localhost:${PORT}/api`);
      console.log(`GraphQL endpoint at http://localhost:${PORT}/graphql`);
    });
  })
  .catch((error) => {
    console.error('Unable to connect to the database:', error);
  });

module.exports = app; // For testing purposes