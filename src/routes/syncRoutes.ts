import express from 'express';
import {
  syncAllData,
  syncReceiveData,
  syncPayData,
} from '../controllers/syncController';
import {
  getTransactions,
  getTransactionsPaginated,
  getReceiveData,
  getReceiveDataPaginated,
  getPayData,
  getPayDataPaginated,
  getSyncStats,
  getFilteredTransactions,
} from '../controllers/dataController';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Sync
 *   description: API for synchronizing data between MSSQL and MySQL
 */

/**
 * @swagger
 * /api/sync:
 *   post:
 *     summary: Synchronize all data from MSSQL to MySQL
 *     tags: [Sync]
 *     responses:
 *       200:
 *         description: Sync completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 receive:
 *                   type: number
 *                   description: Number of receive records synced
 *                   example: 150
 *                 pay:
 *                   type: number
 *                   description: Number of pay records synced
 *                   example: 75
 *                 duration:
 *                   type: number
 *                   description: Time taken for sync in milliseconds
 *                   example: 2500
 *                 error:
 *                   type: string
 *                   description: Error message if sync failed
 *                   example: "Connection failed"
 */
router.post('/sync', syncAllData);

/**
 * @swagger
 * /api/sync/receive:
 *   post:
 *     summary: Synchronize receive data from MSSQL to MySQL
 *     tags: [Sync]
 *     responses:
 *       200:
 *         description: Receive sync completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 receive:
 *                   type: number
 *                   description: Number of receive records synced
 *                   example: 150
 *                 duration:
 *                   type: number
 *                   description: Time taken for sync in milliseconds
 *                   example: 1200
 *                 error:
 *                   type: string
 *                   description: Error message if sync failed
 *                   example: "Connection failed"
 */
router.post('/sync/receive', syncReceiveData);

/**
 * @swagger
 * /api/sync/pay:
 *   post:
 *     summary: Synchronize pay data from MSSQL to MySQL
 *     tags: [Sync]
 *     responses:
 *       200:
 *         description: Pay sync completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pay:
 *                   type: number
 *                   description: Number of pay records synced
 *                   example: 75
 *                 duration:
 *                   type: number
 *                   description: Time taken for sync in milliseconds
 *                   example: 1300
 *                 error:
 *                   type: string
 *                   description: Error message if sync failed
 *                   example: "Connection failed"
 */
router.post('/sync/pay', syncPayData);

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     summary: Get all transactions (combined pay and receive)
 *     tags: [Sync]
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 total:
 *                   type: number
 *                 data:
 *                   type: array
 */
router.get('/transactions', getTransactions);

/**
 * @swagger
 * /api/transactions/paginated:
 *   get:
 *     summary: Get transactions with pagination
 *     tags: [Sync]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *         description: Page number (default 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *         description: Records per page (default 20)
 *     responses:
 *       200:
 *         description: Paginated transactions retrieved successfully
 */
router.get('/transactions/paginated', getTransactionsPaginated);

/**
 * @swagger
 * /api/transactions/filtered:
 *   get:
 *     summary: Get filtered transactions with optional type and date filters
 *     tags: [Sync]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [all, Receive, Pay]
 *         description: Transaction type filter (default all)
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date filter (YYYY-MM-DD)
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: End date filter (YYYY-MM-DD)
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *         description: Page number (default 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *         description: Records per page (default 50)
 *     responses:
 *       200:
 *         description: Filtered transactions retrieved successfully
 */
router.get('/transactions/filtered', getFilteredTransactions);

/**
 * @swagger
 * /api/receive-data:
 *   get:
 *     summary: Get all receive data
 *     tags: [Sync]
 *     responses:
 *       200:
 *         description: Receive data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 total:
 *                   type: number
 *                 data:
 *                   type: array
 */
router.get('/receive-data', getReceiveData);

/**
 * @swagger
 * /api/receive-data/paginated:
 *   get:
 *     summary: Get receive data with pagination
 *     tags: [Sync]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *         description: Page number (default 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *         description: Records per page (default 20)
 *     responses:
 *       200:
 *         description: Paginated receive data retrieved successfully
 */
router.get('/receive-data/paginated', getReceiveDataPaginated);

/**
 * @swagger
 * /api/pay-data:
 *   get:
 *     summary: Get all pay data
 *     tags: [Sync]
 *     responses:
 *       200:
 *         description: Pay data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 total:
 *                   type: number
 *                 data:
 *                   type: array
 */
router.get('/pay-data', getPayData);

/**
 * @swagger
 * /api/pay-data/paginated:
 *   get:
 *     summary: Get pay data with pagination
 *     tags: [Sync]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *         description: Page number (default 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *         description: Records per page (default 20)
 *     responses:
 *       200:
 *         description: Paginated pay data retrieved successfully
 */
router.get('/pay-data/paginated', getPayDataPaginated);

/**
 * @swagger
 * /api/sync-stats:
 *   get:
 *     summary: Get sync statistics
 *     tags: [Sync]
 *     responses:
 *       200:
 *         description: Sync statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 receive:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                     lastSynced:
 *                       type: string
 *                 pay:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                     lastSynced:
 *                       type: string
 */
router.get('/sync-stats', getSyncStats);

export default router;