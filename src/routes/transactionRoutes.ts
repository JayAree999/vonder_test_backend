import express from 'express';
import {
  createTransaction,
  getAllTransactions,
  getBalance,
  searchTransactions,
  deleteTransaction,
  getSummary,
  exportTransactions,
} from '../controllers/transactionController';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Transactions
 *   description: API for managing transactions
 */

/**
 * @swagger
 * /api/transactions:
 *   post:
 *     summary: Create a new transaction
 *     tags: [Transactions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 description: Type of transaction (income or expense)
 *                 example: income
 *               amount:
 *                 type: number
 *                 description: Amount of the transaction
 *                 example: 100
 *               description:
 *                 type: string
 *                 description: Description of the transaction
 *                 example: Salary
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Date of the transaction
 *                 example: 2023-10-01
 *     responses:
 *       201:
 *         description: Transaction created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transaction'
 *       400:
 *         description: Invalid input
 */
router.post('/transactions', createTransaction);

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     summary: Get all transactions
 *     tags: [Transactions]
 *     responses:
 *       200:
 *         description: A list of transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Transaction'
 */
router.get('/transactions', getAllTransactions);

/**
 * @swagger
 * /api/balance:
 *   get:
 *     summary: Calculate the balance
 *     tags: [Transactions]
 *     responses:
 *       200:
 *         description: The calculated balance
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 balance:
 *                   type: number
 *                   description: The total balance
 *                   example: 500
 */
router.get('/balance', getBalance);

/**
 * @swagger
 * /api/transactions/search:
 *   get:
 *     summary: Search transactions by date and/or type
 *     tags: [Transactions]
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: The date to filter transactions (YYYY-MM-DD)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: The type of transaction (income or expense)
 *     responses:
 *       200:
 *         description: A list of filtered transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Transaction'
 */
router.get('/transactions/search', searchTransactions);

/**
 * @swagger
 * /api/transactions/{id}:
 *   delete:
 *     summary: Delete a transaction by ID
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The transaction ID
 *     responses:
 *       200:
 *         description: Transaction deleted successfully
 *       404:
 *         description: Transaction not found
 */
router.delete('/transactions/:id', deleteTransaction);

/**
 * @swagger
 * /api/summary:
 *   get:
 *     summary: Get a summary of income and expenses
 *     tags: [Transactions]
 *     responses:
 *       200:
 *         description: A summary of income and expenses
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 income:
 *                   type: number
 *                   description: Total income
 *                   example: 1000
 *                 expense:
 *                   type: number
 *                   description: Total expenses
 *                   example: 500
 */
router.get('/summary', getSummary);

/**
 * @swagger
 * /api/transactions/export:
 *   get:
 *     summary: Export transactions to CSV
 *     tags: [Transactions]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: The start date for filtering transactions (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: The end date for filtering transactions (YYYY-MM-DD)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: The type of transaction (income or expense)
 *     responses:
 *       200:
 *         description: CSV file exported successfully
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               example: "id,type,amount,description,date\n1,income,100,Salary,2023-10-01"
 */
router.get('/transactions/export', exportTransactions);

export default router;