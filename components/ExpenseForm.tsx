// components/ExpenseForm.tsx – supports date selection and dark mode

import { Picker } from '@react-native-picker/picker';
import React, { useState, useRef } from 'react';
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Animated,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/use-theme-color';

export const EXPENSE_CATEGORIES = [
  'Food',
  'Transport',
  'Bills',
  'Entertainment',
  'Other',
] as const;

type ExpenseFormProps = {
  selectedDate: string; // YYYY-MM-DD
  onAddExpense: (amount: number, category: string, date: string) => void;
};

export default function ExpenseForm({ selectedDate, onAddExpense }: ExpenseFormProps) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [isFocused, setIsFocused] = useState(false);

  // Animation refs
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  const successAnim = useRef(new Animated.Value(0)).current;
  const formShakeAnim = useRef(new Animated.Value(0)).current;
  const inputBorderAnim = useRef(new Animated.Value(0)).current;

  const handleAddExpense = () => {
    const parsed = parseFloat(amount);

    if (isNaN(parsed) || parsed <= 0) {
      // Shake animation for error
      Animated.sequence([
        Animated.timing(formShakeAnim, {
          toValue: 10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(formShakeAnim, {
          toValue: -10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(formShakeAnim, {
          toValue: 10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(formShakeAnim, {
          toValue: 0,
          duration: 50,
          useNativeDriver: true,
        }),
      ]).start();

      Alert.alert('Invalid amount', 'Please enter a positive amount.');
      return;
    }

    // Success animation
    Animated.sequence([
      Animated.parallel([
        Animated.timing(successAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(buttonScaleAnim, {
          toValue: 0.95,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(successAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(buttonScaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 5,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    onAddExpense(parsed, category, selectedDate);
    setAmount('');
    setCategory(EXPENSE_CATEGORIES[0]);
    Keyboard.dismiss();
  };

  const handlePressIn = () => {
    Animated.spring(buttonScaleAnim, {
      toValue: 0.96,
      tension: 100,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScaleAnim, {
      toValue: 1,
      tension: 100,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(inputBorderAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.timing(inputBorderAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const inputBorder = useThemeColor({}, 'inputBorder');
  const primary = useThemeColor({}, 'primary');
  const borderColor = inputBorderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [inputBorder, primary],
  });

  const card = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const text = useThemeColor({}, 'text');
  const mutedText = useThemeColor({}, 'mutedText');
  const inputBg = useThemeColor({}, 'inputBg');

  return (
    <Animated.View
      style={[
        styles.formContainer,
        { backgroundColor: card, borderColor: cardBorder, transform: [{ translateX: formShakeAnim }] },
      ]}
    >
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: text }]}>💵 Amount (Rs.)</Text>
        <Animated.View style={[styles.inputWrapper, { borderColor, backgroundColor: inputBg }]}>
          <TextInput
            style={[styles.input, { color: text }]}
            placeholder="0.00"
            placeholderTextColor={mutedText}
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        </Animated.View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: text }]}>🏷️ Category</Text>
        <View style={[styles.pickerWrap, { backgroundColor: inputBg, borderColor: inputBorder }]}>
          <Picker
            selectedValue={category}
            onValueChange={(v) => setCategory(v)}
            style={[styles.picker, { color: text }]}
            dropdownIconColor={primary}
          >
            {EXPENSE_CATEGORIES.map((cat) => (
              <Picker.Item key={cat} label={cat} value={cat} />
            ))}
          </Picker>
        </View>
      </View>

      <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: primary }]}
          onPress={handleAddExpense}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
        >
          <Animated.View
            style={[
              styles.successOverlay,
              {
                opacity: successAnim,
                backgroundColor: primary,
                transform: [
                  {
                    scale: successAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1.2],
                    }),
                  },
                ],
              },
            ]}
          />
          <Ionicons name="add-circle" size={22} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Add Expense</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    marginHorizontal: 20,
    padding: 24,
    borderRadius: 20,
    marginBottom: 24,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  inputWrapper: {
    borderWidth: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  input: {
    padding: 16,
    fontSize: 18,
    fontWeight: '600',
  },
  pickerWrap: {
    borderWidth: 2,
    borderRadius: 12,
    overflow: 'hidden',
    ...(Platform.OS === 'ios' && { height: 120 }),
  },
  picker: {
    height: Platform.OS === 'android' ? 52 : 120,
  },
  button: {
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  successOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});