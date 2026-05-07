import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { analyticsApi } from '../api/analytics';
import AmountRow from '../components/AmountRow';
import Card from '../components/Card';
import SectionLabel from '../components/SectionLabel';
import { useApi, formatCurrency } from '../hooks/useApi';
import { Colors, FontSize, Radius, Spacing } from '../theme/colors';
import type { RootStackScreenProps } from '../navigation/types';

function MenuIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 18, height: 14, justifyContent: 'space-between' }}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={{ height: 1.8, backgroundColor: color, borderRadius: 2 }} />
      ))}
    </View>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<RootStackScreenProps<'Tabs'>['navigation']>();
  const { data: stats, loading, refetch } = useApi(() => analyticsApi.home(), []);

  const onRefresh = useCallback(() => { refetch(); }, [refetch]);
  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));

  if (loading && !stats) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  const profit = stats?.this_month_profit ?? 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.wordmark}>Kalfa</Text>
        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => navigation.navigate('Settings')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MenuIcon color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Net Kar — ana kart */}
        <Card style={styles.heroCard}>
          <Text style={styles.heroLabel}>Bu Ay Net Kar</Text>
          <Text style={[styles.heroAmount, { color: profit >= 0 ? Colors.primaryDark : Colors.danger }]}>
            {formatCurrency(profit)}
          </Text>
          <View style={styles.heroRow}>
            <View style={styles.heroStat}>
              <View style={[styles.heroDot, { backgroundColor: Colors.primaryLight }]} />
              <Text style={styles.heroStatLabel}>Gelir</Text>
              <Text style={[styles.heroStatValue, { color: Colors.primaryMid }]}>
                {formatCurrency(stats?.this_month_income ?? 0)}
              </Text>
            </View>
            <View style={styles.heroSep} />
            <View style={styles.heroStat}>
              <View style={[styles.heroDot, { backgroundColor: Colors.dangerLight }]} />
              <Text style={styles.heroStatLabel}>Gider</Text>
              <Text style={[styles.heroStatValue, { color: Colors.dangerMid }]}>
                {formatCurrency(stats?.this_month_expense ?? 0)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Alacak / Borç */}
        <View style={styles.grid2}>
          <Card style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Alacak</Text>
            <Text style={[styles.balanceAmount, { color: Colors.primaryDark }]}>
              {formatCurrency(stats?.total_receivable ?? 0)}
            </Text>
          </Card>
          <Card style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Borç</Text>
            <Text style={[styles.balanceAmount, { color: Colors.dangerDark }]}>
              {formatCurrency(stats?.total_debt ?? 0)}
            </Text>
          </Card>
        </View>

        {/* Düşük stok uyarısı */}
        {(stats?.low_stock_count ?? 0) > 0 && (
          <Card style={styles.warningCard}>
            <View style={styles.warningRow}>
              <View style={styles.warningDot} />
              <Text style={styles.warningText}>
                {stats!.low_stock_count} ürün stok sınırına yaklaştı
              </Text>
            </View>
          </Card>
        )}

        {/* Yaklaşan ödemeler */}
        {(stats?.upcoming_payments?.length ?? 0) > 0 && (
          <View>
            <SectionLabel label="Yaklaşan Ödemeler" />
            <Card>
              <View style={styles.upcomingSection}>
                {stats!.upcoming_payments.map((p) => (
                  <AmountRow
                    key={p.id}
                    label={p.title}
                    amount={p.amount}
                    direction="expense"
                  />
                ))}
              </View>
            </Card>
          </View>
        )}

        {/* Son işlemler */}
        {(stats?.recent_transactions?.length ?? 0) > 0 && (
          <View>
            <SectionLabel label="Son İşlemler" />
            <Card>
              {stats!.recent_transactions.map((t, i) => (
                <View
                  key={t.id}
                  style={[
                    styles.txRow,
                    i < stats!.recent_transactions.length - 1 && styles.txBorder,
                  ]}
                >
                  <View style={[styles.txDot, { backgroundColor: t.is_income ? Colors.primaryLight : Colors.dangerLight }]}>
                    <View style={[styles.txDotInner, { backgroundColor: t.is_income ? Colors.primary : Colors.danger }]} />
                  </View>
                  <Text style={styles.txNote} numberOfLines={1}>
                    {t.note ?? (t.type === 'sale' ? 'Satış' : t.type === 'expense' ? 'Gider' : 'Gelir')}
                  </Text>
                  <Text style={[styles.txAmount, { color: t.is_income ? Colors.primaryMid : Colors.dangerMid }]}>
                    {t.is_income ? '+' : '−'}{formatCurrency(t.amount)}
                  </Text>
                </View>
              ))}
            </Card>
          </View>
        )}

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* FAB */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={[styles.fab, styles.fabIncome]}
          onPress={() => navigation.navigate('PlusModal')}
          activeOpacity={0.85}
        >
          <Text style={styles.fabPlus}>+</Text>
          <Text style={styles.fabLabel}>Para Gir</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.fab, styles.fabExpense]}
          onPress={() => navigation.navigate('MinusModal')}
          activeOpacity={0.85}
        >
          <Text style={styles.fabPlus}>−</Text>
          <Text style={styles.fabLabel}>Para Çık</Text>
        </TouchableOpacity>
      </View>
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
  wordmark: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: { padding: Spacing.lg, gap: Spacing.md },

  heroCard: {
    backgroundColor: Colors.primary,
    gap: Spacing.sm,
  },
  heroLabel: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  heroAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -1,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  heroStat: { flex: 1, gap: 3 },
  heroSep: { width: 0.5, height: 32, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: Spacing.md },
  heroDot: { width: 6, height: 6, borderRadius: 3 },
  heroStatLabel: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.65)', fontWeight: '500' },
  heroStatValue: { fontSize: FontSize.md, fontWeight: '700', color: Colors.white },

  grid2: { flexDirection: 'row', gap: Spacing.sm },
  balanceCard: { flex: 1 },
  balanceLabel: { fontSize: FontSize.xs, color: Colors.textTertiary, fontWeight: '600', letterSpacing: 0.3, marginBottom: 4 },
  balanceAmount: { fontSize: FontSize.lg, fontWeight: '700' },

  warningCard: { backgroundColor: Colors.warningLight, padding: Spacing.md },
  warningRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  warningDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.warning },
  warningText: { fontSize: FontSize.sm, color: Colors.warning, fontWeight: '600' },

  upcomingSection: { gap: 2 },

  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  txBorder: { borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  txDot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  txDotInner: { width: 8, height: 8, borderRadius: 4 },
  txNote: { fontSize: FontSize.sm, color: Colors.textPrimary, flex: 1 },
  txAmount: { fontSize: FontSize.sm, fontWeight: '700' },

  fabContainer: {
    position: 'absolute',
    bottom: 68,
    left: Spacing.lg,
    right: Spacing.lg,
    flexDirection: 'row',
    gap: Spacing.md,
  },
  fab: {
    flex: 1,
    height: 52,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  fabIncome: { backgroundColor: Colors.primary },
  fabExpense: { backgroundColor: Colors.danger },
  fabPlus: { color: Colors.white, fontSize: 22, fontWeight: '700', lineHeight: 26 },
  fabLabel: { color: Colors.white, fontSize: FontSize.md, fontWeight: '600' },
});
