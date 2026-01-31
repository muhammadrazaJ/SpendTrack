import ExpenseForm from '@/components/ExpenseForm';
import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

export type Expense = {
  id: string;
  amount: number;
  category: string;
  date: string;
};

export default function HomeScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  const handleAddExpense = useCallback((amount: number, category: string) => {
    const newExpense: Expense = {
      id: String(Date.now()),
      amount,
      category: category.trim() || 'Uncategorized',
      date: new Date().toLocaleDateString(),
    };
    setExpenses((prev) => [newExpense, ...prev]);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>SpendTrack</Text>
        <Text style={styles.total}>Total: Rs. {total}</Text>
      </View>

      <ExpenseForm onAddExpense={handleAddExpense} />

      <Text style={styles.listTitle}>Expenses</Text>
      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No expenses yet. Add one above.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.expenseItem}>
            <Text style={styles.expenseCategory}>{item.category}</Text>
            <Text style={styles.expenseAmount}>Rs. {item.amount}</Text>
            <Text style={styles.expenseDate}>{item.date}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  total: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2e7d32',
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginHorizontal: 20,
    marginBottom: 12,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  expenseItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  expenseCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2e7d32',
    marginTop: 4,
  },
  expenseDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 24,
  },
});
