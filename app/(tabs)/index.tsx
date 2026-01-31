import ExpenseForm from '@/components/ExpenseForm';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const EXPENSES_KEY = '@spendtrack/expenses';

export type Expense = {
  id: string;
  amount: number;
  category: string;
  date: string;
};

function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthKeyFromDate(dateStr: string): string {
  return dateStr.slice(0, 7);
}

function getMonthOptions(expenses: Expense[]): { key: string; label: string }[] {
  const currentKey = getCurrentMonthKey();
  const keys = new Set<string>([currentKey]);
  expenses.forEach((e) => keys.add(getMonthKeyFromDate(e.date)));
  const months = Array.from(keys).sort((a, b) => b.localeCompare(a));
  return months.map((key) => {
    const [y, m] = key.split('-');
    const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
    const label = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    return { key, label };
  });
}

export default function HomeScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(EXPENSES_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Expense[];
          setExpenses(Array.isArray(parsed) ? parsed : []);
        }
      } catch {
        // ignore
      }
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses)).catch(() => {});
  }, [expenses, loaded]);

  const handleAddExpense = useCallback((amount: number, category: string) => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const newExpense: Expense = {
      id: String(Date.now()),
      amount,
      category,
      date: dateStr,
    };
    setExpenses((prev) => [newExpense, ...prev]);
  }, []);

  const handleDeleteExpense = useCallback((id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const monthOptions = useMemo(() => getMonthOptions(expenses), [expenses]);

  const filteredExpenses = useMemo(
    () => expenses.filter((e) => getMonthKeyFromDate(e.date) === selectedMonth),
    [expenses, selectedMonth]
  );

  const total = useMemo(
    () => filteredExpenses.reduce((sum, e) => sum + e.amount, 0),
    [filteredExpenses]
  );

  if (!loaded) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>SpendTrack</Text>
        <Text style={styles.total}>Total: Rs. {total}</Text>
      </View>

      <View style={styles.monthSection}>
        <Text style={styles.monthLabel}>Month</Text>
        <View style={styles.pickerWrap}>
          <Picker
            selectedValue={selectedMonth}
            onValueChange={(v) => setSelectedMonth(v)}
            style={styles.picker}
            dropdownIconColor="#333"
          >
            {monthOptions.map(({ key, label }) => (
              <Picker.Item key={key} label={label} value={key} />
            ))}
          </Picker>
        </View>
      </View>

      <ExpenseForm onAddExpense={handleAddExpense} />

      <Text style={styles.listTitle}>Expenses</Text>
      <FlatList
        data={filteredExpenses}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No expenses yet.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.expenseItem}>
            <View style={styles.expenseContent}>
              <Text style={styles.expenseCategory}>{item.category}</Text>
              <Text style={styles.expenseAmount}>Rs. {item.amount}</Text>
              <Text style={styles.expenseDate}>{item.date}</Text>
            </View>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteExpense(item.id)}
              activeOpacity={0.7}
              accessibilityLabel="Delete expense"
            >
              <Ionicons name="trash-outline" size={24} color="#c62828" />
            </TouchableOpacity>
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
  loadingText: {
    flex: 1,
    textAlign: 'center',
    marginTop: 48,
    fontSize: 16,
    color: '#666',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 8,
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
  monthSection: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  monthLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginBottom: 8,
  },
  pickerWrap: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    ...(Platform.OS === 'ios' && { height: 120 }),
  },
  picker: {
    height: Platform.OS === 'android' ? 52 : 120,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  expenseContent: {
    flex: 1,
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
  deleteButton: {
    padding: 10,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: '#ffebee',
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 24,
  },
});
