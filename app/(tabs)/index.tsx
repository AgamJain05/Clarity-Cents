import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DollarSign, TrendingUp, TrendingDown, TriangleAlert as AlertTriangle, Plus, ArrowRight } from 'lucide-react-native';
import { useAppContext } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import AddTransactionModal from '@/components/AddTransactionModal';
import { router } from 'expo-router';
import { formatCurrencySimple } from '@/utils/currencyFormatter';

const { width } = Dimensions.get('window');

export default function Dashboard() {
  const { state, getTotalSpent, getTotalIncome, getCategorySpending } = useAppContext();
  const { state: authState } = useAuth();
  const [addTransactionModalVisible, setAddTransactionModalVisible] = useState(false);
  
  // Get user's currency preference
  const userCurrency = authState.user?.preferences?.currency || 'USD';
  
  // Calculate actual budget usage from database data
  const totalBudgetAllocated = state.budgetCategories.reduce((sum, budget) => sum + budget.allocated, 0);
  const totalBudgetSpent = state.budgetCategories.reduce((sum, budget) => sum + getCategorySpending(budget.name), 0);
  const budgetUsed = totalBudgetAllocated > 0 ? totalBudgetSpent / totalBudgetAllocated : 0;
  
  const totalSpent = getTotalSpent();
  const totalIncome = getTotalIncome();
  const monthlyChange = totalIncome > 0 ? ((state.totalBalance / totalIncome) * 100 - 100) : 0;
  
  // Get recent transactions (last 4)
  const recentTransactions = state.transactions.slice(-4).reverse();
  
  // Calculate quick stats dynamically
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  const thisMonthTransactions = state.transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear;
  });
  
  const thisMonthSpent = thisMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
  const thisMonthIncome = thisMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const savedAmount = thisMonthIncome - thisMonthSpent;

  const quickStats = [
    { 
      title: 'Total Balance', 
      value: formatCurrencySimple(state.totalBalance, userCurrency), 
      change: `${monthlyChange >= 0 ? '+' : ''}${monthlyChange.toFixed(1)}%`, 
      isPositive: monthlyChange >= 0 
    },
    { 
      title: 'This Month', 
      value: formatCurrencySimple(thisMonthSpent, userCurrency), 
      change: (() => {
        // Calculate change compared to average monthly spending
        const averageMonthlySpent = totalSpent / 12; // Rough estimate
        const changePercent = averageMonthlySpent > 0 
          ? ((thisMonthSpent - averageMonthlySpent) / averageMonthlySpent) * 100 
          : 0;
        return `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(1)}%`;
      })(), 
      isPositive: (() => {
        const averageMonthlySpent = totalSpent / 12;
        return thisMonthSpent <= averageMonthlySpent;
      })()
    },
    { 
      title: 'Saved', 
      value: formatCurrencySimple(savedAmount, userCurrency), 
      change: (() => {
        // Calculate savings rate as percentage of income
        const savingsRate = thisMonthIncome > 0 ? (savedAmount / thisMonthIncome) * 100 : 0;
        return `${savingsRate.toFixed(1)}%`;
      })(), 
      isPositive: savedAmount >= 0 
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good Morning</Text>
            <Text style={styles.userName}>{state.userProfile.name}</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <AlertTriangle size={24} color="#FF9500" />
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
                      <Text style={styles.balanceAmount}>{formatCurrencySimple(state.totalBalance, userCurrency)}</Text>
          <View style={styles.budgetProgress}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${budgetUsed * 100}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {Math.round(budgetUsed * 100)}% of monthly budget used
            </Text>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStatsContainer}>
          {quickStats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <Text style={styles.statTitle}>{stat.title}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
              <View style={styles.statChange}>
                {stat.isPositive ? (
                  <TrendingUp size={14} color="#00C896" />
                ) : (
                  <TrendingDown size={14} color="#FF3B30" />
                )}
                <Text style={[
                  styles.changeText,
                  { color: stat.isPositive ? '#00C896' : '#FF3B30' }
                ]}>
                  {stat.change}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => setAddTransactionModalVisible(true)}
            >
              <Plus size={24} color="#007AFF" />
              <Text style={styles.actionText}>Add Transaction</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/budget')}
            >
              <DollarSign size={24} color="#007AFF" />
              <Text style={styles.actionText}>Set Budget</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
              <ArrowRight size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.transactionsList}>
            {recentTransactions.map((transaction) => (
              <View key={transaction.id} style={styles.transactionItem}>
                <View style={styles.transactionInfo}>
                  <Text style={styles.merchantName}>{transaction.merchant}</Text>
                  <Text style={styles.transactionCategory}>{transaction.category}</Text>
                </View>
                <View style={styles.transactionAmount}>
                  <Text style={[
                    styles.amountText,
                    { color: transaction.type === 'income' ? '#00C896' : '#1C1C1E' }
                  ]}>
                    {transaction.type === 'income' ? '+' : ''}{formatCurrencySimple(Math.abs(transaction.amount), userCurrency)}
                  </Text>
                  <Text style={styles.transactionDate}>{transaction.date}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Spending Alert */}
        {(() => {
          // Find budget categories that are over 90% spent or completely spent
          const alertBudgets = state.budgetCategories.filter(budget => {
            const actualSpent = getCategorySpending(budget.name);
            const percentageUsed = budget.allocated > 0 ? (actualSpent / budget.allocated) * 100 : 0;
            return percentageUsed >= 90;
          });

          if (alertBudgets.length === 0) return null;

          const mostOverspentBudget = alertBudgets.reduce((max, budget) => {
            const maxSpent = getCategorySpending(max.name);
            const currentSpent = getCategorySpending(budget.name);
            const maxPercentage = max.allocated > 0 ? (maxSpent / max.allocated) * 100 : 0;
            const currentPercentage = budget.allocated > 0 ? (currentSpent / budget.allocated) * 100 : 0;
            return currentPercentage > maxPercentage ? budget : max;
          });

          const actualSpent = getCategorySpending(mostOverspentBudget.name);
          const percentageUsed = mostOverspentBudget.allocated > 0 
            ? (actualSpent / mostOverspentBudget.allocated) * 100 
            : 0;

          return (
            <View style={styles.alertCard}>
              <View style={styles.alertIcon}>
                <AlertTriangle size={20} color="#FF9500" />
              </View>
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>{mostOverspentBudget.name} Budget Alert</Text>
                <Text style={styles.alertMessage}>
                  You've spent {formatCurrencySimple(actualSpent, userCurrency)} of your {formatCurrencySimple(mostOverspentBudget.allocated, userCurrency)} {mostOverspentBudget.name.toLowerCase()} budget this month ({percentageUsed.toFixed(0)}%)
                </Text>
              </View>
            </View>
          );
        })()}
      </ScrollView>
      
      <AddTransactionModal 
        visible={addTransactionModalVisible}
        onClose={() => setAddTransactionModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  greeting: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
  userName: {
    fontSize: 24,
    color: '#1C1C1E',
    fontWeight: '700',
    marginTop: 4,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  balanceCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
  },
  balanceAmount: {
    fontSize: 32,
    color: '#1C1C1E',
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 20,
  },
  budgetProgress: {
    gap: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00C896',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  quickStatsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  statTitle: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    color: '#1C1C1E',
    fontWeight: '700',
    marginBottom: 4,
  },
  statChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#1C1C1E',
    fontWeight: '700',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  actionText: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '600',
    marginTop: 8,
  },
  transactionsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  transactionInfo: {
    flex: 1,
  },
  merchantName: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '600',
    marginBottom: 4,
  },
  transactionCategory: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '700',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  alertCard: {
    backgroundColor: '#FFF9E6',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
    marginBottom: 20,
  },
  alertIcon: {
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '700',
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
});