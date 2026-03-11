import express from 'express';
import {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  getProductsAndColors
} from '../controllers/transactionController';

const router = express.Router();

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
 *             required:
 *               - type
 *               - Begin46Date
 *               - DocNo
 *               - Lot
 *               - ProductName
 *               - ColorCode
 *               - ColorName
 *               - Shape
 *               - TotalQty
 *               - instock
 *               - latestUpdateDate
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [receive, pay, edit]
 *               Begin46Date:
 *                 type: string
 *                 format: date
 *               DocNo:
 *                 type: string
 *               Lot:
 *                 type: string
 *               ProductName:
 *                 type: string
 *               ColorCode:
 *                 type: string
 *               ColorName:
 *                 type: string
 *               Shape:
 *                 type: string
 *               TotalQty:
 *                 type: number
 *               LotList_Sorted:
 *                 type: string
 *               instock:
 *                 type: boolean
 *               latestUpdateDate:
 *                 type: string
 *                 format: date-time
 *               ReFrom:
 *                 type: string
 *               PayTo:
 *                 type: string
 *               PayFrom:
 *                 type: string
 *     responses:
 *       201:
 *         description: Transaction created successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
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
 *         description: List of transactions
 *       500:
 *         description: Server error
 */
router.get('/transactions', getTransactions);

/**
 * @swagger
 * /api/transactions/{id}:
 *   get:
 *     summary: Get transaction by ID
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction details
 *       404:
 *         description: Transaction not found
 *       500:
 *         description: Server error
 */
router.get('/transactions/:id', getTransactionById);

/**
 * @swagger
 * /api/transactions/{id}:
 *   put:
 *     summary: Update transaction
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [receive, pay, edit]
 *               Begin46Date:
 *                 type: string
 *                 format: date
 *               DocNo:
 *                 type: string
 *               Lot:
 *                 type: string
 *               ProductName:
 *                 type: string
 *               ColorCode:
 *                 type: string
 *               ColorName:
 *                 type: string
 *               Shape:
 *                 type: string
 *               TotalQty:
 *                 type: number
 *               LotList_Sorted:
 *                 type: string
 *               instock:
 *                 type: boolean
 *               latestUpdateDate:
 *                 type: string
 *                 format: date-time
 *               ReFrom:
 *                 type: string
 *               PayTo:
 *                 type: string
 *               PayFrom:
 *                 type: string
 *     responses:
 *       200:
 *         description: Transaction updated successfully
 *       404:
 *         description: Transaction not found
 *       500:
 *         description: Server error
 */
router.put('/transactions/:id', updateTransaction);

/**
 * @swagger
 * /api/transactions/{id}:
 *   delete:
 *     summary: Delete transaction
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction deleted successfully
 *       404:
 *         description: Transaction not found
 *       500:
 *         description: Server error
 */
router.delete('/transactions/:id', deleteTransaction);

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get distinct list of product names and color names
 *     tags: [Transactions]
 *     responses:
 *       200:
 *         description: Lists of products and colors
 *       500:
 *         description: Server error
 */
router.get('/products', getProductsAndColors);

export default router;