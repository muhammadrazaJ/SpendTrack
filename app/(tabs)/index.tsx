// app/tabs/index.tsx (FIXED ANIMATED VERSION)

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
  Animated,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

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

// Animated Expense Item Component
const AnimatedExpenseItem = ({ 
  item, 
  index, 
  onDelete 
}: { 
  item: Expense; 
  index: number; 
  onDelete: (id: string) => void;
}) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleDelete = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onDelete(item.id));
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Food: '#FF6B6B',
      Transport: '#4ECDC4',
      Bills: '#FFE66D',
      Entertainment: '#A8E6CF',
      Other: '#C7CEEA',
    };
    return colors[category] || '#4CAF50';
  };

  return (
    <Animated.View
      style={[
        styles.expenseItem,
        {
          opacity: fadeAnim,
          transform: [
            { translateX: slideAnim },
            { scale: scaleAnim },
          ],
          borderLeftColor: getCategoryColor(item.category),
        },
      ]}
    >
      <View style={styles.expenseContent}>
        <View style={styles.categoryBadge}>
          <Text style={styles.expenseCategory}>{item.category}</Text>
        </View>
        <Text style={styles.expenseAmount}>Rs. {item.amount.toLocaleString()}</Text>
        <Text style={styles.expenseDate}>{new Date(item.date).toLocaleDateString('en-GB', { 
          day: 'numeric', 
          month: 'short', 
          year: 'numeric' 
        })}</Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={handleDelete}
        activeOpacity={0.7}
        accessibilityLabel="Delete expense"
      >
        <Ionicons name="trash-outline" size={22} color="#EF5350" />
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function HomeScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey);
  const [loaded, setLoaded] = useState(false);

  // Animation values
  const headerFadeAnim = React.useRef(new Animated.Value(0)).current;
  const headerSlideAnim = React.useRef(new Animated.Value(-30)).current;
  const totalScaleAnim = React.useRef(new Animated.Value(1)).current;

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

  // Animate header on mount
  useEffect(() => {
    if (loaded) {
      Animated.parallel([
        Animated.timing(headerFadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(headerSlideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loaded]);

  // Animate total when it changes
  useEffect(() => {
    Animated.sequence([
      Animated.timing(totalScaleAnim, {
        toValue: 1.15,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(totalScaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();
  }, [expenses.length]);

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
      <LinearGradient
        colors={['#4CAF50', '#45a049']}
        style={styles.headerGradient}
      >
        <Animated.View
          style={[
            styles.header,
            {
              opacity: headerFadeAnim,
              transform: [{ translateY: headerSlideAnim }],
            },
          ]}
        >
          <Text style={styles.title}>💰 SpendTrack</Text>
          <Animated.View style={{ transform: [{ scale: totalScaleAnim }] }}>
            <Text style={styles.total}>Rs. {total.toLocaleString()}</Text>
          </Animated.View>
          <Text style={styles.subtitle}>Total Expenses</Text>
        </Animated.View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.monthSection}>
          <Text style={styles.monthLabel}>📅 Select Month</Text>
          <View style={styles.pickerWrap}>
            <Picker
              selectedValue={selectedMonth}
              onValueChange={(v) => setSelectedMonth(v)}
              style={styles.picker}
              dropdownIconColor="#4CAF50"
            >
              {monthOptions.map(({ key, label }) => (
                <Picker.Item key={key} label={label} value={key} />
              ))}
            </Picker>
          </View>
        </View>

        <ExpenseForm onAddExpense={handleAddExpense} />

        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Recent Expenses</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{filteredExpenses.length}</Text>
          </View>
        </View>

        {filteredExpenses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📊</Text>
            <Text style={styles.emptyText}>No expenses yet</Text>
            <Text style={styles.emptySubtext}>Add your first expense above</Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {filteredExpenses.map((item, index) => (
              <AnimatedExpenseItem
                key={item.id}
                item={item}
                index={index}
                onDelete={handleDeleteExpense}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    flex: 1,
    textAlign: 'center',
    marginTop: 48,
    fontSize: 16,
    color: '#666',
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  total: {
    fontSize: 42,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scrollContent: {
    flex: 1,
    marginTop: -10,
  },
  monthSection: {
    marginHorizontal: 20,
    marginBottom: 16,
    marginTop: 20,
  },
  monthLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
  },
  pickerWrap: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    ...(Platform.OS === 'ios' && { height: 120 }),
  },
  picker: {
    height: Platform.OS === 'android' ? 52 : 120,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 12,
    marginTop: 8,
  },
  listTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  countBadge: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    minWidth: 32,
    alignItems: 'center',
  },
  countText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 16,
    marginBottom: 12,
    borderLeftWidth: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  expenseContent: {
    flex: 1,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  expenseCategory: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  expenseAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2E7D32',
    marginBottom: 4,
  },
  expenseDate: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
  },
  deleteButton: {
    padding: 12,
    marginLeft: 12,
    borderRadius: 12,
    backgroundColor: '#FFEBEE',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    fontWeight: '600',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
});