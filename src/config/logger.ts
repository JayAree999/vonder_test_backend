import winston from 'winston';

const logger = winston.createLogger({
  level: 'info', // Log level
  format: winston.format.combine(
    winston.format.timestamp(), // Add timestamp
    winston.format.json() // JSON format for structured logging
  ),
  transports: [
    new winston.transports.Console(), // Log to console
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }), // Log errors to file
    new winston.transports.File({ filename: 'logs/combined.log' }), // Log all messages to file
  ],
});

export { logger };