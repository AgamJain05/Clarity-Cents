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
import { Search, Filter, Plus, Coffee, Car, ShoppingBag, Film, Chrome as Home, Utensils, Trash2 } from 'lucide-react-native';
import { useAppContext } from '@/context/AppContext';
import AddTransactionModal from '@/components/AddTransactionModal';

const categoryIcons: { [key: string]: any } = {
  'Food & Dining': Utensils,
  'Transportation': Car,
  'Shopping': ShoppingBag,
  'Entertainment': Film,
  'Housing': Home,
  'Income': Coffee,
  'Utilities': Coffee,
  'Healthcare': Coffee,
  'Education': Coffee,
  'Other': Coffee,
};

export default function Transactions() {
  const { state, deleteTransaction } = useAppContext();
  const [searchText, setSearchText] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [addTransactionModalVisible, setAddTransactionModalVisible] = useState(false);
  
  const filterOptions = ['All', 'Income', 'Expenses'];
  
  // Filter transactions based on search and filter
  const filteredTransactions = state.transactions.filter(transaction => {
    const matchesSearch = transaction.merchant.toLowerCase().includes(searchText.toLowerCase()) ||
                         transaction.category.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesFilter = selectedFilter === 'All' || 
                         (selectedFilter === 'Income' && transaction.type === 'income') ||
                         (selectedFilter === 'Expenses' && transaction.type === 'expense');
    
    return matchesSearch && matchesFilter;
  });

  const handleDeleteTransaction = (transactionId: string) => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteTransaction(transactionId)
        }
      ]
    );
  };

  const getCategoryIcon = (category: string) => {
    return categoryIcons[category] || ShoppingBag;
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Food & Dining': '#FF9500',
      'Transportation': '#007AFF',
      'Shopping': '#FF3B30',
      'Entertainment': '#AF52DE',
      'Housing': '#00C896',
      'Income': '#00C896',
      'Utilities': '#FF9500',
      'Healthcare': '#34C759',
      'Education': '#5856D6',
      'Other': '#8E8E93',
    };
    return colors[category] || '#8E8E93';
  };

  // Calculate summary data
  const thisMonthExpenses = state.transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
  const thisMonthIncome = state.transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transactions</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setAddTransactionModalVisible(true)}
        >
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
            value={searchText}
            onChangeText={setSearchText}
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
        {filterOptions.map((filter) => (
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
        {filteredTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No transactions found</Text>
            <Text style={styles.emptyStateSubtext}>
              {searchText ? 'Try adjusting your search' : 'Start by adding your first transaction'}
            </Text>
          </View>
        ) : (
          filteredTransactions.map((transaction) => {
            const IconComponent = getCategoryIcon(transaction.category);
            const iconColor = getCategoryColor(transaction.category);

            return (
              <View key={transaction.id} style={styles.transactionItem}>
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

                <View style={styles.transactionRight}>
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
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteTransaction(transaction.id)}
                  >
                    <Trash2 size={16} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Expenses</Text>
          <Text style={styles.summaryAmount}>-${thisMonthExpenses.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Income</Text>
          <Text style={[styles.summaryAmount, { color: '#00C896' }]}>+${thisMonthIncome.toFixed(2)}</Text>
        </View>
      </View>

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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
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
  transactionRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  amountText: {
    fontSize: 18,
    fontWeight: '700',
  },
  deleteButton: {
    padding: 4,
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
