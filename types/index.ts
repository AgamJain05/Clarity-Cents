export interface Transaction {
  id: string;
  merchant: string;
  amount: number;
  category: string;
  date: string;
  time: string;
  type: 'expense' | 'income';
  description?: string;
}

export interface BudgetCategory {
  id: string;
  name: string;
  allocated: number;
  spent: number;
  color: string;
  icon?: string;
}

export interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  category: string;
}

export interface UserProfile {
  name: string;
  email: string;
  currency: string;
  monthlyIncome: number;
}

export interface AppState {
  transactions: Transaction[];
  budgetCategories: BudgetCategory[];
  goals: Goal[];
  userProfile: UserProfile;
  totalBalance: number;
  isLoading: boolean;
}

export interface AppContextType {
  state: AppState;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  updateBudget: (categoryId: string, allocated: number) => Promise<void>;
  addBudgetCategory: (category: Omit<BudgetCategory, 'id' | 'spent'>) => Promise<void>;
  addGoal: (goal: Omit<Goal, 'id'>) => Promise<void>;
  updateGoal: (goalId: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  addToGoal: (goalId: string, amount: number) => Promise<void>;
  deleteTransaction: (transactionId: string) => Promise<void>;
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>;
  getTotalSpent: () => number;
  getTotalIncome: () => number;
  getCategorySpending: (categoryName: string) => number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isPremium: boolean;
  joinDate: string;
  preferences: {
    currency: string;
    notifications: boolean;
    biometricAuth: boolean;
    darkMode: boolean;
    language: string;
  };
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface AuthContextType {
  state: AuthState;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  updatePreferences: (preferences: Partial<User['preferences']>) => Promise<void>;
  deleteAccount: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
}