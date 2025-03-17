import { Schema, model } from 'mongoose';

// 1. Create interface for Transaction
interface ITransaction {
  type: 'income' | 'expense';
  amount: number;
  date: Date;
  description: string;
}

// 2. Create Schema with TypeScript support
const transactionSchema = new Schema<ITransaction>({
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Amount cannot be negative']
  },
  date: {
    type: Date,
    default: Date.now,
    validate: {
      validator: (value: Date) => value <= new Date(),
      message: 'Transaction date cannot be in the future'
    }
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Description too long']
  }
});

// 3. Create and export Model
export default model<ITransaction>('Transaction', transactionSchema);
