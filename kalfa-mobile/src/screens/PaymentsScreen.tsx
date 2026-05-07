import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { debtsApi } from '../api/debts';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import SectionLabel from '../components/SectionLabel';
import { useApi, formatCurrency, formatDate } from '../hooks/useApi';
import { Colors, FontSize, Radius, Spacing } from '../theme/colors';
import type { Debt } from '../types/api';
import type { RootStackScreenProps } from '../navigation/types';

function DebtCard({ debt, onPay }: { debt: Debt; onPay: () => void }) {
  const isReceivable = debt.direction === 'they_owe';
  const initials = debt.person_name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <Card style={styles.debtCard}>
      <View style={styles.debtRow}>
        <View
          style={[
            styles.avatar,
            { backgroundColor: isReceivable ? Colors.primaryLight : Colors.dangerLight },
          ]}
        >
          <Text
            style={[
              styles.avatarText,
              { color: isReceivable ? Colors.primaryMid : Colors.dangerMid },
            ]}
          >
            {initials}
          </Text>
        </View>
        <View style={styles.debtInfo}>
          <Text style={styles.debtName}>{debt.person_name}</Text>
          {debt.due_date && (
            <Text style={styles.debtSub}>{formatDate(debt.due_date)}</Text>
          )}
        </View>
        <View style={styles.debtRight}>
          <Text
            style={[
              styles.debtAmount,
              { color: isReceivable ? Colors.primaryMid : Colors.dangerMid },
            ]}
          >
            {formatCurrency(debt.remaining_amount)}
          </Text>
          {isReceivable && (
            <TouchableOpacity style={styles.collectBtn} onPress={onPay}>
              <Text style={styles.collectBtnText}>Tahsil Et</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Card>
  );
}

export default function PaymentsScreen() {
  const navigation = useNavigation<RootStackScreenProps<'Tabs'>['navigation']>();

  const { data: allDebts, loading, refetch } = useApi(
    () => debtsApi.list({ is_paid: false }),
    []
  );

  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));

  const iOwe = allDebts?.filter((d) => d.direction === 'i_owe') ?? [];
  const theyOwe = allDebts?.filter((d) => d.direction === 'they_owe') ?? [];

  const totalDebt = iOwe.reduce((s, d) => s + d.remaining_amount, 0);
  const totalReceivable = theyOwe.reduce((s, d) => s + d.remaining_amount, 0);

  const handleCollect = useCallback(
    (debt: Debt) => {
      Alert.prompt(
        'Tahsilat',
        `${debt.person_name} — ${formatCurrency(debt.remaining_amount)} alacak`,
        async (input) => {
          const amount = parseFloat(input ?? '');
          if (!isNaN(amount) && amount > 0) {
            try {
              await debtsApi.pay(debt.id, amount);
              refetch();
            } catch (e: unknown) {
              Alert.alert('Hata', e instanceof Error ? e.message : 'İşlem başarısız');
            }
          }
        },
        'plain-text',
        String(debt.remaining_amount),
        'numeric'
      );
    },
    [refetch]
  );

  if (loading && !allDebts) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator color={Colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Ödemeler</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddDebt', { direction: 'i_owe' })}
        >
          <View style={styles.plusH} />
          <View style={styles.plusV} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={Colors.primary} />}
      >
        {/* Özet */}
        <View style={styles.summaryRow}>
          <Card style={[styles.summaryCard, { backgroundColor: Colors.dangerLight }]}>
            <Text style={[styles.summaryLabel, { color: Colors.dangerMid }]}>BORÇ</Text>
            <Text style={[styles.summaryAmount, { color: Colors.dangerDark }]}>
              {formatCurrency(totalDebt)}
            </Text>
          </Card>
          <Card style={[styles.summaryCard, { backgroundColor: Colors.primaryLight }]}>
            <Text style={[styles.summaryLabel, { color: Colors.primaryMid }]}>ALACAK</Text>
            <Text style={[styles.summaryAmount, { color: Colors.primaryDark }]}>
              {formatCurrency(totalReceivable)}
            </Text>
          </Card>
        </View>

        {/* Borçlarım */}
        <SectionLabel
          label="Borçlarım"
          actionLabel="+ Ekle"
          onAction={() => navigation.navigate('AddDebt', { direction: 'i_owe' })}
        />
        {iOwe.length === 0 ? (
          <EmptyState icon="checkmark-circle-outline" title="Borç yok" />
        ) : (
          iOwe.map((d) => (
            <View key={d.id} style={styles.cardGap}>
              <DebtCard debt={d} onPay={() => {}} />
            </View>
          ))
        )}

        {/* Alacaklarım */}
        <SectionLabel
          label="Alacaklarım"
          actionLabel="+ Ekle"
          onAction={() => navigation.navigate('AddDebt', { direction: 'they_owe' })}
        />
        {theyOwe.length === 0 ? (
          <EmptyState icon="cash-outline" title="Alacak yok" />
        ) : (
          theyOwe.map((d) => (
            <View key={d.id} style={styles.cardGap}>
              <DebtCard debt={d} onPay={() => handleCollect(d)} />
            </View>
          ))
        )}

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusH: { position: 'absolute', width: 14, height: 2, backgroundColor: Colors.white, borderRadius: 1 },
  plusV: { position: 'absolute', width: 2, height: 14, backgroundColor: Colors.white, borderRadius: 1 },

  scroll: { padding: Spacing.lg, gap: Spacing.md },

  summaryRow: { flexDirection: 'row', gap: Spacing.sm },
  summaryCard: { flex: 1 },
  summaryLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.6, marginBottom: 4 },
  summaryAmount: { fontSize: FontSize.lg, fontWeight: '700' },

  cardGap: { marginBottom: Spacing.sm },
  debtCard: { paddingVertical: Spacing.md },
  debtRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: FontSize.xs, fontWeight: '700' },
  debtInfo: { flex: 1 },
  debtName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
  debtSub: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 2 },
  debtRight: { alignItems: 'flex-end', gap: 4 },
  debtAmount: { fontSize: FontSize.md, fontWeight: '700' },
  collectBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  collectBtnText: { fontSize: FontSize.xs, color: Colors.white, fontWeight: '600' },
});
