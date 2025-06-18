import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Target, Calendar, DollarSign, Zap, Chrome as Home, Plane, GraduationCap, Car, Trophy, X, Edit3, Trash2, TrendingUp, Clock, AlertCircle, CheckCircle2, Copy } from 'lucide-react-native';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Goal } from '../../types';
import { formatCurrencySimple } from '../../utils/currencyFormatter';

const goalIcons = {
  'Savings': Zap,
  'Travel': Plane,
  'Purchase': Car,
  'Education': GraduationCap,
  'Home': Home,
  'Investment': Trophy,
};

const goalColors = [
  '#00C896', '#007AFF', '#AF52DE', '#FF9500', '#FF3B30', '#34C759', '#5856D6', '#FF2D92'
];

const categoryOptions = [
  'Savings', 'Travel', 'Purchase', 'Education', 'Home', 'Investment', 'Other'
];

const goalTemplates = [
  { title: 'Emergency Fund', amount: 10000, category: 'Savings', months: 12 },
  { title: 'Down Payment', amount: 50000, category: 'Home', months: 36 },
  { title: 'Dream Vacation', amount: 5000, category: 'Travel', months: 18 },
  { title: 'New Car', amount: 25000, category: 'Purchase', months: 24 },
  { title: 'Education Fund', amount: 15000, category: 'Education', months: 30 },
  { title: 'Investment Portfolio', amount: 100000, category: 'Investment', months: 60 },
];

export default function Goals() {
  const { state, addGoal, updateGoal, deleteGoal, addToGoal } = useAppContext();
  const { state: authState } = useAuth();
  
  // Get user's currency preference
  const userCurrency = authState.user?.preferences?.currency || 'USD';
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  
  // Form states
  const [newGoal, setNewGoal] = useState({
    title: '',
    targetAmount: '',
    targetDate: '',
    category: 'Savings',
  });
  const [contributeAmount, setContributeAmount] = useState('');
  
  const categories = [
    { key: 'all', label: 'All Goals' },
    { key: 'Savings', label: 'Savings' },
    { key: 'Travel', label: 'Travel' },
    { key: 'Purchase', label: 'Purchase' },
    { key: 'Education', label: 'Education' },
    { key: 'Home', label: 'Home' },
    { key: 'Investment', label: 'Investment' },
  ];

  const filteredGoals = selectedCategory === 'all' 
    ? state.goals 
    : state.goals.filter(goal => goal.category === selectedCategory);

  const totalTargetAmount = state.goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const totalCurrentAmount = state.goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const overallProgress = totalTargetAmount > 0 ? (totalCurrentAmount / totalTargetAmount) * 100 : 0;

  const getTimeRemaining = (targetDate: string) => {
    const target = new Date(targetDate);
    const now = new Date();
    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day';
    if (diffDays < 30) return `${diffDays} days`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`;
    return `${Math.floor(diffDays / 365)} years`;
  };

  const getGoalIcon = (category: string) => {
    return goalIcons[category as keyof typeof goalIcons] || Target;
  };

  const getGoalColor = (index: number) => {
    return goalColors[index % goalColors.length];
  };

  const handleAddGoal = () => {
    if (!newGoal.title || !newGoal.targetAmount || !newGoal.targetDate) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const targetAmount = parseFloat(newGoal.targetAmount);
    if (isNaN(targetAmount) || targetAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid target amount');
      return;
    }

    addGoal({
      title: newGoal.title,
      targetAmount,
      currentAmount: 0,
      targetDate: newGoal.targetDate,
      category: newGoal.category,
    });

    setNewGoal({
      title: '',
      targetAmount: '',
      targetDate: '',
      category: 'Savings',
    });
    setShowAddModal(false);
  };

  const handleEditGoal = () => {
    if (!selectedGoal || !newGoal.title || !newGoal.targetAmount || !newGoal.targetDate) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const targetAmount = parseFloat(newGoal.targetAmount);
    if (isNaN(targetAmount) || targetAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid target amount');
      return;
    }

    updateGoal(selectedGoal.id, {
      title: newGoal.title,
      targetAmount,
      targetDate: newGoal.targetDate,
      category: newGoal.category,
    });

    setShowEditModal(false);
    setSelectedGoal(null);
  };

  const handleContributeToGoal = () => {
    if (!selectedGoal || !contributeAmount) {
      Alert.alert('Error', 'Please enter a contribution amount');
      return;
    }

    const amount = parseFloat(contributeAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    addToGoal(selectedGoal.id, amount);
    setContributeAmount('');
    setShowContributeModal(false);
    setSelectedGoal(null);
  };

  const handleDeleteGoal = (goal: Goal) => {
    Alert.alert(
      'Delete Goal',
      `Are you sure you want to delete "${goal.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteGoal(goal.id)
        },
      ]
    );
  };

  const openEditModal = (goal: Goal) => {
    setSelectedGoal(goal);
    setNewGoal({
      title: goal.title,
      targetAmount: goal.targetAmount.toString(),
      targetDate: goal.targetDate,
      category: goal.category,
    });
    setShowEditModal(true);
  };

  const openContributeModal = (goal: Goal) => {
    setSelectedGoal(goal);
    setShowContributeModal(true);
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const getDateFromMonths = (months: number) => {
    const date = new Date();
    date.setMonth(date.getMonth() + months);
    return formatDateForInput(date);
  };

  const applyTemplate = (template: typeof goalTemplates[0]) => {
    setNewGoal({
      title: template.title,
      targetAmount: template.amount.toString(),
      targetDate: getDateFromMonths(template.months),
      category: template.category,
    });
    setShowTemplatesModal(false);
  };

  const duplicateGoal = (goal: Goal) => {
    setNewGoal({
      title: `${goal.title} (Copy)`,
      targetAmount: goal.targetAmount.toString(),
      targetDate: goal.targetDate,
      category: goal.category,
    });
    setShowAddModal(true);
  };

  const getGoalStatus = (goal: Goal) => {
    const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
    const timeRemaining = getTimeRemaining(goal.targetDate);
    
    if (progress >= 100) return { status: 'completed', color: '#00C896', icon: CheckCircle2 };
    if (timeRemaining === 'Overdue') return { status: 'overdue', color: '#FF3B30', icon: AlertCircle };
    if (progress >= 75) return { status: 'on-track', color: '#00C896', icon: TrendingUp };
    if (progress >= 50) return { status: 'good', color: '#FF9500', icon: Clock };
    return { status: 'behind', color: '#FF3B30', icon: AlertCircle };
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Goals</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: '#007AFF', marginRight: 8 }]}
            onPress={() => setShowTemplatesModal(true)}
          >
            <Copy size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Plus size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Progress Overview */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewHeader}>
            <Trophy size={24} color="#FFD700" />
            <Text style={styles.overviewTitle}>Overall Progress</Text>
          </View>
          
          <View style={styles.overviewStats}>
            <View style={styles.overviewStat}>
              <Text style={styles.overviewAmount}>
                {formatCurrencySimple(totalCurrentAmount, userCurrency)}
              </Text>
              <Text style={styles.overviewLabel}>Saved</Text>
            </View>
            <View style={styles.overviewStat}>
              <Text style={styles.overviewAmount}>
                {formatCurrencySimple(totalTargetAmount, userCurrency)}
              </Text>
              <Text style={styles.overviewLabel}>Target</Text>
            </View>
            <View style={styles.overviewStat}>
              <Text style={[styles.overviewAmount, { color: '#00C896' }]}>
                {Math.round(overallProgress)}%
              </Text>
              <Text style={styles.overviewLabel}>Complete</Text>
            </View>
          </View>

          <View style={styles.overallProgress}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${Math.min(overallProgress, 100)}%`,
                    backgroundColor: '#00C896'
                  }
                ]} 
              />
            </View>
          </View>
        </View>

        {/* Category Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryFilter}
          contentContainerStyle={styles.categoryFilterContainer}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.key}
              style={[
                styles.categoryTab,
                selectedCategory === category.key && styles.activeCategoryTab,
              ]}
              onPress={() => setSelectedCategory(category.key)}
            >
              <Text
                style={[
                  styles.categoryTabText,
                  selectedCategory === category.key && styles.activeCategoryTabText,
                ]}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Goals List */}
        <View style={styles.goalsContainer}>
          {filteredGoals.map((goal, index) => {
            const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
            const remaining = goal.targetAmount - goal.currentAmount;
            const timeRemaining = getTimeRemaining(goal.targetDate);
            const GoalIcon = getGoalIcon(goal.category);
            const goalColor = getGoalColor(index);
            const goalStatus = getGoalStatus(goal);
            const StatusIcon = goalStatus.icon;

            return (
              <TouchableOpacity key={goal.id} style={styles.goalCard}>
                <View style={styles.goalHeader}>
                  <View style={styles.goalInfo}>
                    <View style={[
                      styles.goalIcon,
                      { backgroundColor: `${goalColor}15` }
                    ]}>
                      <GoalIcon size={24} color={goalColor} />
                    </View>
                    <View style={styles.goalDetails}>
                      <View style={styles.goalTitleRow}>
                        <Text style={styles.goalTitle}>{goal.title}</Text>
                        <View style={styles.goalActions}>
                          <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: '#8E8E9315' }]}
                            onPress={() => duplicateGoal(goal)}
                          >
                            <Copy size={16} color="#8E8E93" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: '#007AFF15' }]}
                            onPress={() => openContributeModal(goal)}
                          >
                            <TrendingUp size={16} color="#007AFF" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: '#8E8E9315' }]}
                            onPress={() => openEditModal(goal)}
                          >
                            <Edit3 size={16} color="#8E8E93" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: '#FF3B3015' }]}
                            onPress={() => handleDeleteGoal(goal)}
                          >
                            <Trash2 size={16} color="#FF3B30" />
                          </TouchableOpacity>
                        </View>
                      </View>
                      <View style={styles.goalCategoryRow}>
                        <Text style={styles.goalCategory}>{goal.category}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: `${goalStatus.color}15` }]}>
                          <StatusIcon size={12} color={goalStatus.color} />
                          <Text style={[styles.statusText, { color: goalStatus.color }]}>
                            {goalStatus.status.replace('-', ' ')}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.goalProgress}>
                  <View style={styles.progressInfo}>
                    <Text style={styles.progressAmount}>
                      {formatCurrencySimple(goal.currentAmount, userCurrency)} of {formatCurrencySimple(goal.targetAmount, userCurrency)}
                    </Text>
                    <Text style={styles.progressPercentage}>
                      {Math.round(progress)}%
                    </Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { 
                          width: `${Math.min(progress, 100)}%`,
                          backgroundColor: goalColor
                        }
                      ]} 
                    />
                  </View>
                </View>

                <View style={styles.goalFooter}>
                  <View style={styles.goalStat}>
                    <DollarSign size={14} color="#8E8E93" />
                    <Text style={styles.statText}>
                      {formatCurrencySimple(remaining, userCurrency)} remaining
                    </Text>
                  </View>
                  <View style={styles.goalStat}>
                    <Calendar size={14} color="#8E8E93" />
                    <Text style={[styles.statText, timeRemaining === 'Overdue' && { color: '#FF3B30' }]}>
                      {timeRemaining}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
          
          {filteredGoals.length === 0 && (
            <View style={styles.emptyState}>
              <Target size={48} color="#8E8E93" />
              <Text style={styles.emptyStateTitle}>No Goals Yet</Text>
              <Text style={styles.emptyStateText}>
                {selectedCategory === 'all' 
                  ? 'Start by adding your first financial goal!' 
                  : `No goals in ${selectedCategory} category`}
              </Text>
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={() => setShowAddModal(true)}
              >
                <Text style={styles.emptyStateButtonText}>Add Goal</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Achievement Card */}
        <View style={styles.achievementCard}>
          <View style={styles.achievementHeader}>
            <Target size={20} color="#FFD700" />
            <Text style={styles.achievementTitle}>Recent Achievement</Text>
          </View>
          <Text style={styles.achievementText}>
            🎉 Great progress! Keep working towards your financial goals.
          </Text>
        </View>
      </ScrollView>

      {/* Add Goal Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <X size={24} color="#8E8E93" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add New Goal</Text>
            <TouchableOpacity onPress={handleAddGoal}>
              <Text style={styles.saveButton}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Goal Title *</Text>
              <TextInput
                style={styles.textInput}
                value={newGoal.title}
                onChangeText={(text) => setNewGoal(prev => ({ ...prev, title: text }))}
                placeholder="e.g., Emergency Fund"
                placeholderTextColor="#8E8E93"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Target Amount *</Text>
              <TextInput
                style={styles.textInput}
                value={newGoal.targetAmount}
                onChangeText={(text) => setNewGoal(prev => ({ ...prev, targetAmount: text }))}
                placeholder="e.g., 10000"
                placeholderTextColor="#8E8E93"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Target Date *</Text>
              <TextInput
                style={styles.textInput}
                value={newGoal.targetDate}
                onChangeText={(text) => setNewGoal(prev => ({ ...prev, targetDate: text }))}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#8E8E93"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.categoryOptions}>
                  {categoryOptions.map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryOption,
                        newGoal.category === category && styles.selectedCategoryOption,
                      ]}
                      onPress={() => setNewGoal(prev => ({ ...prev, category }))}
                    >
                      <Text
                        style={[
                          styles.categoryOptionText,
                          newGoal.category === category && styles.selectedCategoryOptionText,
                        ]}
                      >
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Edit Goal Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <X size={24} color="#8E8E93" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Goal</Text>
            <TouchableOpacity onPress={handleEditGoal}>
              <Text style={styles.saveButton}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Goal Title *</Text>
              <TextInput
                style={styles.textInput}
                value={newGoal.title}
                onChangeText={(text) => setNewGoal(prev => ({ ...prev, title: text }))}
                placeholder="e.g., Emergency Fund"
                placeholderTextColor="#8E8E93"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Target Amount *</Text>
              <TextInput
                style={styles.textInput}
                value={newGoal.targetAmount}
                onChangeText={(text) => setNewGoal(prev => ({ ...prev, targetAmount: text }))}
                placeholder="e.g., 10000"
                placeholderTextColor="#8E8E93"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Target Date *</Text>
              <TextInput
                style={styles.textInput}
                value={newGoal.targetDate}
                onChangeText={(text) => setNewGoal(prev => ({ ...prev, targetDate: text }))}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#8E8E93"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.categoryOptions}>
                  {categoryOptions.map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryOption,
                        newGoal.category === category && styles.selectedCategoryOption,
                      ]}
                      onPress={() => setNewGoal(prev => ({ ...prev, category }))}
                    >
                      <Text
                        style={[
                          styles.categoryOptionText,
                          newGoal.category === category && styles.selectedCategoryOptionText,
                        ]}
                      >
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Contribute to Goal Modal */}
      <Modal
        visible={showContributeModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowContributeModal(false)}>
              <X size={24} color="#8E8E93" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              Add to {selectedGoal?.title}
            </Text>
            <TouchableOpacity onPress={handleContributeToGoal}>
              <Text style={styles.saveButton}>Add</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Contribution Amount *</Text>
              <TextInput
                style={styles.textInput}
                value={contributeAmount}
                onChangeText={setContributeAmount}
                placeholder="e.g., 100"
                placeholderTextColor="#8E8E93"
                keyboardType="numeric"
                autoFocus
              />
            </View>

            {selectedGoal && (
              <View style={styles.goalSummary}>
                <Text style={styles.goalSummaryTitle}>Goal Summary</Text>
                <View style={styles.goalSummaryRow}>
                  <Text style={styles.goalSummaryLabel}>Current Amount:</Text>
                  <Text style={styles.goalSummaryValue}>
                    {formatCurrencySimple(selectedGoal.currentAmount, userCurrency)}
                  </Text>
                </View>
                <View style={styles.goalSummaryRow}>
                  <Text style={styles.goalSummaryLabel}>Target Amount:</Text>
                  <Text style={styles.goalSummaryValue}>
                    {formatCurrencySimple(selectedGoal.targetAmount, userCurrency)}
                  </Text>
                </View>
                <View style={styles.goalSummaryRow}>
                  <Text style={styles.goalSummaryLabel}>Remaining:</Text>
                  <Text style={styles.goalSummaryValue}>
                    {formatCurrencySimple(selectedGoal.targetAmount - selectedGoal.currentAmount, userCurrency)}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </SafeAreaView>
      </Modal>

      {/* Goal Templates Modal */}
      <Modal
        visible={showTemplatesModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowTemplatesModal(false)}>
              <X size={24} color="#8E8E93" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Goal Templates</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.sectionTitle}>Quick Start Templates</Text>
            <Text style={styles.sectionDescription}>
              Choose from popular goal templates to get started quickly
            </Text>
            
            {goalTemplates.map((template, index) => (
              <TouchableOpacity
                key={index}
                style={styles.templateCard}
                onPress={() => applyTemplate(template)}
              >
                <View style={styles.templateHeader}>
                  <Text style={styles.templateTitle}>{template.title}</Text>
                  <Text style={styles.templateAmount}>{formatCurrencySimple(template.amount, userCurrency)}</Text>
                </View>
                <View style={styles.templateDetails}>
                  <Text style={styles.templateCategory}>{template.category}</Text>
                  <Text style={styles.templateDuration}>{template.months} months</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
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
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  overviewTitle: {
    fontSize: 18,
    color: '#1C1C1E',
    fontWeight: '700',
  },
  overviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  overviewStat: {
    alignItems: 'center',
  },
  overviewAmount: {
    fontSize: 18,
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
    marginTop: 8,
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
  categoryFilter: {
    marginBottom: 20,
  },
  categoryFilterContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  activeCategoryTab: {
    backgroundColor: '#00C896',
    borderColor: '#00C896',
  },
  categoryTabText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '600',
  },
  activeCategoryTabText: {
    color: '#FFFFFF',
  },
  goalsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  goalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  goalHeader: {
    marginBottom: 16,
  },
  goalInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  goalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  goalDetails: {
    flex: 1,
  },
  goalTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  goalTitle: {
    fontSize: 18,
    color: '#1C1C1E',
    fontWeight: '700',
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  goalDescription: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  goalProgress: {
    marginBottom: 16,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressAmount: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '600',
  },
  progressPercentage: {
    fontSize: 14,
    color: '#00C896',
    fontWeight: '700',
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  goalStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  achievementCard: {
    backgroundColor: '#FFF9E6',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  achievementTitle: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '700',
  },
  achievementText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
    lineHeight: 20,
  },
  goalActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalCategory: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    color: '#1C1C1E',
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: '#00C896',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  emptyStateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
    color: '#1C1C1E',
    fontWeight: '700',
  },
  saveButton: {
    fontSize: 16,
    color: '#00C896',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1C1C1E',
    backgroundColor: '#FFFFFF',
  },
  categoryOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  selectedCategoryOption: {
    backgroundColor: '#00C896',
    borderColor: '#00C896',
  },
  categoryOptionText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '600',
  },
  selectedCategoryOptionText: {
    color: '#FFFFFF',
  },
  goalSummary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  goalSummaryTitle: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '700',
    marginBottom: 12,
  },
  goalSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  goalSummaryLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  goalSummaryValue: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalCategoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  sectionTitle: {
    fontSize: 20,
    color: '#1C1C1E',
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
    marginBottom: 24,
    lineHeight: 20,
  },
  templateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  templateTitle: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '600',
  },
  templateAmount: {
    fontSize: 16,
    color: '#00C896',
    fontWeight: '700',
  },
  templateDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  templateCategory: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  templateDuration: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  dateInputContainer: {
    gap: 8,
  },
  dateQuickActions: {
    flexDirection: 'row',
    gap: 8,
  },
  dateQuickButton: {
    backgroundColor: '#E5E5EA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  dateQuickText: {
    fontSize: 12,
    color: '#1C1C1E',
    fontWeight: '600',
  },
});