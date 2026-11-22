import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ModalSheet from '../components/ModalSheet';
import { Colors, FontSize, Radius, Spacing } from '../theme/colors';
import type { RootStackScreenProps } from '../navigation/types';

const OPTIONS = [
  {
    key: 'sale',
    label: 'Satış Yap',
    sub: 'Stoktan düş, gelir kaydet',
    icon: 'cart-outline',
    bg: Colors.successLight,
    color: Colors.successMid,
    screen: 'SaleModal' as const,
  },
  {
    key: 'collection',
    label: 'Tahsilat',
    sub: 'Alacak tahsil et',
    icon: 'cash-outline',
    bg: Colors.successLight,
    color: Colors.successMid,
    screen: 'CollectionModal' as const,
  },
  {
    key: 'other',
    label: 'Diğer Gelir',
    sub: 'Serbest gelir girişi',
    icon: 'add-circle-outline',
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
              <Ionicons name={opt.icon} size={22} color={opt.color} />
            </View>
            <View style={styles.optionText}>
              <Text style={styles.optionLabel}>{opt.label}</Text>
              <Text style={styles.optionSub}>{opt.sub}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
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
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: { flex: 1 },
  optionLabel: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
  optionSub: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
});
