import mongoose from 'mongoose';
import { logger } from './logger';
import dotenv from 'dotenv';
dotenv.config(); // Load environment variables from .env file
const uri = `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@vonder-test.1uiu8.mongodb.net/?retryWrites=true&w=majority&appName=vonder-test`;

// Function to connect to MongoDB
export async function connectDB() {
  try {
    await mongoose.connect(uri);
    logger.info('Connected to MongoDB');
  } catch (err) {
    logger.error('Database connection failed', { error: err });
    process.exit(1); // Exit the application if the connection fails
  }
}