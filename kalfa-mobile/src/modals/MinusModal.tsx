import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ModalSheet from '../components/ModalSheet';
import { Colors, FontSize, Radius, Spacing } from '../theme/colors';
import type { ExpenseCategory } from '../types/api';
import type { RootStackScreenProps } from '../navigation/types';

const CATEGORIES: Array<{
  key: ExpenseCategory;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  bg: string;
}> = [
  { key: 'credit_card', label: 'Kredi Kartı', icon: 'card-outline',  color: Colors.dangerMid,     bg: Colors.dangerLight },
  { key: 'food',        label: 'Yemek',        icon: 'restaurant-outline',  color: Colors.warning,        bg: Colors.warningLight },
  { key: 'rent',        label: 'Kira',          icon: 'home-outline',  color: Colors.dangerMid,     bg: Colors.dangerLight },
  { key: 'bills',       label: 'Faturalar',     icon: 'flash-outline',  color: Colors.dangerMid,     bg: Colors.dangerLight },
  { key: 'salary',      label: 'Maaş',          icon: 'people-outline',  color: Colors.primaryMid,    bg: Colors.primaryLight },
  { key: 'material',    label: 'Malzeme',       icon: 'construct-outline',  color: Colors.primaryMid,    bg: Colors.primaryLight },
  { key: 'other',       label: 'Diğer',         icon: 'ellipsis-horizontal',  color: Colors.textSecondary, bg: Colors.surfaceSecondary },
];

export default function MinusModal({ navigation }: RootStackScreenProps<'MinusModal'>) {
  return (
    <ModalSheet title="Para Çık" onClose={() => navigation.goBack()}>
      <View style={styles.grid}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={styles.catBtn}
            activeOpacity={0.75}
            onPress={() => navigation.replace('ExpenseModal', { category: cat.key })}
          >
            <View style={[styles.catIcon, { backgroundColor: cat.bg }]}>
              <Ionicons name={cat.icon} size={22} color={cat.color} />
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
    justifyContent: 'space-between',
    rowGap: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  catBtn: {
    width: '48.5%',
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
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
  catLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
});
