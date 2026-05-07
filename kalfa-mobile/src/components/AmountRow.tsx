import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { Colors, FontSize, Radius, Spacing } from '../theme/colors';
import { formatCurrency } from '../hooks/useApi';

interface AmountRowProps {
  label: string;
  amount: number;
  direction: 'income' | 'expense';
  style?: ViewStyle;
}

export default function AmountRow({ label, amount, direction, style }: AmountRowProps) {
  const isIncome = direction === 'income';
  return (
    <View style={[styles.row, isIncome ? styles.incomeRow : styles.expenseRow, style]}>
      <Text style={[styles.label, isIncome ? styles.incomeText : styles.expenseText]}>
        {label}
      </Text>
      <Text style={[styles.amount, isIncome ? styles.incomeText : styles.expenseText]}>
        {isIncome ? '+' : '−'}{formatCurrency(amount)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.sm,
    marginBottom: Spacing.xs,
  },
  incomeRow: { backgroundColor: Colors.primaryLight },
  expenseRow: { backgroundColor: Colors.dangerLight },
  label: { fontSize: FontSize.sm, flex: 1 },
  amount: { fontSize: FontSize.sm, fontWeight: '600' },
  incomeText: { color: Colors.primaryMid },
  expenseText: { color: Colors.dangerMid },
});
