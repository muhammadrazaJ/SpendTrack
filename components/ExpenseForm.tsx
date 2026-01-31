import React, { useState } from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

type ExpenseFormProps = {
  onAddExpense: (amount: number, category: string) => void;
};

export default function ExpenseForm({ onAddExpense }: ExpenseFormProps) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');

  const handleAddExpense = () => {
    const trimmedCategory = category.trim();
    const parsed = parseFloat(amount);

    const isAmountInvalid = isNaN(parsed) || parsed <= 0;
    const isCategoryEmpty = trimmedCategory.length === 0;

    if (isAmountInvalid && isCategoryEmpty) {
      Alert.alert(
        'Invalid input',
        'Please enter a positive amount and a category.'
      );
      return;
    }
    if (isAmountInvalid) {
      Alert.alert('Invalid amount', 'Amount must be a positive number.');
      return;
    }
    if (isCategoryEmpty) {
      Alert.alert('Invalid category', 'Category cannot be empty.');
      return;
    }

    onAddExpense(parsed, trimmedCategory);
    setAmount('');
    setCategory('');
  };

  return (
    <View style={styles.formContainer}>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Amount</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter amount"
          placeholderTextColor="#999"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Category</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Food, Transport"
          placeholderTextColor="#999"
          value={category}
          onChangeText={setCategory}
        />
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={handleAddExpense}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>Add Expense</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
