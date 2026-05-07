import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { Colors, FontSize, Radius, Spacing } from '../theme/colors';

interface StockBadgeProps {
  quantity: number;
  unit: string;
  isLow: boolean;
}

export default function StockBadge({ quantity, unit, isLow }: StockBadgeProps) {
  const outOfStock = quantity === 0;

  const bg = outOfStock
    ? Colors.surfaceSecondary
    : isLow
    ? Colors.warningLight
    : Colors.primaryLight;

  const color = outOfStock
    ? Colors.textTertiary
    : isLow
    ? Colors.warning
    : Colors.primaryMid;

  const label = outOfStock ? 'Tükendi' : `${quantity} ${unit}`;

  return (
    <Text style={[styles.badge, { backgroundColor: bg, color }]}>{label}</Text>
  );
}

const styles = StyleSheet.create({
  badge: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm + 2,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
});
