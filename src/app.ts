import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db'
import { logger } from './config/logger';
import transactionRoutes from './routes/transactionRoutes';
import swaggerUi from 'swagger-ui-express';
import swaggerJsDoc from 'swagger-jsdoc';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' })); // Enable CORS
app.use(express.json()); // Parse JSON request bodies

const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Transaction API',
      version: '1.0.0',
      description: 'API documentation for the Transaction API',
    },
    servers: [
      {
        url: `http://localhost:${port}`,
      },
    ],
    components: {
      schemas: {
        Transaction: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'The auto-generated ID of the transaction',
              example: '615f7b8e8f8b8b8b8b8b8b8b',
            },
            type: {
              type: 'string',
              description: 'Type of transaction (income or expense)',
              example: 'income',
            },
            amount: {
              type: 'number',
              description: 'Amount of the transaction',
              example: 100,
            },
            description: {
              type: 'string',
              description: 'Description of the transaction',
              example: 'Salary',
            },
            date: {
              type: 'string',
              format: 'date',
              description: 'Date of the transaction',
              example: '2023-10-01',
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'], // Path to your API routes
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Routes
app.use('/api', transactionRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  logger.info('Health check endpoint called');
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// 404 handler
app.use((req, res) => {
  logger.warn(`404 - Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Global error handler', { error: err.message, stack: err.stack });
  res.status(500).json({ message: 'Something went wrong!' });
});

// Connect to MongoDB and start the server
connectDB()
  .then(() => {
    app.listen(port, () => {
      logger.info(`Server running on port ${port}`);
    });
  })
  .catch((err) => {
    logger.error('Application error', { error: err });
    process.exit(1);
  });