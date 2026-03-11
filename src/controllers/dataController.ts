import { Request, Response } from 'express';
import { logger } from '../config/logger';
import mysqlPool from '../config/db';

// Get all transactions
export const getTransactions = async (req: Request, res: Response) => {
  try {
    const conn = await mysqlPool.getConnection();
    try {
      const [rows] = await conn.query('SELECT * FROM transactions ORDER BY Begin46Date DESC');
      logger.info(`Fetched ${(rows as any).length} transaction records`);
      res.json({
        message: 'Transactions retrieved successfully',
        total: (rows as any).length,
        data: rows
      });
    } finally {
      conn.release();
    }
  } catch (err) {
    logger.error('Error fetching transactions', err);
    res.status(500).json({
      message: 'Failed to fetch transactions',
      error: (err as any).message
    });
  }
};

// Get transactions with pagination
export const getTransactionsPaginated = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const conn = await mysqlPool.getConnection();
    try {
      // Get total count
      const [countResult] = await conn.query('SELECT COUNT(*) as total FROM transactions');
      const total = (countResult as any)[0].total;
      
      // Get paginated data
      const [rows] = await conn.query(
        'SELECT * FROM transactions ORDER BY Begin46Date DESC LIMIT ? OFFSET ?',
        [limit, offset]
      );
      
      logger.info(`Fetched page ${page} of transactions`);
      res.json({
        message: 'Transactions retrieved successfully',
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total as number / limit)
        },
        data: rows
      });
    } finally {
      conn.release();
    }
  } catch (err) {
    logger.error('Error fetching paginated transactions', err);
    res.status(500).json({
      message: 'Failed to fetch transactions',
      error: (err as any).message
    });
  }
};

// Get all receive data (from transactions table)
export const getReceiveData = async (req: Request, res: Response) => {
  try {
    const conn = await mysqlPool.getConnection();
    try {
      const [rows] = await conn.query('SELECT * FROM transactions WHERE TransactionType = "Receive" ORDER BY Begin46Date DESC');
      logger.info(`Fetched ${(rows as any).length} receive records`);
      res.json({
        message: 'Receive data retrieved successfully',
        total: (rows as any).length,
        data: rows
      });
    } finally {
      conn.release();
    }
  } catch (err) {
    logger.error('Error fetching receive data', err);
    res.status(500).json({
      message: 'Failed to fetch receive data',
      error: (err as any).message
    });
  }
};

// Get receive data with pagination
export const getReceiveDataPaginated = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const conn = await mysqlPool.getConnection();
    try {
      // Get total count
      const [countResult] = await conn.query('SELECT COUNT(*) as total FROM transactions WHERE TransactionType = "Receive"');
      const total = (countResult as any)[0].total;
      
      // Get paginated data
      const [rows] = await conn.query(
        'SELECT * FROM transactions WHERE TransactionType = "Receive" ORDER BY Begin46Date DESC LIMIT ? OFFSET ?',
        [limit, offset]
      );
      
      logger.info(`Fetched page ${page} of receive records`);
      res.json({
        message: 'Receive data retrieved successfully',
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total as number / limit)
        },
        data: rows
      });
    } finally {
      conn.release();
    }
  } catch (err) {
    logger.error('Error fetching paginated receive data', err);
    res.status(500).json({
      message: 'Failed to fetch receive data',
      error: (err as any).message
    });
  }
};

// Get all pay data (from transactions table)
export const getPayData = async (req: Request, res: Response) => {
  try {
    const conn = await mysqlPool.getConnection();
    try {
      const [rows] = await conn.query('SELECT * FROM transactions WHERE TransactionType = "Pay" ORDER BY Begin46Date DESC');
      logger.info(`Fetched ${(rows as any).length} pay records`);
      res.json({
        message: 'Pay data retrieved successfully',
        total: (rows as any).length,
        data: rows
      });
    } finally {
      conn.release();
    }
  } catch (err) {
    logger.error('Error fetching pay data', err);
    res.status(500).json({
      message: 'Failed to fetch pay data',
      error: (err as any).message
    });
  }
};

// Get pay data with pagination
export const getPayDataPaginated = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const conn = await mysqlPool.getConnection();
    try {
      // Get total count
      const [countResult] = await conn.query('SELECT COUNT(*) as total FROM transactions WHERE TransactionType = "Pay"');
      const total = (countResult as any)[0].total;
      
      // Get paginated data
      const [rows] = await conn.query(
        'SELECT * FROM transactions WHERE TransactionType = "Pay" ORDER BY Begin46Date DESC LIMIT ? OFFSET ?',
        [limit, offset]
      );
      
      logger.info(`Fetched page ${page} of pay records`);
      res.json({
        message: 'Pay data retrieved successfully',
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total as number / limit)
        },
        data: rows
      });
    } finally {
      conn.release();
    }
  } catch (err) {
    logger.error('Error fetching paginated pay data', err);
    res.status(500).json({
      message: 'Failed to fetch pay data',
      error: (err as any).message
    });
  }
};

// Get sync statistics
export const getSyncStats = async (req: Request, res: Response) => {
  try {
    const conn = await mysqlPool.getConnection();
    try {
      const [totalResultArr] = await conn.query(
        'SELECT COUNT(*) as total, MAX(synced_at) as lastSynced FROM transactions'
      );
      const totalStats = (totalResultArr as any)[0];
      
      const [receiveResultArr] = await conn.query(
        'SELECT COUNT(*) as total, MAX(synced_at) as lastSynced FROM transactions WHERE TransactionType = "Receive"'
      );
      const receiveStats = (receiveResultArr as any)[0];
      
      const [payResultArr] = await conn.query(
        'SELECT COUNT(*) as total, MAX(synced_at) as lastSynced FROM transactions WHERE TransactionType = "Pay"'
      );
      const payStats = (payResultArr as any)[0];
      
      logger.info('Fetched sync statistics');
      res.json({
        message: 'Sync statistics retrieved successfully',
        total: totalStats,
        receive: receiveStats,
        pay: payStats
      });
    } finally {
      conn.release();
    }
  } catch (err) {
    logger.error('Error fetching sync statistics', err);
    res.status(500).json({
      message: 'Failed to fetch sync statistics',
      error: (err as any).message
    });
  }
};

// Get filtered transactions with optional type and date filters
export const getFilteredTransactions = async (req: Request, res: Response) => {
  try {
    const { type, dateFrom, dateTo, page = '1', limit = '50' } = req.query;
    
    const conn = await mysqlPool.getConnection();
    try {
      let query = 'SELECT * FROM transactions WHERE 1=1';
      const params: any[] = [];
      
      // Add type filter
      if (type && type !== 'all') {
        query += ' AND TransactionType = ?';
        params.push(type);
      }
      
      // Add date filters
      if (dateFrom) {
        query += ' AND DATE(Begin46Date) >= ?';
        params.push(dateFrom);
      }
      
      if (dateTo) {
        query += ' AND DATE(Begin46Date) <= ?';
        params.push(dateTo);
      }
      
      // Add pagination
      const pageNum = parseInt(page as string) || 1;
      const limitNum = parseInt(limit as string) || 50;
      const offset = (pageNum - 1) * limitNum;
      
      // Get total count for pagination
      const [countResult] = await conn.query(`SELECT COUNT(*) as total FROM (${query}) as filtered`, params);
      const total = (countResult as any)[0].total;
      
      // Add ordering and pagination
      query += ' ORDER BY Begin46Date DESC LIMIT ? OFFSET ?';
      params.push(limitNum, offset);
      
      const [rows] = await conn.query(query, params);
      
      logger.info(`Fetched filtered transactions: type=${type}, dateFrom=${dateFrom}, dateTo=${dateTo}, page=${pageNum}`);
      res.json({
        message: 'Filtered transactions retrieved successfully',
        filters: { type, dateFrom, dateTo },
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum)
        },
        data: rows
      });
    } finally {
      conn.release();
    }
  } catch (err) {
    logger.error('Error fetching filtered transactions', err);
    res.status(500).json({
      message: 'Failed to fetch filtered transactions',
      error: (err as any).message
    });
  }
};