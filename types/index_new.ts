export interface Transaction {
  id: string;
  merchant: string;
  amount: number;
  category: string;
  date: string;
  time: string;
  type: 'expense' | 'income';
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
}

export interface AppContextType {
  state: AppState;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateBudget: (categoryId: string, allocated: number) => void;
  addBudgetCategory: (category: Omit<BudgetCategory, 'id' | 'spent'>) => void;
  addGoal: (goal: Omit<Goal, 'id'>) => void;
  updateGoal: (goalId: string, updates: Partial<Goal>) => void;
  deleteGoal: (goalId: string) => void;
  addToGoal: (goalId: string, amount: number) => void;
  deleteTransaction: (transactionId: string) => void;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  getTotalSpent: () => number;
  getTotalIncome: () => number;
  getCategorySpending: (categoryName: string) => number;
}
