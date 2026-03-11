import { Request, Response } from 'express';
import mysqlPool from '../config/db';
import { ITransaction } from '../models/transaction_schema';
import { logger } from '../config/logger';

// Create a new transaction
export const createTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      type,
      Begin46Date,
      DocNo,
      Lot,
      ProductName,
      ColorCode,
      ColorName,
      Shape,
      SUM,
      LotList_Sorted,
      synced_at = new Date(),
      ReFrom,
      PayTo,
      PayFrom
    } = req.body;

    // Validate required fields (only date, type, and quantity)
    if (!type || !Begin46Date || SUM === undefined) {
      res.status(400).json({ message: 'Missing required fields: type, Begin46Date, and SUM are required' });
      return;
    }

    // Validate type
    if (!['receive', 'pay', 'edit'].includes(type)) {
      res.status(400).json({ message: 'Invalid transaction type. Must be receive, pay, or edit' });
      return;
    }

    const query = `
      INSERT INTO transactions (TransactionType, Begin46Date, DocNo, Lot, ProductName, ColorCode, ColorName, Shape, SUM, LotList_Sorted, synced_at, ReFrom, PayTo, PayFrom)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      type,
      Begin46Date,
      DocNo || null,
      Lot || null,
      ProductName || null,
      ColorCode || null,
      ColorName || null,
      Shape || null,
      SUM,
      LotList_Sorted || null,
      synced_at,
      ReFrom || null,
      PayTo || null,
      PayFrom || null
    ];

    const [result] = await mysqlPool.execute(query, values as any);

    logger.info('Transaction created successfully', { id: (result as any).insertId, type });
    res.status(201).json({
      message: 'Transaction created successfully',
      transaction: {
        id: (result as any).insertId,
        type,
        Begin46Date,
        DocNo,
        Lot,
        ProductName,
        ColorCode,
        ColorName,
        Shape,
        SUM,
        LotList_Sorted,
        synced_at,
        ReFrom,
        PayTo,
        PayFrom
      }
    });
    return;
  } catch (error: any) {
    logger.error('Error creating transaction', error);
    res.status(500).json({
      message: 'Failed to create transaction',
      error: error.message
    });
    return;
  }
};

// Get all transactions (optionally filtered by type)
export const getTransactions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type } = req.query;
    let query = 'SELECT *, TransactionType AS type FROM transactions';
    let values: any[] = [];

    if (type && typeof type === 'string') {
      query += ' WHERE TransactionType = ?';
      values.push(type.toLowerCase());
    }

    query += ' ORDER BY Begin46Date DESC';

    const [rows] = await mysqlPool.execute(query, values as any);
    res.json(rows);
    return;
  } catch (error: any) {
    logger.error('Error fetching transactions', error);
    res.status(500).json({
      message: 'Failed to fetch transactions',
      error: error.message
    });
    return;
  }
};

// Get transaction by ID
export const getTransactionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const [rows] = await mysqlPool.execute('SELECT *, TransactionType AS type FROM transactions WHERE id = ?', [id]);

    if ((rows as any[]).length === 0) {
      res.status(404).json({ message: 'Transaction not found' });
      return;
    }

    res.json((rows as any[])[0]);
    return;
  } catch (error: any) {
    logger.error('Error fetching transaction', error);
    res.status(500).json({
      message: 'Failed to fetch transaction',
      error: error.message
    });
    return;
  }
};

// Update transaction
export const updateTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData: any = req.body; // using any so we can iterate properties more flexibly

    // Validate type if provided
    if (updateData.type && !['receive', 'pay', 'edit'].includes(updateData.type)) {
      res.status(400).json({ message: 'Invalid transaction type. Must be receive, pay, or edit' });
      return;
    }

    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(updateData)) {
      if (value !== undefined) {
        // map object field name `type` to the database column TransactionType
        const column = key === 'type' ? 'TransactionType' : key;
        fields.push(`${column} = ?`);
        values.push(value);
      }
    }

    fields.push('synced = ?');
    values.push(new Date());

    values.push(id);

    const query = `UPDATE transactions SET ${fields.join(', ')} WHERE id = ?`;

    const [result] = await mysqlPool.execute(query, values as any);

    if ((result as any).affectedRows === 0) {
      res.status(404).json({ message: 'Transaction not found' });
      return;
    }

    // Fetch updated transaction
    const [rows] = await mysqlPool.execute('SELECT *, TransactionType AS type FROM transactions WHERE id = ?', [id]);

    logger.info('Transaction updated successfully', { id });
    res.json({
      message: 'Transaction updated successfully',
      transaction: (rows as any[])[0]
    });
    return;
  } catch (error: any) {
    logger.error('Error updating transaction', error);
    res.status(500).json({
      message: 'Failed to update transaction',
      error: error.message
    });
    return;
  }
};

// Delete transaction
export const deleteTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const [result] = await mysqlPool.execute('DELETE FROM transactions WHERE id = ?', [id]);

    if ((result as any).affectedRows === 0) {
      res.status(404).json({ message: 'Transaction not found' });
      return;
    }

    logger.info('Transaction deleted successfully', { id });
    res.json({ message: 'Transaction deleted successfully' });
    return;
  } catch (error: any) {
    logger.error('Error deleting transaction', error);
    res.status(500).json({
      message: 'Failed to delete transaction',
      error: error.message
    });
    return;
  }
};

// Get distinct lists of product names and color names
export const getProductsAndColors = async (req: Request, res: Response): Promise<void> => {
  try {
    const [productRows] = await mysqlPool.execute('SELECT DISTINCT ProductName FROM transactions WHERE ProductName IS NOT NULL AND ProductName <> ""');
    const [colorRows] = await mysqlPool.execute('SELECT DISTINCT ColorName FROM transactions WHERE ColorName IS NOT NULL AND ColorName <> ""');

    const products = (productRows as any[]).map(r => r.ProductName);
    const colors = (colorRows as any[]).map(r => r.ColorName);

    res.json({ products, colors });
    return;
  } catch (error: any) {
    logger.error('Error fetching products and colors', error);
    res.status(500).json({
      message: 'Failed to fetch products and colors',
      error: error.message
    });
    return;
  }
};