import { Request, Response } from 'express';
import Transaction from '../models/transaction_schema';
import { logger } from '../config/logger';
import { Parser } from 'json2csv';

// Create a new transaction
export const createTransaction = async (req: Request, res: Response) => {
  try {
    const { type, amount, description, date } = req.body;
    const transaction = new Transaction({ type, amount, description, date });
    await transaction.save();
    logger.info(`Transaction created: ${transaction._id}`);
    res.status(201).send(transaction);
  } catch (err) {
    logger.error('Error creating transaction', err);
    res.status(400).send(err);
  }
};

// Get all transactions
export const getAllTransactions = async (req: Request, res: Response) => {
  try {
    const transactions = await Transaction.find().sort({ date: -1 }); // Sort by date descending
    logger.info('Fetched all transactions');
    res.send(transactions);
  } catch (err) {
    logger.error('Error fetching transactions', err);
    res.status(500).send(err);
  }
};

// Calculate the balance
export const getBalance = async (req: Request, res: Response) => {
  try {
    const transactions = await Transaction.find();
    const balance = transactions.reduce((acc, transaction) => {
      return transaction.type === 'income' ? acc + transaction.amount : acc - transaction.amount;
    }, 0);
    logger.info('Calculated balance');
    res.send({ balance });
  } catch (err) {
    logger.error('Error calculating balance', err);
    res.status(500).send(err);
  }
};

// Search transactions by date and/or type
export const searchTransactions = async (req: Request, res: Response) => {
  try {
    const { date, type } = req.query;
    const query: any = {};

    if (date) {
      const startDate = new Date(date as string);
      const endDate = new Date(date as string);
      endDate.setDate(endDate.getDate() + 1);
      query.date = { $gte: startDate, $lt: endDate };
    }

    if (type) query.type = type;

    const transactions = await Transaction.find(query).sort({ date: -1 }); // Sort by date
    logger.info('Searched transactions');
    res.send(transactions);
  } catch (err) {
    logger.error('Error searching transactions', err);
    res.status(500).send(err);
  }
};

// Delete a transaction by ID
export const deleteTransaction = async (req: Request, res: Response) => {
  try {
    const transaction = await Transaction.findByIdAndDelete(req.params.id);
    logger.info(`Transaction deleted: ${req.params.id}`);
    res.send(transaction);
  } catch (err) {
    logger.error('Error deleting transaction', err);
    res.status(500).send(err);
  }
};

// Get a summary of income and expenses
export const getSummary = async (req: Request, res: Response) => {
  try {
    const transactions = await Transaction.find();
    const summary = transactions.reduce(
      (acc, transaction) => {
        if (transaction.type === 'income') {
          acc.income += transaction.amount;
        } else {
          acc.expense += transaction.amount;
        }
        return acc;
      },
      { income: 0, expense: 0 }
    );
    logger.info('Fetched summary');
    res.send(summary);
  } catch (err) {
    logger.error('Error fetching summary', err);
    res.status(500).send(err);
  }
};

// Export transactions to CSV
export const exportTransactions = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, type } = req.query;
    let query: any = {};

    // Apply filters if provided
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }

    if (type && type !== 'all') {
      query.type = type;
    }

    // Fetch transactions with potential filters
    const transactions = await Transaction.find(query).sort({ date: -1 });

    // Format transactions for CSV
    const formattedTransactions = transactions.map((transaction) => {
      const t = transaction.toObject();
      return {
        id: t._id,
        type: t.type,
        amount: t.amount,
        description: t.description,
        date: new Date(t.date).toISOString().split('T')[0], // Simple YYYY-MM-DD format
      };
    });

    // Define fields for CSV
    const fields = ['id', 'type', 'amount', 'description', 'date'];
    const opts = { fields, header: true };

    // Convert JSON to CSV
    const parser = new Parser(opts);
    const csv = parser.parse(formattedTransactions);

    // Set headers for file download
    res.header('Content-Type', 'text/csv');
    res.attachment('transactions.csv');
    logger.info('Exported transactions to CSV');
    res.send(csv);
  } catch (err) {
    logger.error('Error exporting transactions', err);
    res.status(500).send(err);
  }
};