import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Image,
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
import { useApi, formatCurrency, formatDate } from '../hooks/useApi';
import { Colors, FontSize, Radius, Spacing } from '../theme/colors';
import type { RootStackScreenProps } from '../navigation/types';

const MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

const TX_LABELS: Record<string, string> = {
  sale: 'Satış',
  collection: 'Tahsilat',
  expense: 'Gider',
  other_income: 'Gelir',
};

function MenuIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 18, height: 14, justifyContent: 'space-between' }}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={{ height: 2, backgroundColor: color, borderRadius: 2 }} />
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
        <ActivityIndicator color={Colors.accent} size="large" />
      </SafeAreaView>
    );
  }

  const profit = stats?.this_month_profit ?? 0;
  const month = MONTHS[new Date().getMonth()];
  const lowStock = stats?.low_stock_count ?? 0;
  const openTab = (screen: 'Payments' | 'Inventory') => navigation.navigate('Tabs', { screen });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Image
          source={require('../../assets/logo-header.png')}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="Kalfa"
        />
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => navigation.navigate('Settings')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Ayarlar"
        >
          <MenuIcon color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={Colors.accent} />}
      >
        {/* This month */}
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <Text style={styles.heroLabel}>BU AY NET KÂR</Text>
            <View style={styles.monthPill}>
              <Text style={styles.monthPillText}>{month}</Text>
            </View>
          </View>
          <Text style={[styles.heroAmount, profit < 0 && { color: Colors.dangerOnDark }]}>
            {formatCurrency(profit)}
          </Text>
          <View style={styles.heroDivider} />
          <View style={styles.heroRow}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>Gelir</Text>
              <Text style={[styles.heroStatValue, { color: Colors.successOnDark }]}>
                {(stats?.this_month_income ?? 0) > 0 ? '+' : ''}
                {formatCurrency(stats?.this_month_income ?? 0)}
              </Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>Gider</Text>
              <Text style={[styles.heroStatValue, { color: Colors.dangerOnDark }]}>
                {(stats?.this_month_expense ?? 0) > 0 ? '−' : ''}
                {formatCurrency(stats?.this_month_expense ?? 0)}
              </Text>
            </View>
          </View>
        </View>

        {/* Receivables / debts */}
        <View style={styles.grid2}>
          <Card style={styles.balanceCard} onPress={() => openTab('Payments')}>
            <View style={[styles.balanceBar, { backgroundColor: Colors.success }]} />
            <Text style={styles.balanceLabel}>Alacak</Text>
            <Text style={[styles.balanceAmount, { color: Colors.successDark }]}>
              {formatCurrency(stats?.total_receivable ?? 0)}
            </Text>
          </Card>
          <Card style={styles.balanceCard} onPress={() => openTab('Payments')}>
            <View style={[styles.balanceBar, { backgroundColor: Colors.danger }]} />
            <Text style={styles.balanceLabel}>Borç</Text>
            <Text style={[styles.balanceAmount, { color: Colors.dangerDark }]}>
              {formatCurrency(stats?.total_debt ?? 0)}
            </Text>
          </Card>
        </View>

        {/* Low stock */}
        {lowStock > 0 && (
          <TouchableOpacity style={styles.warning} activeOpacity={0.8} onPress={() => openTab('Inventory')}>
            <View style={styles.warningBadge}>
              <Text style={styles.warningBadgeText}>{lowStock}</Text>
            </View>
            <Text style={styles.warningText}>ürün stok sınırına yaklaştı</Text>
            <Text style={styles.warningChevron}>›</Text>
          </TouchableOpacity>
        )}

        {/* Upcoming payments */}
        {(stats?.upcoming_payments?.length ?? 0) > 0 && (
          <View>
            <SectionLabel label="Yaklaşan Ödemeler" />
            <Card>
              <View style={styles.upcomingSection}>
                {stats!.upcoming_payments.map((p) => (
                  <AmountRow key={p.id} label={p.title} amount={p.amount} direction="expense" />
                ))}
              </View>
            </Card>
          </View>
        )}

        {/* Recent transactions */}
        {(stats?.recent_transactions?.length ?? 0) > 0 && (
          <View>
            <SectionLabel label="Son İşlemler" />
            <Card style={styles.txCard}>
              {stats!.recent_transactions.map((t, i) => {
                const kind = TX_LABELS[t.type] ?? 'İşlem';
                const tone = t.is_income
                  ? { bg: Colors.successLight, fg: Colors.successMid }
                  : { bg: Colors.dangerLight, fg: Colors.dangerMid };
                return (
                  <View
                    key={t.id}
                    style={[styles.txRow, i < stats!.recent_transactions.length - 1 && styles.txBorder]}
                  >
                    <View style={[styles.txIcon, { backgroundColor: tone.bg }]}>
                      <Text style={[styles.txIconText, { color: tone.fg }]}>{t.is_income ? '+' : '−'}</Text>
                    </View>
                    <View style={styles.txInfo}>
                      <Text style={styles.txTitle} numberOfLines={1}>{t.note ?? kind}</Text>
                      <Text style={styles.txDate}>
                        {t.note ? `${kind} · ` : ''}{formatDate(t.date)}
                      </Text>
                    </View>
                    <Text style={[styles.txAmount, { color: tone.fg }]}>
                      {t.is_income ? '+' : '−'}{formatCurrency(t.amount)}
                    </Text>
                  </View>
                );
              })}
            </Card>
          </View>
        )}

        <View style={{ height: 88 }} />
      </ScrollView>

      {/* Quick actions */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: Colors.success }]}
          onPress={() => navigation.navigate('PlusModal')}
          activeOpacity={0.85}
        >
          <Text style={styles.fabSign}>+</Text>
          <Text style={styles.fabLabel}>Para Gir</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: Colors.danger }]}
          onPress={() => navigation.navigate('MinusModal')}
          activeOpacity={0.85}
        >
          <Text style={styles.fabSign}>−</Text>
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
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  logo: { width: 108, height: 34 },
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: { padding: Spacing.lg, gap: Spacing.md },

  hero: { backgroundColor: Colors.primary, borderRadius: Radius.lg, padding: Spacing.xl },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroLabel: { fontSize: FontSize.xs, color: Colors.onDarkMuted, fontWeight: '700', letterSpacing: 1 },
  monthPill: {
    borderWidth: 1,
    borderColor: Colors.onDarkBorder,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
  },
  monthPillText: { fontSize: FontSize.xs, color: Colors.onDark, fontWeight: '600' },
  heroAmount: { fontSize: 34, fontWeight: '800', color: Colors.onDark, letterSpacing: -1, marginTop: Spacing.sm },
  heroDivider: { height: 1, backgroundColor: Colors.onDarkBorder, marginVertical: Spacing.lg },
  heroRow: { flexDirection: 'row' },
  heroStat: { flex: 1, gap: 2 },
  heroStatLabel: { fontSize: FontSize.xs, color: Colors.onDarkMuted, fontWeight: '500' },
  heroStatValue: { fontSize: FontSize.lg, fontWeight: '700' },

  grid2: { flexDirection: 'row', gap: Spacing.md },
  balanceCard: { flex: 1, overflow: 'hidden' },
  balanceBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  balanceLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '500', marginBottom: 4 },
  balanceAmount: { fontSize: FontSize.xl, fontWeight: '700', letterSpacing: -0.3 },

  warning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.warningLight,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  warningBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 6,
    backgroundColor: Colors.warning,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningBadgeText: { color: Colors.white, fontSize: FontSize.sm, fontWeight: '700' },
  warningText: { flex: 1, fontSize: FontSize.md, color: Colors.warningDark, fontWeight: '600' },
  warningChevron: { fontSize: 22, color: Colors.warning, lineHeight: 24 },

  upcomingSection: { gap: 2 },

  txCard: { paddingVertical: Spacing.xs },
  txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, gap: Spacing.md },
  txBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  txIcon: { width: 36, height: 36, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  txIconText: { fontSize: 18, fontWeight: '700', lineHeight: 20 },
  txInfo: { flex: 1, gap: 2 },
  txTitle: { fontSize: FontSize.md, color: Colors.textPrimary, fontWeight: '600' },
  txDate: { fontSize: FontSize.xs, color: Colors.textTertiary },
  txAmount: { fontSize: FontSize.md, fontWeight: '700' },

  fabContainer: {
    position: 'absolute',
    bottom: Spacing.lg,
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
    elevation: 4,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
  },
  fabSign: { color: Colors.white, fontSize: 22, fontWeight: '700', lineHeight: 26 },
  fabLabel: { color: Colors.white, fontSize: FontSize.md, fontWeight: '700' },
});
