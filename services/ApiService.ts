import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Different URLs for different platforms in development
const getApiUrl = () => {
  if (!__DEV__) {
    return 'https://your-production-api.com/api';
  }
  
  // Development URLs
  if (Platform.OS === 'android') {
    // For Android emulator, try 10.0.2.2 first, but also provide alternatives
    // 10.0.2.2 - Standard Android emulator localhost mapping
    // You might need to change this to your actual IP address if 10.0.2.2 doesn't work
    const androidUrl = 'http://192.168.29.240:5000/api';
    console.log('🤖 Android detected - using URL:', androidUrl);
    console.log('💡 If connection fails, try changing to your computer\'s IP address');
    return androidUrl;
  } else if (Platform.OS === 'ios') {
    // For iOS simulator, localhost works fine
    return 'http://localhost:5000/api';
  } else {
    // For web, use localhost
    return 'http://localhost:5000/api';
  }
};

const API_BASE_URL = getApiUrl();

// Storage keys
const TOKEN_KEY = 'auth_token';

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
    console.log(`🌐 API Service initialized with URL: ${this.baseURL} (Platform: ${Platform.OS})`);
  }

  // Get auth token from storage
  private async getToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  // Set auth token in storage
  private async setToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } catch (error) {
      console.error('Error setting token:', error);
    }
  }

  // Remove auth token from storage
  private async removeToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
    } catch (error) {
      console.error('Error removing token:', error);
    }
  }  // Generic request method
  private async request<T>(
    endpoint: string,
    options: any = {}
  ): Promise<{ success: boolean; data?: any; message?: string; errors?: any[] }> {
    try {
      const token = await this.getToken();
      const url = `${this.baseURL}${endpoint}`;

      console.log(`🔗 API Request: ${options.method || 'GET'} ${url}`);
      console.log(`📱 Platform: ${Platform.OS}`);

      const config: RequestInit = {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
        method: options.method || 'GET',
      };

      if (options.body) {
        config.body = JSON.stringify(options.body);
        console.log('📤 Request body:', JSON.stringify(options.body, null, 2));
      }

      console.log('⏳ Making request...');
      const response = await fetch(url, config);
      console.log(`✅ Response status: ${response.status} ${response.statusText}`);
      
      const data = await response.json();
      console.log('📥 Response data:', JSON.stringify(data, null, 2));

      if (!response.ok) {
        console.error(`❌ Request failed: ${response.status} - ${data.message || 'Unknown error'}`);
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error: any) {
      console.error('💥 API Request Error:', error);
      console.error('🔍 Error details:', {
        message: error?.message || 'Unknown error',
        name: error?.name || 'Unknown',
        stack: error?.stack || 'No stack trace',
        url: `${this.baseURL}${endpoint}`,
        platform: Platform.OS
      });
      throw error;
    }
  }

  // Authentication methods
  async login(email: string, password: string) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: { email, password },
    });

    if (response.success && response.data?.token) {
      await this.setToken(response.data.token);
    }

    return response;
  }

  async register(name: string, email: string, password: string) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: { name, email, password },
    });

    if (response.success && response.data?.token) {
      await this.setToken(response.data.token);
    }

    return response;
  }

  async logout() {
    console.log('🟢 API SERVICE STEP 1: logout method called');
    
    try {
      console.log('🟢 API SERVICE STEP 2: Attempting to call backend logout endpoint...');
      // Call the backend logout endpoint
      const response = await this.request('/auth/logout', {
        method: 'POST',
      });
      console.log('🟢 API SERVICE STEP 3: Backend logout endpoint response:', response);
    } catch (error) {
      // Even if the API call fails, we should still remove the token locally
      console.warn('🟢 API SERVICE STEP 3: Logout API call failed, but continuing with local logout:', error);
    } finally {
      console.log('🟢 API SERVICE STEP 4: Removing token from local storage...');
      // Always remove the token from local storage
      await this.removeToken();
      console.log('🟢 API SERVICE STEP 5: Token removed from local storage successfully');
    }
    
    console.log('🟢 API SERVICE STEP 6: Logout method completed');
    return { success: true };
  }

  async verifyToken() {
    return await this.request('/auth/verify');
  }

  async forgotPassword(email: string) {
    return await this.request('/auth/forgot-password', {
      method: 'POST',
      body: { email },
    });
  }

  // Email verification methods
  async verifyEmail(token: string) {
    const response = await this.request('/auth/verify-email', {
      method: 'POST',
      body: { token },
    });

    // If verification includes a login token, save it
    if (response.success && response.data?.token) {
      await this.setToken(response.data.token);
    }

    return response;
  }

  async resendVerification(email: string) {
    return await this.request('/auth/resend-verification', {
      method: 'POST',
      body: { email },
    });
  }

  async resetPassword(token: string, password: string) {
    return await this.request('/auth/reset-password', {
      method: 'POST',
      body: { token, password },
    });
  }

  // User methods
  async getUserProfile() {
    return await this.request('/users/profile');
  }

  async updateUserProfile(data: any) {
    return await this.request('/users/profile', {
      method: 'PUT',
      body: data,
    });
  }

  async updateUserPreferences(preferences: any) {
    return await this.request('/users/preferences', {
      method: 'PUT',
      body: preferences,
    });
  }

  // Transaction methods
  async getTransactions(params?: {
    page?: number;
    limit?: number;
    category?: string;
    type?: 'income' | 'expense';
    startDate?: string;
    endDate?: string;
  }) {
    const queryString = params ? new URLSearchParams(params as any).toString() : '';
    return await this.request(`/transactions${queryString ? `?${queryString}` : ''}`);
  }

  async getTransaction(id: string) {
    return await this.request(`/transactions/${id}`);
  }

  async createTransaction(transaction: {
    merchant: string;
    amount: number;
    category: string;
    date: string;
    type: 'income' | 'expense';
    description?: string;
  }) {
    return await this.request('/transactions', {
      method: 'POST',
      body: transaction,
    });
  }

  async updateTransaction(id: string, updates: any) {
    return await this.request(`/transactions/${id}`, {
      method: 'PUT',
      body: updates,
    });
  }

  async deleteTransaction(id: string) {
    return await this.request(`/transactions/${id}`, {
      method: 'DELETE',
    });
  }

  async getTransactionStats(params?: { startDate?: string; endDate?: string }) {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    return await this.request(`/transactions/stats/summary${queryString ? `?${queryString}` : ''}`);
  }

  // Budget methods
  async getBudgets() {
    return await this.request('/budgets');
  }

  async createBudget(budget: any) {
    return await this.request('/budgets', {
      method: 'POST',
      body: budget,
    });
  }

  async updateBudget(id: string, updates: any) {
    return await this.request(`/budgets/${id}`, {
      method: 'PUT',
      body: updates,
    });
  }

  async deleteBudget(id: string) {
    return await this.request(`/budgets/${id}`, {
      method: 'DELETE',
    });
  }

  // Goal methods
  async getGoals() {
    return await this.request('/goals');
  }

  async createGoal(goal: any) {
    return await this.request('/goals', {
      method: 'POST',
      body: goal,
    });
  }

  async updateGoal(id: string, updates: any) {
    return await this.request(`/goals/${id}`, {
      method: 'PUT',
      body: updates,
    });
  }

  async deleteGoal(id: string) {
    return await this.request(`/goals/${id}`, {
      method: 'DELETE',
    });
  }

  // Health check
  async healthCheck() {
    return await fetch(`${this.baseURL.replace('/api', '')}/health`).then(res => res.json());
  }
}

export default new ApiService();
