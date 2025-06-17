import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { X, DollarSign, Calendar, Tag, Building } from 'lucide-react-native';
import { useAppContext } from '../context/AppContext';

const { width } = Dimensions.get('window');

interface AddTransactionModalProps {
  visible: boolean;
  onClose: () => void;
}

const categories = [
  'Food & Dining',
  'Transportation', 
  'Shopping',
  'Entertainment',
  'Housing',
  'Utilities',
  'Healthcare',
  'Education',
  'Income',
  'Other',
];

export default function AddTransactionModal({ visible, onClose }: AddTransactionModalProps) {
  const { addTransaction } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    merchant: '',
    amount: '',
    category: 'Food & Dining',
    type: 'expense' as 'expense' | 'income',
  });

  const handleSubmit = async () => {
    if (!formData.merchant.trim()) {
      Alert.alert('Error', 'Please enter a merchant name');
      return;
    }

    if (!formData.amount.trim() || isNaN(Number(formData.amount))) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      setIsLoading(true);
      
      const amount = formData.type === 'expense' 
        ? -Math.abs(Number(formData.amount))
        : Math.abs(Number(formData.amount));

      const now = new Date();
      const transaction = {
        merchant: formData.merchant.trim(),
        amount,
        category: formData.category,
        date: now.toISOString(), // Use ISO string for backend
        time: now.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        type: formData.type,
      };

      await addTransaction(transaction);
      
      // Reset form
      setFormData({
        merchant: '',
        amount: '',
        category: 'Food & Dining',
        type: 'expense',
      });
      
      onClose();
      Alert.alert('Success', 'Transaction added successfully!');
    } catch (error) {
      console.error('Error adding transaction:', error);
      Alert.alert('Error', 'Failed to add transaction. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      merchant: '',
      amount: '',
      category: 'Food & Dining',
      type: 'expense',
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color="#1C1C1E" />
          </TouchableOpacity>
          <Text style={styles.title}>Add Transaction</Text>
          <TouchableOpacity 
            onPress={handleSubmit} 
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
            disabled={isLoading}
          >
            <Text style={styles.saveButtonText}>
              {isLoading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Transaction Type */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Transaction Type</Text>
            <View style={styles.typeContainer}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  formData.type === 'expense' && styles.typeButtonActive,
                ]}
                onPress={() => setFormData({ ...formData, type: 'expense' })}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    formData.type === 'expense' && styles.typeButtonTextActive,
                  ]}
                >
                  Expense
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  formData.type === 'income' && styles.typeButtonActive,
                ]}
                onPress={() => setFormData({ ...formData, type: 'income' })}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    formData.type === 'income' && styles.typeButtonTextActive,
                  ]}
                >
                  Income
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Amount */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amount</Text>
            <View style={styles.inputContainer}>
              <DollarSign size={20} color="#8E8E93" />
              <TextInput
                style={styles.textInput}
                placeholder="0.00"
                placeholderTextColor="#8E8E93"
                value={formData.amount}
                onChangeText={(text) => setFormData({ ...formData, amount: text })}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Merchant */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {formData.type === 'income' ? 'Source' : 'Merchant'}
            </Text>
            <View style={styles.inputContainer}>
              <Building size={20} color="#8E8E93" />
              <TextInput
                style={styles.textInput}
                placeholder={formData.type === 'income' ? 'e.g., Salary, Freelance' : 'e.g., Starbucks, Target'}
                placeholderTextColor="#8E8E93"
                value={formData.merchant}
                onChangeText={(text) => setFormData({ ...formData, merchant: text })}
              />
            </View>
          </View>

          {/* Category */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
              <View style={styles.categoriesContainer}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryButton,
                      formData.category === category && styles.categoryButtonActive,
                    ]}
                    onPress={() => setFormData({ ...formData, category })}
                  >
                    <Text
                      style={[
                        styles.categoryButtonText,
                        formData.category === category && styles.categoryButtonTextActive,
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
      </View>
    </Modal>
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
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
  },
  categoriesScroll: {
    marginHorizontal: -20,
  },
  categoriesContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  categoryButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  categoryButtonTextActive: {
    color: '#FFFFFF',
  },
});