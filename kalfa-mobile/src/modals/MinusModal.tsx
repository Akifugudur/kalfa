import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ModalSheet from '../components/ModalSheet';
import { Colors, FontSize, Radius, Spacing } from '../theme/colors';
import type { ExpenseCategory } from '../types/api';
import type { RootStackScreenProps } from '../navigation/types';

const CATEGORIES: Array<{
  key: ExpenseCategory;
  label: string;
  abbr: string;
  color: string;
  bg: string;
}> = [
  { key: 'credit_card', label: 'Kredi Karti', abbr: 'KK',  color: Colors.dangerMid,     bg: Colors.dangerLight },
  { key: 'food',        label: 'Yemek',        abbr: 'YM',  color: Colors.warning,        bg: Colors.warningLight },
  { key: 'rent',        label: 'Kira',          abbr: 'KR',  color: Colors.dangerMid,     bg: Colors.dangerLight },
  { key: 'bills',       label: 'Faturalar',     abbr: 'FA',  color: Colors.dangerMid,     bg: Colors.dangerLight },
  { key: 'salary',      label: 'Maas',          abbr: 'MA',  color: Colors.primaryMid,    bg: Colors.primaryLight },
  { key: 'material',    label: 'Malzeme',       abbr: 'ML',  color: Colors.primaryMid,    bg: Colors.primaryLight },
  { key: 'other',       label: 'Diger',         abbr: '...',  color: Colors.textSecondary, bg: Colors.surfaceSecondary },
];

export default function MinusModal({ navigation }: RootStackScreenProps<'MinusModal'>) {
  return (
    <ModalSheet title="Para Cik" onClose={() => navigation.goBack()}>
      <View style={styles.grid}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={styles.catBtn}
            activeOpacity={0.75}
            onPress={() => navigation.replace('ExpenseModal', { category: cat.key })}
          >
            <View style={[styles.catIcon, { backgroundColor: cat.bg }]}>
              <Text style={[styles.catAbbr, { color: cat.color }]}>{cat.abbr}</Text>
            </View>
            <Text style={styles.catLabel}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  catBtn: {
    width: '47%',
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 0.5,
    borderColor: Colors.border,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  catIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catAbbr: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  catLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
});
