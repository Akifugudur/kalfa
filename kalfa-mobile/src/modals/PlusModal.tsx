import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ModalSheet from '../components/ModalSheet';
import { Colors, FontSize, Radius, Spacing } from '../theme/colors';
import type { RootStackScreenProps } from '../navigation/types';

const OPTIONS = [
  {
    key: 'sale',
    label: 'Satis Yap',
    sub: 'Stoktan dus, gelir kaydet',
    abbr: 'SAT',
    bg: Colors.primaryLight,
    color: Colors.primaryMid,
    screen: 'SaleModal' as const,
  },
  {
    key: 'collection',
    label: 'Tahsilat',
    sub: 'Alacak tahsil et',
    abbr: 'TAH',
    bg: Colors.primaryLight,
    color: Colors.primaryMid,
    screen: 'CollectionModal' as const,
  },
  {
    key: 'other',
    label: 'Diger Gelir',
    sub: 'Serbest gelir girisi',
    abbr: 'GEL',
    bg: Colors.surfaceSecondary,
    color: Colors.textSecondary,
    screen: 'CollectionModal' as const,
  },
] as const;

export default function PlusModal({ navigation }: RootStackScreenProps<'PlusModal'>) {
  return (
    <ModalSheet title="Para Gir" onClose={() => navigation.goBack()}>
      <View style={styles.options}>
        {OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={styles.option}
            activeOpacity={0.75}
            onPress={() => navigation.navigate(opt.screen as any, {})}
          >
            <View style={[styles.iconWrap, { backgroundColor: opt.bg }]}>
              <Text style={[styles.abbr, { color: opt.color }]}>{opt.abbr}</Text>
            </View>
            <View style={styles.optionText}>
              <Text style={styles.optionLabel}>{opt.label}</Text>
              <Text style={styles.optionSub}>{opt.sub}</Text>
            </View>
            <Text style={styles.chevron}>{'>'}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  options: { gap: Spacing.sm, paddingBottom: Spacing.lg },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  abbr: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  optionText: { flex: 1 },
  optionLabel: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
  optionSub: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  chevron: { fontSize: 18, color: Colors.textTertiary, fontWeight: '300' },
});
