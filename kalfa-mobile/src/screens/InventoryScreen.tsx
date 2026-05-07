import React, { useState, useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { productsApi } from '../api/products';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import StockBadge from '../components/StockBadge';
import { useApi, formatCurrency } from '../hooks/useApi';
import { Colors, FontSize, Radius, Spacing } from '../theme/colors';
import type { ProductListItem } from '../types/api';
import type { RootStackScreenProps } from '../navigation/types';

function SearchIcon() {
  return (
    <View style={{ width: 16, height: 16, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 9, height: 9, borderRadius: 5, borderWidth: 1.5, borderColor: Colors.textTertiary }} />
      <View style={{ position: 'absolute', bottom: 0, right: 0, width: 4, height: 1.5, backgroundColor: Colors.textTertiary, borderRadius: 1, transform: [{ rotate: '45deg' }, { translateX: 1 }] }} />
    </View>
  );
}

function PlusIcon() {
  return (
    <View style={{ width: 14, height: 14, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'absolute', width: 14, height: 2, backgroundColor: Colors.white, borderRadius: 1 }} />
      <View style={{ position: 'absolute', width: 2, height: 14, backgroundColor: Colors.white, borderRadius: 1 }} />
    </View>
  );
}

export default function InventoryScreen() {
  const navigation = useNavigation<RootStackScreenProps<'Tabs'>['navigation']>();
  const [search, setSearch] = useState('');

  const { data: products, loading, refetch } = useApi(
    () => productsApi.list({ search: search || undefined }),
    [search]
  );

  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));

  const renderItem = useCallback(({ item }: { item: ProductListItem }) => (
    <Card
      style={styles.productCard}
      onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
    >
      <View style={styles.productRow}>
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productPrice}>{formatCurrency(item.sale_price)}</Text>
        </View>
        <StockBadge
          quantity={item.stock_quantity}
          unit={item.unit}
          isLow={item.is_low_stock}
        />
      </View>
    </Card>
  ), [navigation]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Stok</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddProduct')}
        >
          <PlusIcon />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <SearchIcon />
        <TextInput
          style={styles.searchInput}
          placeholder="Parça ara…"
          placeholderTextColor={Colors.textTertiary}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <View style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>×</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {loading && !products ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={products ?? []}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refetch} tintColor={Colors.primary} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="cube-outline"
              title="Ürün bulunamadı"
              subtitle={search ? 'Farklı bir arama deneyin' : 'Sağ üstten ürün ekleyin'}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

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

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 0.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 44,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  clearBtn: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.textTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText: {
    fontSize: 13,
    color: Colors.white,
    lineHeight: 18,
    textAlign: 'center',
  },

  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxxl },
  productCard: { paddingVertical: Spacing.md },
  productRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  productInfo: { flex: 1, marginRight: Spacing.sm },
  productName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary, marginBottom: 2 },
  productPrice: { fontSize: FontSize.sm, color: Colors.textSecondary },
});
