import { Request } from 'express';
import { Document, ObjectId } from 'mongoose';

// User Types
export interface IUser extends Document {
  _id: ObjectId;
  name: string;
  email: string;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  password: string;
  avatar?: string;
  isPremium: boolean;
  joinDate: Date;
  preferences: {
    currency: string;
    notifications: boolean;
    biometricAuth: boolean;
    darkMode: boolean;
    language: string;
  };
  refreshToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
}

// Transaction Types
export interface ITransaction extends Document {
  _id: ObjectId;
  userId: ObjectId;
  merchant: string;
  amount: number;
  category: string;
  date: Date;
  time: string;
  type: 'expense' | 'income';
  description?: string;
  attachments?: string[];
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Budget Category Types
export interface IBudgetCategory extends Document {
  _id: ObjectId;
  userId: ObjectId;
  name: string;
  allocated: number;
  spent: number;
  color: string;
  icon?: string;
  period: 'weekly' | 'monthly' | 'yearly';
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Goal Types
export interface IGoal extends Document {
  _id: ObjectId;
  userId: ObjectId;
  title: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  category: string;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  milestones?: {
    amount: number;
    date: Date;
    note?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

// Category Types
export interface ICategory extends Document {
  _id: ObjectId;
  name: string;
  type: 'expense' | 'income' | 'both';
  icon: string;
  color: string;
  isDefault: boolean;
  userId?: ObjectId; // null for default categories, ObjectId for user-created
  createdAt: Date;
  updatedAt: Date;
}

// Notification Types
export interface INotification extends Document {
  _id: ObjectId;
  userId: ObjectId;
  title: string;
  message: string;
  type: 'budget_alert' | 'goal_milestone' | 'system' | 'reminder';
  isRead: boolean;
  data?: any;
  createdAt: Date;
  updatedAt: Date;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

// Authentication Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

// Transaction Filter Types
export interface TransactionFilters {
  userId: ObjectId;
  type?: 'expense' | 'income';
  category?: string;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  merchant?: string;
  tags?: string[];
}

// Budget Analysis Types
export interface BudgetAnalysis {
  categoryId: ObjectId;
  categoryName: string;
  allocated: number;
  spent: number;
  remaining: number;
  percentageUsed: number;
  status: 'under_budget' | 'on_track' | 'over_budget';
  daysRemaining: number;
  averageDailySpending: number;
  projectedSpending: number;
}

// Goal Progress Types
export interface GoalProgress {
  goalId: ObjectId;
  title: string;
  targetAmount: number;
  currentAmount: number;
  remainingAmount: number;
  percentageComplete: number;
  daysRemaining: number;
  averageDailySavings: number;
  requiredDailySavings: number;
  isOnTrack: boolean;
}

// Dashboard Stats Types
export interface DashboardStats {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyBudget: number;
  budgetRemaining: number;
  activeGoals: number;
  completedGoals: number;
  savingsRate: number;
  topCategories: {
    category: string;
    amount: number;
    percentage: number;
  }[];
  recentTransactions: ITransaction[];
  budgetAlerts: BudgetAnalysis[];
  goalProgress: GoalProgress[];
}

// Export/Import Types
export interface ExportData {
  user: Partial<IUser>;
  transactions: ITransaction[];
  budgetCategories: IBudgetCategory[];
  goals: IGoal[];
  categories: ICategory[];
  exportDate: Date;
  version: string;
}

export interface ImportResult {
  success: boolean;
  imported: {
    transactions: number;
    budgetCategories: number;
    goals: number;
    categories: number;
  };
  errors: string[];
  warnings: string[];
}
