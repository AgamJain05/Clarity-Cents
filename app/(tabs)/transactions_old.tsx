import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Filter, Plus, Coffee, Car, ShoppingBag, Film, Chrome as Home, Utensils } from 'lucide-react-native';
import { useAppContext } from '@/context/AppContext';
import AddTransactionModal from '@/components/AddTransactionModal';

interface Transaction {
  id: string;
  merchant: string;
  amount: number;
  category: string;
  date: string;
  time: string;
  type: 'expense' | 'income';
}

const transactions: Transaction[] = [
  {
    id: '1',
    merchant: 'Salary Deposit',
    amount: 3500.00,
    category: 'Income',
    date: 'Dec 1, 2024',
    time: '09:00 AM',
    type: 'income',
  },
  {
    id: '2',
    merchant: 'Starbucks Coffee',
    amount: -12.47,
    category: 'Food & Dining',
    date: 'Dec 1, 2024',
    time: '08:30 AM',
    type: 'expense',
  },
  {
    id: '3',
    merchant: 'Shell Gas Station',
    amount: -45.20,
    category: 'Transportation',
    date: 'Nov 30, 2024',
    time: '06:15 PM',
    type: 'expense',
  },
  {
    id: '4',
    merchant: 'Target',
    amount: -67.89,
    category: 'Shopping',
    date: 'Nov 30, 2024',
    time: '02:30 PM',
    type: 'expense',
  },
  {
    id: '5',
    merchant: 'Netflix Subscription',
    amount: -15.99,
    category: 'Entertainment',
    date: 'Nov 30, 2024',
    time: '12:00 PM',
    type: 'expense',
  },
  {
    id: '6',
    merchant: 'Rent Payment',
    amount: -1200.00,
    category: 'Housing',
    date: 'Nov 29, 2024',
    time: '09:00 AM',
    type: 'expense',
  },
  {
    id: '7',
    merchant: 'Whole Foods',
    amount: -84.32,
    category: 'Food & Dining',
    date: 'Nov 29, 2024',
    time: '07:20 PM',
    type: 'expense',
  },
  {
    id: '8',
    merchant: 'Uber Ride',
    amount: -18.75,
    category: 'Transportation',
    date: 'Nov 28, 2024',
    time: '11:45 PM',
    type: 'expense',
  },
];

const categoryIcons: { [key: string]: any } = {
  'Food & Dining': Utensils,
  'Transportation': Car,
  'Shopping': ShoppingBag,
  'Entertainment': Film,
  'Housing': Home,
  'Income': Plus,
};

export default function Transactions() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');

  const filters = ['All', 'Expenses', 'Income', 'This Week', 'This Month'];

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.merchant.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = 
      selectedFilter === 'All' ||
      (selectedFilter === 'Expenses' && transaction.type === 'expense') ||
      (selectedFilter === 'Income' && transaction.type === 'income') ||
      selectedFilter === 'This Week' ||
      selectedFilter === 'This Month';

    return matchesSearch && matchesFilter;
  });

  const getCategoryIcon = (category: string) => {
    const IconComponent = categoryIcons[category] || ShoppingBag;
    return IconComponent;
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Food & Dining': '#FF9500',
      'Transportation': '#007AFF',
      'Shopping': '#FF3B30',
      'Entertainment': '#AF52DE',
      'Housing': '#00C896',
      'Income': '#00C896',
    };
    return colors[category] || '#8E8E93';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transactions</Text>
        <TouchableOpacity style={styles.addButton}>
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#8E8E93" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#8E8E93"
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterTabs}
        contentContainerStyle={styles.filterTabsContainer}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterTab,
              selectedFilter === filter && styles.activeFilterTab,
            ]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text
              style={[
                styles.filterTabText,
                selectedFilter === filter && styles.activeFilterTabText,
              ]}
            >
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Transactions List */}
      <ScrollView style={styles.transactionsList} showsVerticalScrollIndicator={false}>
        {filteredTransactions.map((transaction, index) => {
          const IconComponent = getCategoryIcon(transaction.category);
          const iconColor = getCategoryColor(transaction.category);

          return (
            <TouchableOpacity key={transaction.id} style={styles.transactionItem}>
              <View style={[styles.iconContainer, { backgroundColor: `${iconColor}15` }]}>
                <IconComponent size={20} color={iconColor} />
              </View>
              
              <View style={styles.transactionDetails}>
                <Text style={styles.merchantName}>{transaction.merchant}</Text>
                <Text style={styles.categoryText}>{transaction.category}</Text>
                <Text style={styles.transactionTime}>
                  {transaction.date} • {transaction.time}
                </Text>
              </View>

              <View style={styles.amountContainer}>
                <Text
                  style={[
                    styles.amountText,
                    {
                      color: transaction.type === 'income' ? '#00C896' : '#1C1C1E',
                    },
                  ]}
                >
                  {transaction.type === 'income' ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>This Month</Text>
          <Text style={styles.summaryAmount}>-$1,547.80</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Income</Text>
          <Text style={[styles.summaryAmount, { color: '#00C896' }]}>+$3,500.00</Text>
        </View>
      </View>
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
  headerTitle: {
    fontSize: 28,
    color: '#1C1C1E',
    fontWeight: '700',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#00C896',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00C896',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  filterTabs: {
    marginBottom: 20,
  },
  filterTabsContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  activeFilterTab: {
    backgroundColor: '#00C896',
    borderColor: '#00C896',
  },
  filterTabText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '600',
  },
  activeFilterTabText: {
    color: '#FFFFFF',
  },
  transactionsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  merchantName: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '600',
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
    marginBottom: 2,
  },
  transactionTime: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '400',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 18,
    fontWeight: '700',
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#E5E5EA',
    marginHorizontal: 20,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 20,
    color: '#1C1C1E',
    fontWeight: '700',
  },
});