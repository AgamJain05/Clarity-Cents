import mongoose, { Schema } from 'mongoose';
import { IGoal } from '../types';

const goalSchema = new Schema<IGoal>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Goal title is required'],
    trim: true,
    maxlength: [100, 'Goal title cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  targetAmount: {
    type: Number,
    required: [true, 'Target amount is required'],
    min: [0.01, 'Target amount must be greater than 0']
  },
  currentAmount: {
    type: Number,
    default: 0,
    min: [0, 'Current amount must be non-negative']
  },
  targetDate: {
    type: Date,
    required: [true, 'Target date is required']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    maxlength: [50, 'Category cannot exceed 50 characters']
  },
  priority: {
    type: String,
    required: [true, 'Priority is required'],
    enum: {
      values: ['low', 'medium', 'high'],
      message: 'Priority must be low, medium, or high'
    },
    default: 'medium'
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: {
      values: ['active', 'completed', 'paused', 'cancelled'],
      message: 'Status must be active, completed, paused, or cancelled'
    },
    default: 'active'
  },
  milestones: [{
    amount: {
      type: Number,
      required: true,
      min: [0, 'Milestone amount must be non-negative']
    },
    date: {
      type: Date,
      required: true
    },
    note: {
      type: String,
      trim: true,
      maxlength: [200, 'Milestone note cannot exceed 200 characters']
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
goalSchema.index({ userId: 1, status: 1 });
goalSchema.index({ userId: 1, priority: 1 });
goalSchema.index({ userId: 1, targetDate: 1 });
goalSchema.index({ userId: 1, createdAt: -1 });

// Virtual for remaining amount
goalSchema.virtual('remainingAmount').get(function() {
  return this.targetAmount - this.currentAmount;
});

// Virtual for percentage complete
goalSchema.virtual('percentageComplete').get(function() {
  return this.targetAmount > 0 ? (this.currentAmount / this.targetAmount) * 100 : 0;
});

// Virtual for days remaining
goalSchema.virtual('daysRemaining').get(function() {
  const now = new Date();
  const target = new Date(this.targetDate);
  const diffTime = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
});

// Virtual for average daily savings needed
goalSchema.virtual('requiredDailySavings').get(function() {
  const daysRemaining = (this as any).daysRemaining;
  const remainingAmount = (this as any).remainingAmount;
  return daysRemaining > 0 ? remainingAmount / daysRemaining : 0;
});

// Virtual for is on track
goalSchema.virtual('isOnTrack').get(function() {
  const daysRemaining = (this as any).daysRemaining;
  const requiredDailySavings = (this as any).requiredDailySavings;
  const currentAmount = this.currentAmount;
  const targetAmount = this.targetAmount;
  
  if (daysRemaining <= 0) {
    return currentAmount >= targetAmount;
  }
  
  // Simple check: if we've saved more than expected by now
  const expectedAmount = targetAmount - (requiredDailySavings * daysRemaining);
  return currentAmount >= expectedAmount;
});

export const Goal = mongoose.model<IGoal>('Goal', goalSchema); 