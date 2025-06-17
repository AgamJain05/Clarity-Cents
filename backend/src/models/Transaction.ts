import mongoose, { Schema } from 'mongoose';
import { ITransaction } from '../types';

const transactionSchema = new Schema<ITransaction>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  merchant: {
    type: String,
    required: [true, 'Merchant is required'],
    trim: true,
    maxlength: [100, 'Merchant name cannot exceed 100 characters']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    maxlength: [50, 'Category cannot exceed 50 characters']
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    index: true
  },
  time: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: [true, 'Type is required'],
    enum: {
      values: ['expense', 'income'],
      message: 'Type must be either expense or income'
    },
    index: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  attachments: [{
    type: String
  }],
  location: {
    latitude: {
      type: Number,
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90']
    },
    longitude: {
      type: Number,
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180']
    },
    address: {
      type: String,
      trim: true,
      maxlength: [200, 'Address cannot exceed 200 characters']
    }
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, type: 1 });
transactionSchema.index({ userId: 1, category: 1 });
transactionSchema.index({ userId: 1, createdAt: -1 });

// Virtual for formatted amount
transactionSchema.virtual('formattedAmount').get(function() {
  return this.type === 'expense' ? -this.amount : this.amount;
});

// Remove sensitive data when converting to JSON
transactionSchema.methods.toJSON = function() {
  const transactionObject = this.toObject();
  return transactionObject;
};

export const Transaction = mongoose.model<ITransaction>('Transaction', transactionSchema);
