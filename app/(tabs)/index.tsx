// app/tabs/index.tsx – dark mode, calendar, monthly summary, edit

import Calendar from '@/components/Calendar';
import ExpenseForm from '@/components/ExpenseForm';
import { EXPENSE_CATEGORIES } from '@/components/ExpenseForm';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  ScrollView,
  Modal,
  TextInput,
  Alert,
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

function getMonthOptions(expenses: Expense[], selectedMonthKey: string): { key: string; label: string }[] {
  const currentKey = getCurrentMonthKey();
  const keys = new Set<string>([currentKey, selectedMonthKey]);
  expenses.forEach((e) => keys.add(getMonthKeyFromDate(e.date)));
  const months = Array.from(keys).sort((a, b) => b.localeCompare(a));
  return months.map((key) => {
    const [y, m] = key.split('-');
    const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
    const label = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    return { key, label };
  });
}

function getTodayDateStr(): string {
  return new Date().toISOString().slice(0, 10);
}

// Animated Expense Item with theme and edit
const AnimatedExpenseItem = ({
  item,
  index,
  onDelete,
  onEdit,
  cardBg,
  cardBorder,
  text,
  secondaryText,
  mutedText,
  danger,
  dangerBg,
}: {
  item: Expense;
  index: number;
  onDelete: (id: string) => void;
  onEdit: (expense: Expense) => void;
  cardBg: string;
  cardBorder: string;
  text: string;
  secondaryText: string;
  mutedText: string;
  danger: string;
  dangerBg: string;
}) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;

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

  return (
    <Animated.View
      style={[
        styles.expenseItem,
        {
          backgroundColor: cardBg,
          borderLeftColor: getCategoryColor(item.category),
          opacity: fadeAnim,
          transform: [
            { translateX: slideAnim },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.expenseContent}
        onPress={() => onEdit(item)}
        activeOpacity={0.9}
        accessibilityLabel="Edit expense"
      >
        <View style={[styles.categoryBadge, { backgroundColor: cardBorder }]}>
          <Text style={[styles.expenseCategory, { color: secondaryText }]}>{item.category}</Text>
        </View>
        <Text style={[styles.expenseAmount, { color: text }]}>
          Rs. {item.amount.toLocaleString()}
        </Text>
        <Text style={[styles.expenseDate, { color: mutedText }]}>
          {new Date(item.date).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.deleteButton, { backgroundColor: dangerBg }]}
        onPress={handleDelete}
        activeOpacity={0.7}
        accessibilityLabel="Delete expense"
      >
        <Ionicons name="trash-outline" size={22} color={danger} />
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function HomeScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey());
  const [selectedDate, setSelectedDate] = useState(getTodayDateStr);
  const [loaded, setLoaded] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [editDate, setEditDate] = useState('');

  const background = useThemeColor({}, 'background');
  const card = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const text = useThemeColor({}, 'text');
  const secondaryText = useThemeColor({}, 'secondaryText');
  const mutedText = useThemeColor({}, 'mutedText');
  const primary = useThemeColor({}, 'primary');
  const danger = useThemeColor({}, 'danger');
  const dangerBg = useThemeColor({}, 'dangerBg');
  const inputBg = useThemeColor({}, 'inputBg');
  const inputBorder = useThemeColor({}, 'inputBorder');

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

  const handleAddExpense = useCallback((amount: number, category: string, date: string) => {
    const newExpense: Expense = {
      id: String(Date.now()),
      amount,
      category,
      date,
    };
    setExpenses((prev) => [newExpense, ...prev]);
  }, []);

  const handleDeleteExpense = useCallback((id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const openEdit = useCallback((expense: Expense) => {
    setEditingExpense(expense);
    setEditAmount(String(expense.amount));
    setEditCategory(expense.category);
    setEditDate(expense.date);
  }, []);

  const closeEdit = useCallback(() => {
    setEditingExpense(null);
  }, []);

  const saveEdit = useCallback(() => {
    if (!editingExpense) return;
    const parsed = parseFloat(editAmount);
    if (isNaN(parsed) || parsed <= 0) {
      Alert.alert('Invalid amount', 'Please enter a positive amount.');
      return;
    }
    setExpenses((prev) =>
      prev.map((e) =>
        e.id === editingExpense.id
          ? { ...e, amount: parsed, category: editCategory, date: editDate }
          : e
      )
    );
    closeEdit();
  }, [editingExpense, editAmount, editCategory, editDate, closeEdit]);

  const monthOptions = useMemo(
    () => getMonthOptions(expenses, selectedMonth),
    [expenses, selectedMonth]
  );

  const filteredExpenses = useMemo(
    () => expenses.filter((e) => getMonthKeyFromDate(e.date) === selectedMonth),
    [expenses, selectedMonth]
  );

  const total = useMemo(
    () => filteredExpenses.reduce((sum, e) => sum + e.amount, 0),
    [filteredExpenses]
  );

  const monthlyTotals = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach((e) => {
      const key = getMonthKeyFromDate(e.date);
      map.set(key, (map.get(key) ?? 0) + e.amount);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, sum]) => {
        const [y, m] = key.split('-');
        const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
        const label = date.toLocaleString('default', { month: 'short', year: 'numeric' });
        return { key, label, total: sum };
      });
  }, [expenses]);

  if (!loaded) {
    return (
      <View style={[styles.container, { backgroundColor: background }]}>
        <Text style={[styles.loadingText, { color: mutedText }]}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      <LinearGradient
        colors={[primary, '#45a049']}
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
          <Text style={styles.subtitle}>Total for selected month</Text>
        </Animated.View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.monthSection}>
          <Text style={[styles.monthLabel, { color: text }]}>📅 Select month to view</Text>
          <View style={[styles.pickerWrap, { backgroundColor: card, borderColor: cardBorder }]}>
            <Picker
              selectedValue={selectedMonth}
              onValueChange={(v) => setSelectedMonth(v)}
              style={[styles.picker, { color: text }]}
              dropdownIconColor={primary}
            >
              {monthOptions.map(({ key, label }) => (
                <Picker.Item key={key} label={label} value={key} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: card, borderColor: cardBorder }]}>
          <Text style={[styles.summaryTitle, { color: text }]}>📊 Monthly expense summary</Text>
          {monthlyTotals.length === 0 ? (
            <Text style={[styles.summaryEmpty, { color: mutedText }]}>No expenses recorded yet</Text>
          ) : (
            monthlyTotals.map(({ key, label, total: monthTotal }) => (
              <View key={key} style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: text }]}>{label}</Text>
                <Text style={[styles.summaryValue, { color: primary }]}>
                  Rs. {monthTotal.toLocaleString()}
                </Text>
              </View>
            ))
          )}
        </View>

        <Text style={[styles.calendarSectionLabel, { color: text }]}>
          📅 Pick a date to add expense (any date)
        </Text>
        <Calendar
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          displayMonthKey={selectedMonth}
          onMonthChange={setSelectedMonth}
        />

        <ExpenseForm
          selectedDate={selectedDate}
          onAddExpense={handleAddExpense}
        />

        <View style={styles.listHeader}>
          <Text style={[styles.listTitle, { color: text }]}>Recent expenses</Text>
          <View style={[styles.countBadge, { backgroundColor: primary }]}>
            <Text style={styles.countText}>{filteredExpenses.length}</Text>
          </View>
        </View>

        {filteredExpenses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📊</Text>
            <Text style={[styles.emptyText, { color: mutedText }]}>No expenses this month</Text>
            <Text style={[styles.emptySubtext, { color: mutedText }]}>
              Add an expense above or pick another month
            </Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {filteredExpenses.map((item, index) => (
              <AnimatedExpenseItem
                key={item.id}
                item={item}
                index={index}
                onDelete={handleDeleteExpense}
                onEdit={openEdit}
                cardBg={card}
                cardBorder={cardBorder}
                text={text}
                secondaryText={secondaryText}
                mutedText={mutedText}
                danger={danger}
                dangerBg={dangerBg}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={editingExpense !== null}
        transparent
        animationType="slide"
        onRequestClose={closeEdit}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: card }]}>
            <Text style={[styles.modalTitle, { color: text }]}>Edit expense</Text>
            <Text style={[styles.modalLabel, { color: text }]}>Amount (Rs.)</Text>
            <TextInput
              style={[styles.modalInput, { color: text, backgroundColor: inputBg, borderColor: inputBorder }]}
              value={editAmount}
              onChangeText={setEditAmount}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={mutedText}
            />
            <Text style={[styles.modalLabel, { color: text }]}>Category</Text>
            <View style={[styles.pickerWrap, { backgroundColor: inputBg, borderColor: inputBorder }]}>
              <Picker
                selectedValue={editCategory}
                onValueChange={setEditCategory}
                style={[styles.picker, { color: text }]}
                dropdownIconColor={primary}
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <Picker.Item key={cat} label={cat} value={cat} />
                ))}
              </Picker>
            </View>
            <Text style={[styles.modalLabel, { color: text }]}>Date (YYYY-MM-DD)</Text>
            <TextInput
              style={[styles.modalInput, { color: text, backgroundColor: inputBg, borderColor: inputBorder }]}
              value={editDate}
              onChangeText={setEditDate}
              placeholder="2025-02-14"
              placeholderTextColor={mutedText}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel, { backgroundColor: cardBorder }]}
                onPress={closeEdit}
              >
                <Text style={[styles.modalButtonText, { color: text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave, { backgroundColor: primary }]}
                onPress={saveEdit}
              >
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingText: {
    flex: 1,
    textAlign: 'center',
    marginTop: 48,
    fontSize: 16,
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
    marginBottom: 10,
  },
  pickerWrap: {
    borderRadius: 12,
    borderWidth: 2,
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
  summaryCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.3)',
  },
  summaryLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  summaryEmpty: {
    fontSize: 14,
    paddingVertical: 8,
  },
  calendarSectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    marginHorizontal: 20,
    marginBottom: 10,
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
  },
  countBadge: {
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
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  expenseCategory: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  expenseAmount: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  expenseDate: {
    fontSize: 13,
    fontWeight: '500',
  },
  deleteButton: {
    padding: 12,
    marginLeft: 12,
    borderRadius: 12,
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
    fontWeight: '600',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonCancel: {},
  modalButtonSave: {},
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});