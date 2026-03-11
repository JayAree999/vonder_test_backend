// lib/db.ts
import mysql from 'mysql2/promise';
import mssql from 'mssql';
import { logger } from './logger';
import dotenv from 'dotenv';
import { createTransactionsTable } from '../models/transaction_schema';

dotenv.config();

// MySQL configuration
const mysqlPool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  port: Number(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USERNAME || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'vonder_test',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// MSSQL configuration
const mssqlConfig: mssql.config = {
  server: process.env.MSSQL_HOST || '192.168.2.3',
  port: Number(process.env.MSSQL_PORT) || 1433, 
  user: process.env.MSSQL_USERNAME || 'sa',
  password: process.env.MSSQL_PASSWORD || 'Deelert@prosoft',
  database: process.env.MSSQL_DATABASE || 'produce',
  options: {
    encrypt: false, // Use encryption
    trustServerCertificate: true, // For local development
    connectTimeout: 300000, // 5 minutes connection timeout
    requestTimeout: 300000, // 5 minutes request timeout
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 300000, // 5 minutes idle timeout
  },
};

let mssqlPool: mssql.ConnectionPool | null = null;

export async function connectMySQL(): Promise<void> {
  try {
    const connection = await mysqlPool.getConnection();
    logger.info(`Connected to MySQL - Database: ${process.env.MYSQL_DATABASE}`);
    const [rows] = await connection.query('SELECT VERSION() as version');
    logger.info(`MySQL version: ${(rows as any)[0].version}`);
    connection.release();
  } catch (err) {
    logger.error('MySQL connection failed', { error: err });
    throw err;
  }
}

export async function connectMSSQL(): Promise<void> {
  try {
    mssqlPool = await mssql.connect(mssqlConfig);
    logger.info(`Connected to MSSQL - Database: ${process.env.MSSQL_DATABASE}`);
    const result = await mssqlPool.request().query('SELECT @@VERSION as version');
    logger.info(`MSSQL version: ${result.recordset[0].version}`);
  } catch (err) {
    logger.error('MSSQL connection failed', { error: err });
    throw err;
  }
}

export async function connectDB(): Promise<void> {
  try {
    await connectMySQL();
    await createTransactionsTable();
    await connectMSSQL();
    logger.info('All database connections established successfully');
  } catch (err) {
    logger.error('Failed to connect to one or more databases', { error: err });
    process.exit(1);
  }
}

export async function getMssqlPool(): Promise<mssql.ConnectionPool> {
  if (!mssqlPool) {
    await connectMSSQL();
  }
  if (!mssqlPool) {
    throw new Error('Failed to connect to MSSQL');
  }
  return mssqlPool;
}

export { mysqlPool as mysql, mssqlPool as mssql };
export default mysqlPool; // Keep backward compatibility for sync.ts