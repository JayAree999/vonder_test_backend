import mysqlPool from '../config/db';

// Transaction table creation SQL
export const CREATE_TRANSACTIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    TransactionType ENUM('receive', 'pay', 'edit') NOT NULL,
    Begin46Date DATETIME NOT NULL,
    DocNo VARCHAR(50) NOT NULL,
    Lot VARCHAR(50) NOT NULL,
    ProductName VARCHAR(100) NOT NULL,
    ColorCode VARCHAR(50) NOT NULL,
    ColorName VARCHAR(50) NOT NULL,
    Shape VARCHAR(50) NOT NULL,
    TotalQty INT NOT NULL,
    LotList_Sorted TEXT,
    instock BOOLEAN NOT NULL DEFAULT 1,
    latestUpdateDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ReFrom VARCHAR(50),
    PayTo VARCHAR(50),
    PayFrom VARCHAR(50),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type (TransactionType),
    INDEX idx_Begin46Date (Begin46Date),
    INDEX idx_DocNo (DocNo),
    INDEX idx_Lot (Lot)
  );
`;

// Interface for transaction
export interface ITransaction {
  id?: number;
  type: 'receive' | 'pay' | 'edit';
  Begin46Date: Date;
  DocNo: string;
  Lot: string;
  ProductName: string;
  ColorCode: string;
  ColorName: string;
  Shape: string;
  TotalQty: number;
  LotList_Sorted?: string;
  instock: boolean;
  latestUpdateDate: Date;
  ReFrom?: string;
  PayTo?: string;
  PayFrom?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Function to create the table
export async function createTransactionsTable(): Promise<void> {
  try {
    await mysqlPool.execute(CREATE_TRANSACTIONS_TABLE);
    console.log('Transactions table created or already exists');
  } catch (error) {
    console.error('Error creating transactions table:', error);
    throw error;
  }
}
