// components/Calendar.tsx – calendar grid for selecting date (any date, including past)

import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/use-theme-color';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type CalendarProps = {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (dateStr: string) => void;
  displayMonthKey?: string; // YYYY-MM, which month to show in the grid
  onMonthChange?: (monthKey: string) => void; // when user taps prev/next
};

function getDaysInMonth(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days: Date[] = [];
  for (let d = 1; d <= last.getDate(); d++) {
    days.push(new Date(year, month, d));
  }
  return days;
}

function getPaddingDays(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export default function Calendar({
  selectedDate,
  onSelectDate,
  displayMonthKey,
  onMonthChange,
}: CalendarProps) {
  const card = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const text = useThemeColor({}, 'text');
  const mutedText = useThemeColor({}, 'mutedText');
  const primary = useThemeColor({}, 'primary');

  const [year, month] = useMemo(() => {
    if (displayMonthKey) {
      const [y, m] = displayMonthKey.split('-').map(Number);
      return [y, m - 1];
    }
    const [y, m] = selectedDate.split('-').map(Number);
    return [y, m - 1];
  }, [displayMonthKey, selectedDate]);

  const days = useMemo(() => getDaysInMonth(year, month), [year, month]);
  const padding = useMemo(() => getPaddingDays(year, month), [year, month]);

  const goPrev = () => {
    const d = new Date(year, month - 1, 1);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const monthKey = dateStr.slice(0, 7);
    onSelectDate(dateStr);
    onMonthChange?.(monthKey);
  };

  const goNext = () => {
    const d = new Date(year, month + 1, 1);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const monthKey = dateStr.slice(0, 7);
    onSelectDate(dateStr);
    onMonthChange?.(monthKey);
  };

  const monthLabel = useMemo(
    () => new Date(year, month, 1).toLocaleString('default', { month: 'long', year: 'numeric' }),
    [year, month]
  );

  const selected = useMemo(() => {
    // Parse the date string as local date to avoid timezone issues
    const [y, m, d] = selectedDate.split('-').map(Number);
    const localDate = new Date(y, m - 1, d);
    return { 
      year: localDate.getFullYear(), 
      month: localDate.getMonth(), 
      day: localDate.getDate() 
    };
  }, [selectedDate]);

  const isSelected = (d: Date) =>
    d.getFullYear() === selected.year &&
    d.getMonth() === selected.month &&
    d.getDate() === selected.day;

  const isToday = (d: Date) => {
    const t = new Date();
    return (
      d.getFullYear() === t.getFullYear() &&
      d.getMonth() === t.getMonth() &&
      d.getDate() === t.getDate()
    );
  };

  const isFutureDate = (d: Date) => {
    const today = new Date();
    const dDay = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    return dDay > todayDay;
  };

  const today = new Date();
  const isCurrentOrFutureMonth =
    year > today.getFullYear() || (year === today.getFullYear() && month >= today.getMonth());
  const canGoNext = !isCurrentOrFutureMonth;

  const rows = useMemo(() => {
    const allSlots: (Date | null)[] = [
      ...Array.from({ length: padding }, () => null),
      ...days,
    ];
    const result: (Date | null)[][] = [];
    for (let i = 0; i < allSlots.length; i += 7) {
      result.push(allSlots.slice(i, i + 7));
    }
    const lastRow = result[result.length - 1];
    if (lastRow && lastRow.length < 7) {
      lastRow.push(...Array.from({ length: 7 - lastRow.length }, () => null));
    }
    return result;
  }, [padding, days]);

  const handleDayPress = (d: Date) => {
    if (isFutureDate(d)) return;
    // Format date as YYYY-MM-DD using local date components
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    onSelectDate(dateStr);
  };

  return (
    <View style={[styles.container, { backgroundColor: card, borderColor: cardBorder }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goPrev} style={styles.arrow} accessibilityLabel="Previous month">
          <Ionicons name="chevron-back" size={24} color={text} />
        </TouchableOpacity>
        <Text style={[styles.monthTitle, { color: text }]}>{monthLabel}</Text>
        <TouchableOpacity
          onPress={goNext}
          style={styles.arrow}
          accessibilityLabel="Next month"
          disabled={!canGoNext}
        >
          <Ionicons
            name="chevron-forward"
            size={24}
            color={canGoNext ? text : mutedText}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((day) => (
          <View key={day} style={styles.weekdayCell}>
            <Text style={[styles.weekday, { color: mutedText }]}>{day}</Text>
          </View>
        ))}
      </View>

      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((d, colIndex) => {
            if (d === null) {
              return <View key={`pad-${rowIndex}-${colIndex}`} style={styles.cell} />;
            }
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            const selectedDay = isSelected(d);
            const todayFlag = isToday(d);
            const disabled = isFutureDate(d);
            return (
              <TouchableOpacity
                key={dateStr}
                style={[
                  styles.cell,
                  selectedDay && { backgroundColor: primary },
                  todayFlag && !selectedDay && styles.today,
                  todayFlag && !selectedDay && { borderColor: primary },
                  disabled && styles.cellDisabled,
                ]}
                onPress={() => handleDayPress(d)}
                activeOpacity={disabled ? 1 : 0.7}
                disabled={disabled}
                accessibilityLabel={disabled ? `${dateStr} (future)` : `Select ${dateStr}`}
              >
                <Text
                  style={[
                    styles.dayNum,
                    {
                      color: selectedDay ? '#fff' : disabled ? mutedText : text,
                      opacity: disabled ? 0.5 : 1,
                    },
                    todayFlag && !selectedDay && !disabled && styles.todayText,
                  ]}
                >
                  {d.getDate()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  arrow: {
    padding: 8,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekday: {
    fontSize: 12,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    minWidth: 0,
  },
  cellDisabled: {
    opacity: 0.6,
  },
  dayNum: {
    fontSize: 15,
    fontWeight: '600',
  },
  today: {
    borderWidth: 2,
  },
  todayText: {
    fontWeight: '800',
  },
});