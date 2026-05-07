import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, FontSize, Radius, Spacing } from '../theme/colors';

interface EmptyStateProps {
  icon?: string;
  title: string;
  subtitle?: string;
}

function EmptyIcon() {
  return (
    <View style={styles.iconWrap}>
      <View style={styles.iconCircle}>
        <View style={styles.iconLine} />
        <View style={[styles.iconLine, { width: 18 }]} />
        <View style={[styles.iconLine, { width: 12 }]} />
      </View>
    </View>
  );
}

export default function EmptyState({ title, subtitle }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <EmptyIcon />
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl,
    gap: Spacing.sm,
  },
  iconWrap: { marginBottom: Spacing.sm },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  iconLine: {
    width: 22,
    height: 2,
    backgroundColor: Colors.textTertiary,
    borderRadius: Radius.full,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
});
