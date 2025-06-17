import mongoose, { Schema } from 'mongoose';
import { IBudgetCategory } from '../types';

const budgetCategorySchema = new Schema<IBudgetCategory>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Budget name is required'],
    trim: true,
    maxlength: [50, 'Budget name cannot exceed 50 characters']
  },
  allocated: {
    type: Number,
    required: [true, 'Allocated amount is required'],
    min: [0, 'Allocated amount must be non-negative']
  },
  spent: {
    type: Number,
    default: 0,
    min: [0, 'Spent amount must be non-negative']
  },
  color: {
    type: String,
    required: [true, 'Color is required'],
    default: '#3B82F6'
  },
  icon: {
    type: String,
    default: '💰'
  },
  period: {
    type: String,
    required: [true, 'Period is required'],
    enum: {
      values: ['weekly', 'monthly', 'yearly'],
      message: 'Period must be weekly, monthly, or yearly'
    },
    default: 'monthly'
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
    default: Date.now
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
budgetCategorySchema.index({ userId: 1, isActive: 1 });
budgetCategorySchema.index({ userId: 1, period: 1 });
budgetCategorySchema.index({ userId: 1, startDate: 1, endDate: 1 });

// Virtual for remaining budget
budgetCategorySchema.virtual('remaining').get(function() {
  return this.allocated - this.spent;
});

// Virtual for percentage used
budgetCategorySchema.virtual('percentageUsed').get(function() {
  return this.allocated > 0 ? (this.spent / this.allocated) * 100 : 0;
});

// Virtual for status
budgetCategorySchema.virtual('status').get(function() {
  const percentage = (this as any).percentageUsed;
  if (percentage >= 100) return 'over_budget';
  if (percentage >= 80) return 'on_track';
  return 'under_budget';
});

export const BudgetCategory = mongoose.model<IBudgetCategory>('BudgetCategory', budgetCategorySchema); 