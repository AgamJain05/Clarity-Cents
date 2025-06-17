import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../services/ApiService';
import { AppState, AppContextType, Transaction, BudgetCategory, UserProfile, Goal } from '../types';
import { useAuth } from './AuthContext';

// Initial state
const initialState: AppState = {
  transactions: [],
  budgetCategories: [],
  goals: [],
  userProfile: {
    name: '',
    email: '',
    currency: 'USD',
    monthlyIncome: 0,
  },
  totalBalance: 0,
  isLoading: false,
};

// Action types
type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'DELETE_TRANSACTION'; payload: string }
  | { type: 'SET_BUDGETS'; payload: BudgetCategory[] }
  | { type: 'ADD_BUDGET_CATEGORY'; payload: BudgetCategory }
  | { type: 'UPDATE_BUDGET'; payload: { categoryId: string; allocated: number } }
  | { type: 'SET_GOALS'; payload: Goal[] }
  | { type: 'ADD_GOAL'; payload: Goal }
  | { type: 'UPDATE_GOAL'; payload: { goalId: string; updates: Partial<Goal> } }
  | { type: 'DELETE_GOAL'; payload: string }
  | { type: 'UPDATE_USER_PROFILE'; payload: Partial<UserProfile> }
  | { type: 'LOAD_DATA'; payload: Partial<AppState> }
  | { type: 'CLEAR_DATA' };

// Reducer
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_TRANSACTIONS':
      const totalBalance = action.payload.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -Math.abs(t.amount)), 0);
      return { ...state, transactions: action.payload, totalBalance };

    case 'ADD_TRANSACTION':
      const newTransactions = [...state.transactions, action.payload];
      const newBalance = state.totalBalance + (action.payload.type === 'income' ? action.payload.amount : -Math.abs(action.payload.amount));
      return { ...state, transactions: newTransactions, totalBalance: newBalance };

    case 'DELETE_TRANSACTION':
      const transactionToDelete = state.transactions.find(t => t.id === action.payload);
      const filteredTransactions = state.transactions.filter(t => t.id !== action.payload);
      const adjustedBalance = transactionToDelete 
        ? state.totalBalance - (transactionToDelete.type === 'income' ? transactionToDelete.amount : -Math.abs(transactionToDelete.amount))
        : state.totalBalance;
      return { ...state, transactions: filteredTransactions, totalBalance: adjustedBalance };

    case 'SET_BUDGETS':
      return { ...state, budgetCategories: action.payload };

    case 'ADD_BUDGET_CATEGORY':
      return { ...state, budgetCategories: [...state.budgetCategories, action.payload] };

    case 'UPDATE_BUDGET':
      return {
        ...state,
        budgetCategories: state.budgetCategories.map(category =>
          category.id === action.payload.categoryId
            ? { ...category, allocated: action.payload.allocated }
            : category
        ),
      };

    case 'SET_GOALS':
      return { ...state, goals: action.payload };

    case 'ADD_GOAL':
      return { ...state, goals: [...state.goals, action.payload] };

    case 'UPDATE_GOAL':
      return {
        ...state,
        goals: state.goals.map(goal =>
          goal.id === action.payload.goalId
            ? { ...goal, ...action.payload.updates }
            : goal
        ),
      };

    case 'DELETE_GOAL':
      return { ...state, goals: state.goals.filter(goal => goal.id !== action.payload) };

    case 'UPDATE_USER_PROFILE':
      return { ...state, userProfile: { ...state.userProfile, ...action.payload } };

    case 'LOAD_DATA':
      return { ...state, ...action.payload };

    case 'CLEAR_DATA':
      console.log('🔵 APP CONTEXT REDUCER: CLEAR_DATA action received, clearing all data');
      return initialState;

    default:
      return state;
  }
};

// Context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { state: authState } = useAuth();

  // Load data when user is authenticated
  useEffect(() => {
    console.log('🔵 APP CONTEXT: useEffect triggered with auth state:', {
      isAuthenticated: authState.isAuthenticated,
      user: authState.user?.email,
      isLoading: authState.isLoading
    });
    
    if (authState.isAuthenticated && authState.user) {
      console.log('🔵 APP CONTEXT: User is authenticated, loading data...');
      loadAllData();
    } else {
      console.log('🔵 APP CONTEXT: User is not authenticated, clearing data...');
      dispatch({ type: 'CLEAR_DATA' });
    }
  }, [authState.isAuthenticated]);

  const loadAllData = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Load all data in parallel
      const [transactionsRes, budgetsRes, goalsRes] = await Promise.all([
        ApiService.getTransactions(),
        ApiService.getBudgets(),
        ApiService.getGoals(),
      ]);

      if (transactionsRes.success) {
        dispatch({ type: 'SET_TRANSACTIONS', payload: transactionsRes.data.transactions || [] });
      }

      if (budgetsRes.success) {
        dispatch({ type: 'SET_BUDGETS', payload: budgetsRes.data.budgets || [] });
      }

      if (goalsRes.success) {
        dispatch({ type: 'SET_GOALS', payload: goalsRes.data.goals || [] });
      }

      // Update user profile from auth context
      if (authState.user) {
        dispatch({ 
          type: 'UPDATE_USER_PROFILE', 
          payload: {
            name: authState.user.name,
            email: authState.user.email,
            currency: authState.user.preferences.currency,
          }
        });
      }

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await ApiService.createTransaction({
        merchant: transaction.merchant,
        amount: Math.abs(transaction.amount),
        category: transaction.category,
        date: transaction.date,
        type: transaction.type,
        description: transaction.description,
      });

      if (response.success && response.data?.transaction) {
        const newTransaction = {
          id: response.data.transaction._id,
          merchant: response.data.transaction.merchant,
          amount: response.data.transaction.type === 'income' 
            ? response.data.transaction.amount 
            : -response.data.transaction.amount,
          category: response.data.transaction.category,
          date: new Date(response.data.transaction.date).toLocaleDateString(),
          time: response.data.transaction.time,
          type: response.data.transaction.type,
          description: response.data.transaction.description,
        };
        dispatch({ type: 'ADD_TRANSACTION', payload: newTransaction });
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const deleteTransaction = async (transactionId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await ApiService.deleteTransaction(transactionId);
      
      if (response.success) {
        dispatch({ type: 'DELETE_TRANSACTION', payload: transactionId });
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const addBudgetCategory = async (category: Omit<BudgetCategory, 'id' | 'spent'>) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await ApiService.createBudget({
        name: category.name,
        allocated: category.allocated,
        color: category.color,
        period: 'monthly',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      });

      if (response.success && response.data?.budget) {
        const newBudget = {
          id: response.data.budget._id,
          name: response.data.budget.name,
          allocated: response.data.budget.allocated,
          spent: response.data.budget.spent || 0,
          color: response.data.budget.color,
        };
        dispatch({ type: 'ADD_BUDGET_CATEGORY', payload: newBudget });
      }
    } catch (error) {
      console.error('Error adding budget:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateBudget = async (categoryId: string, allocated: number) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await ApiService.updateBudget(categoryId, { allocated });
      
      if (response.success) {
        dispatch({ type: 'UPDATE_BUDGET', payload: { categoryId, allocated } });
      }
    } catch (error) {
      console.error('Error updating budget:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const addGoal = async (goal: Omit<Goal, 'id'>) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await ApiService.createGoal({
        title: goal.title,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount || 0,
        targetDate: goal.targetDate,
        category: goal.category,
        priority: 'medium',
      });

      if (response.success && response.data?.goal) {
        const newGoal = {
          id: response.data.goal._id,
          title: response.data.goal.title,
          targetAmount: response.data.goal.targetAmount,
          currentAmount: response.data.goal.currentAmount,
          targetDate: new Date(response.data.goal.targetDate).toLocaleDateString(),
          category: response.data.goal.category,
        };
        dispatch({ type: 'ADD_GOAL', payload: newGoal });
      }
    } catch (error) {
      console.error('Error adding goal:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateGoal = async (goalId: string, updates: Partial<Goal>) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await ApiService.updateGoal(goalId, updates);
      
      if (response.success) {
        dispatch({ type: 'UPDATE_GOAL', payload: { goalId, updates } });
      }
    } catch (error) {
      console.error('Error updating goal:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const deleteGoal = async (goalId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await ApiService.deleteGoal(goalId);
      
      if (response.success) {
        dispatch({ type: 'DELETE_GOAL', payload: goalId });
      }
    } catch (error) {
      console.error('Error deleting goal:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const addToGoal = async (goalId: string, amount: number) => {
    const goal = state.goals.find(g => g.id === goalId);
    if (goal) {
      await updateGoal(goalId, { currentAmount: goal.currentAmount + amount });
    }
  };

  const updateUserProfile = async (profile: Partial<UserProfile>) => {
    dispatch({ type: 'UPDATE_USER_PROFILE', payload: profile });
  };

  const getTotalSpent = () => {
    return state.transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  };

  const getTotalIncome = () => {
    return state.transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getCategorySpending = (categoryName: string) => {
    return state.transactions
      .filter(t => t.category === categoryName && t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  };

  const contextValue: AppContextType = {
    state,
    addTransaction,
    deleteTransaction,
    updateBudget,
    addBudgetCategory,
    addGoal,
    updateGoal,
    deleteGoal,
    addToGoal,
    updateUserProfile,
    getTotalSpent,
    getTotalIncome,
    getCategorySpending,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};