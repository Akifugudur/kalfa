import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { productsApi } from '../api/products';

import { shopApi } from '../api/shop';
import { createAndShareInvoice } from '../utils/invoice';
import Card from '../components/Card';
import { useApi, formatCurrency } from '../hooks/useApi';
import { Colors, FontSize, Radius, Spacing } from '../theme/colors';
import type { RootStackScreenProps } from '../navigation/types';

export default function ProductDetailScreen({ route, navigation }: RootStackScreenProps<'ProductDetail'>) {
  const { productId } = route.params;
  const { data: product, loading, refetch } = useApi(() => productsApi.get(productId), [productId]);
  const [selling, setSelling] = useState(false);
  const [sellQty, setSellQty] = useState('1');
  const [sellPrice, setSellPrice] = useState('');
  const [addingStock, setAddingStock] = useState(false);
  const [addQty, setAddQty] = useState('1');
  const [lastSale, setLastSale] = useState<{ qty: number; price: number } | null>(null);

  const handleAddStock = async () => {
    const qty = parseInt(addQty, 10);
    if (!qty || qty <= 0) { Alert.alert('Hata', 'Geçerli bir miktar girin'); return; }
    try {
      await productsApi.addStock(productId, { quantity: qty });
      setAddingStock(false);
      setAddQty('1');
      refetch();
      Alert.alert('Tamam', `${qty} adet stok eklendi`);
    } catch (e: unknown) {
      Alert.alert('Hata', e instanceof Error ? e.message : 'İşlem başarısız');
    }
  };

  const handleCreateInvoice = async (qty: number, price: number) => {
    if (!product) return;
    try {
      const profile = await shopApi.get();
      await createAndShareInvoice({
        shopName: profile?.shop_name ?? 'Dükkan',
        ownerName: profile?.owner_name ?? '',
        city: profile?.city ?? undefined,
        productName: product.name,
        quantity: qty,
        unitPrice: price,
        total: qty * price,
        date: new Date().toLocaleDateString('tr-TR'),
        invoiceNo: `KLF-${Date.now().toString().slice(-6)}`,
      });
    } catch (e: unknown) {
      Alert.alert('Hata', e instanceof Error ? e.message : 'Fatura oluşturulamadı');
    }
  };

  const handleSell = async () => {
    const qty = parseInt(sellQty, 10);
    const price = parseFloat(sellPrice);
    if (!qty || !price) { Alert.alert('Hata', 'Miktar ve fiyat girin'); return; }
    try {
      await productsApi.sell(productId, { quantity: qty, sale_price: price });
      setSelling(false);
      setLastSale({ qty, price });
      refetch();
      Alert.alert(
        'Satış Kaydedildi',
        `${qty} adet × ${price.toLocaleString('tr-TR')} ₺`,
        [
          { text: 'Fatura Oluştur', onPress: () => handleCreateInvoice(qty, price) },
          { text: 'Kapat', style: 'cancel' },
        ]
      );
    } catch (e: unknown) {
      Alert.alert('Hata', e instanceof Error ? e.message : 'İşlem başarısız');
    }
  };

  if (loading || !product) {
    return <SafeAreaView style={styles.centered}><ActivityIndicator color={Colors.primary} /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{product.name}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Card>
          {[
            ['Stok', `${product.stock_quantity} ${product.unit}`],
            ['Alış Fiyatı', formatCurrency(product.purchase_price)],
            ['Satış Fiyatı', formatCurrency(product.sale_price)],
            ['Kar Marjı', `%${product.profit_margin}`],
          ].map(([label, value]) => (
            <View key={label} style={styles.infoRow}>
              <Text style={styles.infoLabel}>{label}</Text>
              <Text style={styles.infoValue}>{value}</Text>
            </View>
          ))}
        </Card>

        {selling ? (
          <Card style={styles.sellCard}>
            <Text style={styles.sellTitle}>Sat</Text>
            <Text style={styles.inputLabel}>MİKTAR</Text>
            <TextInput style={styles.input} value={sellQty} onChangeText={setSellQty} keyboardType="numeric" placeholder="1" />
            <Text style={styles.inputLabel}>SATIŞ FİYATI (₺)</Text>
            <TextInput style={styles.input} value={sellPrice} onChangeText={setSellPrice}
              keyboardType="decimal-pad" placeholder={String(product.sale_price)} />
            <View style={styles.sellActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setSelling(false)}>
                <Text style={styles.cancelText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleSell}>
                <Text style={styles.confirmText}>Kaydet</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ) : addingStock ? (
          <Card style={styles.sellCard}>
            <Text style={styles.sellTitle}>Stok Ekle</Text>
            <Text style={styles.inputLabel}>EKLENECEK MİKTAR ({product.unit})</Text>
            <TextInput
              style={styles.input}
              value={addQty}
              onChangeText={setAddQty}
              keyboardType="numeric"
              placeholder="1"
              autoFocus
            />
            <View style={styles.sellActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setAddingStock(false)}>
                <Text style={styles.cancelText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleAddStock}>
                <Text style={styles.confirmText}>Ekle</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ) : (
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.actionBtn, styles.sellBtn]} onPress={() => { setSellPrice(String(product.sale_price)); setSelling(true); }}>
              <Text style={styles.actionBtnText}>Sattım</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.stockBtn]} onPress={() => setAddingStock(true)}>
              <Text style={[styles.actionBtnText, { color: Colors.textPrimary }]}>Stok Ekle</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: 14,
    backgroundColor: Colors.surface, borderBottomWidth: 0.5, borderBottomColor: Colors.border,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surfaceSecondary, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 22, color: Colors.textPrimary, lineHeight: 26, marginTop: -1 },
  headerTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary, flex: 1, textAlign: 'center', letterSpacing: -0.2 },
  scroll: { padding: Spacing.lg, gap: Spacing.md },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  infoLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  infoValue: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary },
  actions: { flexDirection: 'row', gap: Spacing.md },
  actionBtn: { flex: 1, height: 50, borderRadius: Radius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  sellBtn: { backgroundColor: Colors.primary },
  stockBtn: { backgroundColor: Colors.surface, borderWidth: 0.5, borderColor: Colors.border },
  actionBtnText: { fontSize: FontSize.md, fontWeight: '600', color: Colors.white },
  sellCard: { gap: Spacing.sm },
  sellTitle: { fontSize: FontSize.lg, fontWeight: '600', color: Colors.textPrimary, marginBottom: Spacing.sm },
  inputLabel: { fontSize: 10, color: Colors.textTertiary, fontWeight: '600', letterSpacing: 0.5 },
  input: { borderWidth: 0.5, borderColor: Colors.border, borderRadius: Radius.sm, padding: Spacing.md, fontSize: FontSize.md, color: Colors.textPrimary, backgroundColor: Colors.surface },
  sellActions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm },
  cancelBtn: { flex: 1, height: 46, borderRadius: Radius.md, borderWidth: 0.5, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: FontSize.md, color: Colors.textSecondary },
  confirmBtn: { flex: 1, height: 46, borderRadius: Radius.md, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  confirmText: { fontSize: FontSize.md, fontWeight: '600', color: Colors.white },
});
