import React from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { analyticsApi } from '../api/analytics';
import Card from '../components/Card';
import SectionLabel from '../components/SectionLabel';
import { useApi, formatCurrency } from '../hooks/useApi';
import { Colors, FontSize, Radius, Spacing } from '../theme/colors';

const CATEGORY_LABELS: Record<string, string> = {
  credit_card: 'Kredi Kartı', food: 'Yemek', rent: 'Kira',
  bills: 'Faturalar', salary: 'Maaş', material: 'Malzeme', other: 'Diğer',
};

const MONTH_NAMES = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran',
  'Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

function BarRow({ label, amount, max, color }: { label: string; amount: number; max: number; color: string }) {
  const pct = max > 0 ? Math.max((amount / max) * 100, 4) : 4;
  return (
    <View style={styles.barRow}>
      <View style={styles.barMeta}>
        <Text style={styles.barLabel} numberOfLines={1}>{label}</Text>
        <Text style={[styles.barAmount, { color }]}>{formatCurrency(amount)}</Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

export default function AnalyticsScreen() {
  const now = new Date();
  const { data, loading, refetch } = useApi(
    () => analyticsApi.dashboard(now.getFullYear(), now.getMonth() + 1),
    []
  );

  if (loading && !data) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  const summary = data?.summary;
  const maxProduct = Math.max(...(data?.top_products.map(p => p.total_revenue) ?? [1]));
  const maxExpense = Math.max(...(data?.expense_by_category.map(e => e.total_amount) ?? [1]));
  const netProfit = summary?.net_profit ?? 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Analiz</Text>
        {summary && (
          <View style={styles.monthBadge}>
            <Text style={styles.monthText}>
              {MONTH_NAMES[summary.month - 1]} {summary.year}
            </Text>
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={Colors.primary} />}
      >
        {/* Net Kar hero */}
        <Card style={[styles.heroCard, { backgroundColor: netProfit >= 0 ? Colors.primary : Colors.danger }]}>
          <Text style={styles.heroLabel}>Net Kar</Text>
          <Text style={styles.heroAmount}>{formatCurrency(netProfit)}</Text>
          <View style={styles.heroStats}>
            <View>
              <Text style={styles.heroStatLabel}>Satışlar</Text>
              <Text style={styles.heroStatValue}>{formatCurrency(summary?.total_sales ?? 0)}</Text>
            </View>
            <View style={styles.heroSep} />
            <View>
              <Text style={styles.heroStatLabel}>Giderler</Text>
              <Text style={styles.heroStatValue}>{formatCurrency(summary?.total_expenses ?? 0)}</Text>
            </View>
            <View style={styles.heroSep} />
            <View>
              <Text style={styles.heroStatLabel}>İşlem</Text>
              <Text style={styles.heroStatValue}>
                {(summary?.sale_count ?? 0) + (summary?.expense_count ?? 0)}
              </Text>
            </View>
          </View>
        </Card>

        {/* En çok satanlar */}
        {(data?.top_products?.length ?? 0) > 0 && (
          <View>
            <SectionLabel label="En Çok Satan Ürünler" />
            <Card>
              {data!.top_products.map((p) => (
                <BarRow
                  key={p.product_id}
                  label={p.product_name}
                  amount={p.total_revenue}
                  max={maxProduct}
                  color={Colors.primary}
                />
              ))}
            </Card>
          </View>
        )}

        {/* Gider dağılımı */}
        {(data?.expense_by_category?.length ?? 0) > 0 && (
          <View>
            <SectionLabel label="Gider Dağılımı" />
            <Card>
              {data!.expense_by_category.map((e) => (
                <BarRow
                  key={e.category}
                  label={CATEGORY_LABELS[e.category] ?? e.category}
                  amount={e.total_amount}
                  max={maxExpense}
                  color={Colors.danger}
                />
              ))}
            </Card>
          </View>
        )}

        {/* Düşük stok */}
        {(data?.low_stock_products?.length ?? 0) > 0 && (
          <View>
            <SectionLabel label="Stok Uyarısı" />
            <Card>
              <View style={styles.lowStockWrap}>
                {data!.low_stock_products.map((p) => (
                  <View
                    key={p.id}
                    style={[
                      styles.lowStockPill,
                      { backgroundColor: p.stock_quantity === 0 ? Colors.dangerLight : Colors.warningLight },
                    ]}
                  >
                    <Text
                      style={[
                        styles.lowStockText,
                        { color: p.stock_quantity === 0 ? Colors.dangerMid : Colors.warning },
                      ]}
                    >
                      {p.name} ({p.stock_quantity} {p.unit})
                    </Text>
                  </View>
                ))}
              </View>
            </Card>
          </View>
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
  monthBadge: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  monthText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '600',
  },

  scroll: { padding: Spacing.lg, gap: Spacing.md },

  heroCard: { gap: Spacing.sm },
  heroLabel: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  heroAmount: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -1,
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    gap: Spacing.md,
  },
  heroSep: { width: 0.5, height: 28, backgroundColor: 'rgba(255,255,255,0.25)' },
  heroStatLabel: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.65)', fontWeight: '500', marginBottom: 2 },
  heroStatValue: { fontSize: FontSize.md, color: Colors.white, fontWeight: '700' },

  barRow: { marginBottom: Spacing.md },
  barMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  barLabel: { fontSize: FontSize.sm, color: Colors.textPrimary, flex: 1, marginRight: Spacing.sm },
  barAmount: { fontSize: FontSize.sm, fontWeight: '700' },
  barTrack: { height: 6, backgroundColor: Colors.surfaceSecondary, borderRadius: Radius.full, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: Radius.full },

  lowStockWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  lowStockPill: { borderRadius: Radius.sm, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs },
  lowStockText: { fontSize: FontSize.xs, fontWeight: '600' },
});
