import { Request, Response } from 'express';
import { logger } from '../config/logger';
import { runSync, runSyncReceive, runSyncPay } from '../../sync';

// Sync all data (receive and pay)
export const syncAllData = async (req: Request, res: Response) => {
  try {
    logger.info('Starting full data sync');
    const result = await runSync();

    if (result.error) {
      logger.error('Sync failed', { error: result.error });
      res.status(500).json({
        message: 'Sync failed',
        error: result.error,
        receive: result.receive,
        pay: result.pay,
        duration: result.duration
      });
    } else {
      logger.info('Sync completed successfully', {
        receive: result.receive,
        pay: result.pay,
        duration: result.duration
      });
      res.json({
        message: 'Sync completed successfully',
        receive: result.receive,
        pay: result.pay,
        duration: result.duration
      });
    }
  } catch (error: any) {
    logger.error('Error during sync', error);
    res.status(500).json({
      message: 'Sync failed',
      error: error.message
    });
  }
};

// Sync receive data only
export const syncReceiveData = async (req: Request, res: Response) => {
  try {
    logger.info('Starting receive data sync');
    const result = await runSyncReceive();

    if (result.error) {
      logger.error('Receive sync failed', { error: result.error });
      res.status(500).json({
        message: 'Receive sync failed',
        error: result.error,
        receive: result.receive,
        duration: result.duration
      });
    } else {
      logger.info('Receive sync completed', {
        receive: result.receive,
        duration: result.duration
      });
      res.json({
        message: 'Receive sync completed successfully',
        receive: result.receive,
        duration: result.duration
      });
    }
  } catch (error: any) {
    logger.error('Error during receive sync', error);
    res.status(500).json({
      message: 'Receive sync failed',
      error: error.message
    });
  }
};

// Sync pay data only
export const syncPayData = async (req: Request, res: Response) => {
  try {
    logger.info('Starting pay data sync');
    const result = await runSyncPay();

    if (result.error) {
      logger.error('Pay sync failed', { error: result.error });
      res.status(500).json({
        message: 'Pay sync failed',
        error: result.error,
        pay: result.pay,
        duration: result.duration
      });
    } else {
      logger.info('Pay sync completed', {
        pay: result.pay,
        duration: result.duration
      });
      res.json({
        message: 'Pay sync completed successfully',
        pay: result.pay,
        duration: result.duration
      });
    }
  } catch (error: any) {
    logger.error('Error during pay sync', error);
    res.status(500).json({
      message: 'Pay sync failed',
      error: error.message
    });
  }
};