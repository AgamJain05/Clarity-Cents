import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  TextInput,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Settings, TrendingUp, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Utensils, Car, ShoppingBag, Film, Chrome as Home, Zap, X, Palette, DollarSign, Calculator } from 'lucide-react-native';
import { useAppContext } from '@/context/AppContext';

const { width } = Dimensions.get('window');

const iconMap = {
  'Food & Dining': Utensils,
  'Transportation': Car,
  'Shopping': ShoppingBag,
  'Entertainment': Film,
  'Housing': Home,
  'Utilities': Zap,
  'Healthcare': Plus,
  'Education': Plus,
  'Travel': Car,
  'Personal Care': Plus,
  'Gifts': Plus,
  'Other': Plus,
};

const colorOptions = [
  '#FF9500', '#007AFF', '#FF3B30', '#AF52DE', 
  '#00C896', '#FFD60A', '#FF6B35', '#32D74B',
  '#BF5AF2', '#FF2D92', '#5AC8FA', '#FFCC02'
];

export default function Budget() {
  const { state, updateBudget, getCategorySpending, addBudgetCategory } = useAppContext();
  const [selectedPeriod, setSelectedPeriod] = useState('Monthly');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [addCategoryModalVisible, setAddCategoryModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [rebalanceModalVisible, setRebalanceModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [budgetAmount, setBudgetAmount] = useState('');
  
  // New category form state
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryAmount, setNewCategoryAmount] = useState('');
  const [selectedColor, setSelectedColor] = useState(colorOptions[0]);
  
  const periods = ['Weekly', 'Monthly', 'Yearly'];
  
  // Use data from context and recalculate spending
  const getPeriodMultiplier = () => {
    switch (selectedPeriod) {
      case 'Weekly': return 0.25;
      case 'Yearly': return 12;
      default: return 1; // Monthly
    }
  };

  const budgetCategories = state.budgetCategories.map(category => {
    const multiplier = getPeriodMultiplier();
    return {
      ...category,
      allocated: category.allocated * multiplier,
      spent: getCategorySpending(category.name),
      icon: iconMap[category.name as keyof typeof iconMap] || Home,
    };
  });
  
  const totalAllocated = budgetCategories.reduce((sum, cat) => sum + cat.allocated, 0);
  const totalSpent = budgetCategories.reduce((sum, cat) => sum + cat.spent, 0);
  const remainingBudget = totalAllocated - totalSpent;

  const handleEditBudget = (category: any) => {
    setSelectedCategory(category);
    // Show period-adjusted amount in the input
    const displayAmount = selectedPeriod === 'Weekly' ? category.allocated / 4 : 
                         selectedPeriod === 'Yearly' ? category.allocated * 12 : category.allocated;
    setBudgetAmount(displayAmount.toString());
    setEditModalVisible(true);
  };

  const handleSaveBudget = () => {
    if (!selectedCategory) return;
    
    const amount = parseFloat(budgetAmount);
    if (isNaN(amount) || amount < 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    // Convert back to monthly amount for storage
    const monthlyAmount = selectedPeriod === 'Weekly' ? amount * 4 : 
                         selectedPeriod === 'Yearly' ? amount / 12 : amount;

    updateBudget(selectedCategory.id, monthlyAmount);
    setEditModalVisible(false);
    setSelectedCategory(null);
    setBudgetAmount('');
    Alert.alert('Success', 'Budget updated successfully!');
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }
    
    const amount = parseFloat(newCategoryAmount);
    if (isNaN(amount) || amount < 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    // Convert to monthly amount for storage
    const monthlyAmount = selectedPeriod === 'Weekly' ? amount * 4 : 
                         selectedPeriod === 'Yearly' ? amount / 12 : amount;

    addBudgetCategory({
      name: newCategoryName.trim(),
      allocated: monthlyAmount,
      color: selectedColor,
    });

    // Reset form
    setNewCategoryName('');
    setNewCategoryAmount('');
    setSelectedColor(colorOptions[0]);
    setAddCategoryModalVisible(false);
    Alert.alert('Success', 'Budget category added successfully!');
  };

  const handleRebalance = () => {
    // Simple rebalancing: distribute remaining income evenly among categories
    const monthlyIncome = state.userProfile.monthlyIncome;
    const essentialCategories = ['Housing', 'Utilities', 'Food & Dining'];
    const nonEssentialCategories = budgetCategories.filter(cat => 
      !essentialCategories.includes(cat.name)
    );

    Alert.alert(
      'Rebalance Budget',
      'This will redistribute your budget based on recommended percentages. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Continue', 
          onPress: () => {
            // Apply 50/30/20 rule adjustments
            budgetCategories.forEach(category => {
              let recommendedPercentage = 0;
              switch (category.name) {
                case 'Housing': recommendedPercentage = 0.3; break;
                case 'Food & Dining': recommendedPercentage = 0.12; break;
                case 'Transportation': recommendedPercentage = 0.15; break;
                case 'Utilities': recommendedPercentage = 0.08; break;
                case 'Entertainment': recommendedPercentage = 0.05; break;
                case 'Shopping': recommendedPercentage = 0.05; break;
                default: recommendedPercentage = 0.025; break;
              }
              const newAmount = monthlyIncome * recommendedPercentage;
              updateBudget(category.id, newAmount);
            });
            setRebalanceModalVisible(false);
            Alert.alert('Success', 'Budget rebalanced successfully!');
          }
        }
      ]
    );
  };

  const generateInsights = () => {
    const insights = [];
    
    // Check for overspending
    const overspentCategories = budgetCategories.filter(cat => cat.spent > cat.allocated);
    if (overspentCategories.length > 0) {
      insights.push(`• You're overspending in ${overspentCategories.length} categories`);
    }

    // Check for high spending categories
    const sortedBySpending = [...budgetCategories].sort((a, b) => b.spent - a.spent);
    if (sortedBySpending.length > 0) {
      insights.push(`• Highest spending: ${sortedBySpending[0].name} ($${sortedBySpending[0].spent.toFixed(2)})`);
    }

    // Check for unused budget
    const underSpentCategories = budgetCategories.filter(cat => 
      cat.spent < cat.allocated * 0.5 && cat.allocated > 0
    );
    if (underSpentCategories.length > 0) {
      insights.push(`• Consider reallocating from ${underSpentCategories[0].name}`);
    }

    // Budget efficiency
    const efficiency = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;
    if (efficiency < 70) {
      insights.push(`• Budget utilization is ${efficiency.toFixed(0)}% - consider optimizing`);
    }

    return insights.length > 0 ? insights : ['• Your budget is well balanced!'];
  };

  const getBudgetStatus = (spent: number, allocated: number) => {
    const percentage = (spent / allocated) * 100;
    if (percentage >= 100) return 'over';
    if (percentage >= 80) return 'warning';
    return 'good';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'over': return '#FF3B30';
      case 'warning': return '#FF9500';
      default: return '#00C896';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'over': return AlertTriangle;
      case 'warning': return AlertTriangle;
      default: return CheckCircle;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Budget</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setSettingsModalVisible(true)}
          >
            <Settings size={24} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setAddCategoryModalVisible(true)}
          >
            <Plus size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {periods.map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.periodTab,
                selectedPeriod === period && styles.activePeriodTab,
              ]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text
                style={[
                  styles.periodTabText,
                  selectedPeriod === period && styles.activePeriodTabText,
                ]}
              >
                {period}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Budget Overview */}
        <View style={styles.overviewCard}>
          <Text style={styles.overviewTitle}>Budget Overview</Text>
          <View style={styles.overviewStats}>
            <View style={styles.overviewStat}>
              <Text style={styles.overviewAmount}>${totalAllocated.toLocaleString()}</Text>
              <Text style={styles.overviewLabel}>Total Budget</Text>
            </View>
            <View style={styles.overviewStat}>
              <Text style={styles.overviewAmount}>${totalSpent.toLocaleString()}</Text>
              <Text style={styles.overviewLabel}>Total Spent</Text>
            </View>
            <View style={styles.overviewStat}>
              <Text style={[
                styles.overviewAmount,
                { color: remainingBudget < 0 ? '#FF3B30' : '#00C896' }
              ]}>
                ${Math.abs(remainingBudget).toLocaleString()}
              </Text>
              <Text style={styles.overviewLabel}>
                {remainingBudget < 0 ? 'Over Budget' : 'Remaining'}
              </Text>
            </View>
          </View>
          
          {/* Overall Progress */}
          <View style={styles.overallProgress}>
            <View style={styles.progressInfo}>
              <Text style={styles.progressLabel}>Overall Progress</Text>
              <Text style={styles.progressPercentage}>
                {Math.round((totalSpent / totalAllocated) * 100)}%
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${Math.min((totalSpent / totalAllocated) * 100, 100)}%`,
                    backgroundColor: totalSpent > totalAllocated ? '#FF3B30' : '#00C896'
                  }
                ]} 
              />
            </View>
          </View>
        </View>

        {/* Budget Categories */}
        <View style={styles.categoriesContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Budget Categories</Text>
            <TouchableOpacity onPress={() => setRebalanceModalVisible(true)}>
              <Text style={styles.rebalanceButton}>Rebalance</Text>
            </TouchableOpacity>
          </View>

          {budgetCategories.map((category) => {
            const percentage = (category.spent / category.allocated) * 100;
            const status = getBudgetStatus(category.spent, category.allocated);
            const StatusIcon = getStatusIcon(status);
            const statusColor = getStatusColor(status);

            return (
              <TouchableOpacity 
                key={category.id} 
                style={styles.categoryCard}
                onPress={() => handleEditBudget(category)}
              >
                <View style={styles.categoryHeader}>
                  <View style={styles.categoryInfo}>
                    <View style={[
                      styles.categoryIcon,
                      { backgroundColor: `${category.color}15` }
                    ]}>
                      <category.icon size={20} color={category.color} />
                    </View>
                    <View style={styles.categoryDetails}>
                      <Text style={styles.categoryName}>{category.name}</Text>
                      <Text style={styles.categoryAmount}>
                        ${category.spent} of ${category.allocated}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.categoryStatus}>
                    <StatusIcon size={16} color={statusColor} />
                    <Text style={[styles.percentageText, { color: statusColor }]}>
                      {Math.round(percentage)}%
                    </Text>
                  </View>
                </View>

                <View style={styles.categoryProgress}>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { 
                          width: `${Math.min(percentage, 100)}%`,
                          backgroundColor: category.color
                        }
                      ]} 
                    />
                  </View>
                </View>

                {status === 'over' && (
                  <View style={styles.overBudgetAlert}>
                    <AlertTriangle size={14} color="#FF3B30" />
                    <Text style={styles.alertText}>
                      Over budget by ${category.spent - category.allocated}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Insights Card */}
        <View style={styles.insightsCard}>
          <View style={styles.insightsHeader}>
            <TrendingUp size={20} color="#007AFF" />
            <Text style={styles.insightsTitle}>Budget Insights</Text>
          </View>
          <View style={styles.insightsList}>
            {generateInsights().map((insight, index) => (
              <Text key={index} style={styles.insightItem}>
                {insight}
              </Text>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Edit Budget Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
              <X size={24} color="#1C1C1E" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Budget</Text>
            <TouchableOpacity onPress={handleSaveBudget}>
              <Text style={styles.saveButton}>Save</Text>
            </TouchableOpacity>
          </View>
          
          {selectedCategory && (
            <View style={styles.modalContent}>
              <Text style={styles.modalCategoryName}>{selectedCategory.name}</Text>
              <Text style={styles.modalLabel}>{selectedPeriod} Budget</Text>
              <TextInput
                style={styles.modalInput}
                value={budgetAmount}
                onChangeText={setBudgetAmount}
                placeholder="Enter amount"
                keyboardType="numeric"
              />
              <Text style={styles.modalNote}>
                Current spending: ${getCategorySpending(selectedCategory.name).toFixed(2)} (monthly)
              </Text>
            </View>
          )}
        </View>
      </Modal>

      {/* Add Category Modal */}
      <Modal
        visible={addCategoryModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setAddCategoryModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setAddCategoryModalVisible(false)}>
              <X size={24} color="#1C1C1E" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Category</Text>
            <TouchableOpacity onPress={handleAddCategory}>
              <Text style={styles.saveButton}>Add</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalLabel}>Category Name</Text>
            <TextInput
              style={styles.modalInput}
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              placeholder="e.g., Healthcare, Travel"
            />
            
            <Text style={styles.modalLabel}>{selectedPeriod} Budget</Text>
            <TextInput
              style={styles.modalInput}
              value={newCategoryAmount}
              onChangeText={setNewCategoryAmount}
              placeholder="Enter amount"
              keyboardType="numeric"
            />
            
            <Text style={styles.modalLabel}>Color</Text>
            <View style={styles.colorGrid}>
              {colorOptions.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && styles.selectedColor
                  ]}
                  onPress={() => setSelectedColor(color)}
                />
              ))}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Settings Modal */}
      <Modal
        visible={settingsModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSettingsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSettingsModalVisible(false)}>
              <X size={24} color="#1C1C1E" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Budget Settings</Text>
            <View style={{ width: 24 }} />
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.settingItem}>
              <Palette size={20} color="#007AFF" />
              <Text style={styles.settingLabel}>Default Period</Text>
              <Text style={styles.settingValue}>{selectedPeriod}</Text>
            </View>
            
            <View style={styles.settingItem}>
              <DollarSign size={20} color="#007AFF" />
              <Text style={styles.settingLabel}>Monthly Income</Text>
              <Text style={styles.settingValue}>${state.userProfile.monthlyIncome}</Text>
            </View>
            
            <View style={styles.settingItem}>
              <Calculator size={20} color="#007AFF" />
              <Text style={styles.settingLabel}>Auto-rebalance</Text>
              <Text style={styles.settingValue}>Off</Text>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Rebalance Modal */}
      <Modal
        visible={rebalanceModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setRebalanceModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setRebalanceModalVisible(false)}>
              <X size={24} color="#1C1C1E" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Rebalance Budget</Text>
            <TouchableOpacity onPress={handleRebalance}>
              <Text style={styles.saveButton}>Apply</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Text style={styles.rebalanceDescription}>
              This will redistribute your budget using the 50/30/20 rule and recommended spending percentages:
            </Text>
            
            <View style={styles.rebalanceItem}>
              <Text style={styles.rebalanceCategory}>Housing</Text>
              <Text style={styles.rebalancePercentage}>30%</Text>
              <Text style={styles.rebalanceAmount}>${(state.userProfile.monthlyIncome * 0.3).toFixed(0)}</Text>
            </View>
            
            <View style={styles.rebalanceItem}>
              <Text style={styles.rebalanceCategory}>Transportation</Text>
              <Text style={styles.rebalancePercentage}>15%</Text>
              <Text style={styles.rebalanceAmount}>${(state.userProfile.monthlyIncome * 0.15).toFixed(0)}</Text>
            </View>
            
            <View style={styles.rebalanceItem}>
              <Text style={styles.rebalanceCategory}>Food & Dining</Text>
              <Text style={styles.rebalancePercentage}>12%</Text>
              <Text style={styles.rebalanceAmount}>${(state.userProfile.monthlyIncome * 0.12).toFixed(0)}</Text>
            </View>
            
            <View style={styles.rebalanceItem}>
              <Text style={styles.rebalanceCategory}>Utilities</Text>
              <Text style={styles.rebalancePercentage}>8%</Text>
              <Text style={styles.rebalanceAmount}>${(state.userProfile.monthlyIncome * 0.08).toFixed(0)}</Text>
            </View>
            
            <Text style={styles.rebalanceNote}>
              Other categories will be allocated 2.5% each. You can adjust individual budgets after rebalancing.
            </Text>
          </ScrollView>
        </View>
      </Modal>
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
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
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
  periodSelector: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  activePeriodTab: {
    backgroundColor: '#00C896',
  },
  periodTabText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '600',
  },
  activePeriodTabText: {
    color: '#FFFFFF',
  },
  overviewCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  overviewTitle: {
    fontSize: 18,
    color: '#1C1C1E',
    fontWeight: '700',
    marginBottom: 16,
  },
  overviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  overviewStat: {
    alignItems: 'center',
  },
  overviewAmount: {
    fontSize: 20,
    color: '#1C1C1E',
    fontWeight: '700',
    marginBottom: 4,
  },
  overviewLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  overallProgress: {
    gap: 8,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  progressPercentage: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '700',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
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
  },
  rebalanceButton: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryDetails: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '600',
    marginBottom: 2,
  },
  categoryAmount: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  categoryStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '700',
  },
  categoryProgress: {
    marginBottom: 8,
  },
  overBudgetAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF2F2',
    padding: 8,
    borderRadius: 8,
    gap: 6,
  },
  alertText: {
    fontSize: 12,
    color: '#FF3B30',
    fontWeight: '500',
  },
  insightsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  insightsTitle: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '700',
  },
  insightsList: {
    gap: 8,
  },
  insightItem: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  saveButton: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    padding: 20,
  },
  modalCategoryName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1C1C1E',
    marginBottom: 12,
  },
  modalNote: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: '#007AFF',
    borderWidth: 3,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  settingLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  settingValue: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  rebalanceDescription: {
    fontSize: 16,
    color: '#1C1C1E',
    lineHeight: 24,
    marginBottom: 24,
  },
  rebalanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 8,
  },
  rebalanceCategory: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  rebalancePercentage: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
    marginRight: 16,
  },
  rebalanceAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#007AFF',
  },
  rebalanceNote: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
    lineHeight: 20,
    marginTop: 16,
    fontStyle: 'italic',
  },
});