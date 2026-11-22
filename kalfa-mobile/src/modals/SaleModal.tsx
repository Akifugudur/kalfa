import React, { useState } from 'react';
import {
  Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { productsApi } from '../api/products';
import { transactionsApi } from '../api/transactions';
import { shopApi } from '../api/shop';
import { createAndShareInvoice } from '../utils/invoice';
import ModalSheet from '../components/ModalSheet';
import StockBadge from '../components/StockBadge';
import { useDebouncedValue, usePagedList } from '../hooks/usePagedList';
import { Colors, FontSize, Radius, Spacing } from '../theme/colors';
import type { PaymentMethod, ProductListItem } from '../types/api';
import type { RootStackScreenProps } from '../navigation/types';

type Step = 'pick' | 'enter' | 'done';

export default function SaleModal({ navigation }: RootStackScreenProps<'SaleModal'>) {
  const [step, setStep] = useState<Step>('pick');
  const [selected, setSelected] = useState<ProductListItem | null>(null);
  const [qty, setQty] = useState('1');
  const [price, setPrice] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [customer, setCustomer] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [lastSale, setLastSale] = useState<{
    qty: number; price: number; method: PaymentMethod; customer: string;
  } | null>(null);

  const query = useDebouncedValue(search.trim());
  const { items: products, loadMore } = usePagedList(
    (skip, limit) => productsApi.list({ search: query || undefined, skip, limit }),
    [query]
  );

  const handleSave = async () => {
    if (!selected) return;
    const q = parseInt(qty, 10);
    const p = parseFloat(price);
    if (!q || q <= 0) { Alert.alert('Hata', 'Geçerli bir miktar girin'); return; }
    if (!p || p <= 0) { Alert.alert('Hata', 'Geçerli bir fiyat girin'); return; }
    const c = customer.trim();
    if (method === 'credit' && !c) { Alert.alert('Hata', 'Veresiye için müşteri adı girin'); return; }
    setSaving(true);
    try {
      await transactionsApi.sale({
        product_id: selected.id, quantity: q, sale_price: p,
        payment_method: method, customer_name: c || undefined,
      });
      setLastSale({ qty: q, price: p, method, customer: c });
      setStep('done');
    } catch (e: unknown) {
      Alert.alert('Hata', e instanceof Error ? e.message : 'İşlem başarısız');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateInvoice = async () => {
    if (!selected || !lastSale) return;
    try {
      const profile = await shopApi.get();
      await createAndShareInvoice({
        shopName: profile?.shop_name ?? 'Dükkan',
        ownerName: profile?.owner_name ?? '',
        city: profile?.city ?? undefined,
        productName: selected.name,
        quantity: lastSale.qty,
        unitPrice: lastSale.price,
        total: lastSale.qty * lastSale.price,
        date: new Date().toLocaleDateString('tr-TR'),
        invoiceNo: 'KLF-' + Date.now().toString().slice(-6),
      });
    } catch (e: unknown) {
      Alert.alert('Hata', e instanceof Error ? e.message : 'Fatura oluşturulamadı');
    }
  };

  if (step === 'done' && selected && lastSale) {
    return (
      <ModalSheet title="Satış Tamamlandı" onClose={() => navigation.goBack()}>
        <View style={styles.doneBox}>
          <View style={styles.doneCheckCircle}>
            <View style={styles.doneBar1} />
            <View style={styles.doneBar2} />
          </View>
          <Text style={styles.doneName}>{selected.name}</Text>
          <Text style={styles.doneAmount}>
            {lastSale.qty} adet x {lastSale.price.toLocaleString('tr-TR')} TL
          </Text>
          <Text style={styles.doneTotal}>
            Toplam: {(lastSale.qty * lastSale.price).toLocaleString('tr-TR')} TL
          </Text>
          <Text style={styles.doneAmount}>
            {lastSale.method === 'credit'
              ? `Veresiye — ${lastSale.customer} hesabına borç yazıldı`
              : lastSale.customer ? `Nakit — ${lastSale.customer}` : 'Nakit'}
          </Text>
        </View>
        <TouchableOpacity style={styles.invoiceBtn} onPress={handleCreateInvoice}>
          <Text style={styles.invoiceBtnText}>Fatura Oluştur ve Paylaş</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.closeBtnText}>Kapat</Text>
        </TouchableOpacity>
      </ModalSheet>
    );
  }

  if (step === 'enter' && selected) {
    return (
      <ModalSheet title="Satış Detayı" onClose={() => navigation.goBack()}>
        <TouchableOpacity onPress={() => setStep('pick')} style={styles.backRow}>
          <Text style={styles.backChevron}>{'<'}</Text>
          <Text style={styles.backText}>Ürünü değiştir</Text>
        </TouchableOpacity>
        <View style={styles.selectedProduct}>
          <Text style={styles.selectedName}>{selected.name}</Text>
          <StockBadge quantity={selected.stock_quantity} unit={selected.unit} isLow={selected.is_low_stock} />
        </View>
        <Text style={styles.fieldLabel}>MİKTAR</Text>
        <TextInput
          style={styles.input} value={qty} onChangeText={setQty}
          keyboardType="numeric" placeholder="1" placeholderTextColor={Colors.textTertiary}
        />
        <Text style={styles.fieldLabel}>SATIŞ FİYATI (TL)</Text>
        <TextInput
          style={styles.input} value={price} onChangeText={setPrice}
          keyboardType="decimal-pad" placeholder={String(selected.sale_price)}
          placeholderTextColor={Colors.textTertiary}
        />
        <Text style={styles.fieldLabel}>ÖDEME</Text>
        <View style={styles.methodRow}>
          {(['cash', 'credit'] as const).map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.methodBtn, method === m && styles.methodBtnActive]}
              onPress={() => setMethod(m)}
            >
              <Text style={[styles.methodText, method === m && styles.methodTextActive]}>
                {m === 'cash' ? 'Nakit' : 'Veresiye'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.fieldLabel}>
          {method === 'credit' ? 'MÜŞTERİ (ZORUNLU)' : 'MÜŞTERİ (İSTEĞE BAĞLI)'}
        </Text>
        <TextInput
          style={styles.input} value={customer} onChangeText={setCustomer}
          placeholder="or. Tamirci Huseyin" placeholderTextColor={Colors.textTertiary}
          autoCapitalize="words"
        />
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          <Text style={styles.saveBtnText}>{saving ? 'Kaydediliyor...' : 'Satışı Kaydet'}</Text>
        </TouchableOpacity>
      </ModalSheet>
    );
  }

  return (
    <ModalSheet title="Satış Yap" onClose={() => navigation.goBack()}>
      <View style={styles.searchRow}>
        <View style={styles.searchIconWrap}>
          <View style={styles.searchCircle} />
        </View>
        <TextInput
          style={styles.searchInput} value={search} onChangeText={setSearch}
          placeholder="Ürün ara..." placeholderTextColor={Colors.textTertiary}
        />
      </View>
      <FlatList
        data={products}
        keyExtractor={(i) => i.id}
        style={{ maxHeight: 360 }}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.productRow}
            onPress={() => {
              setSelected(item);
              setPrice(String(item.sale_price));
              setStep('enter');
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.productName}>{item.name}</Text>
            </View>
            <StockBadge quantity={item.stock_quantity} unit={item.unit} isLow={item.is_low_stock} />
            <Text style={[styles.backChevron, { marginLeft: 6 }]}>{'>'}</Text>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 0.5, backgroundColor: Colors.border }} />}
      />
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    borderWidth: 0.5, borderColor: Colors.border, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, height: 44, marginBottom: Spacing.md,
    backgroundColor: Colors.surface,
  },
  searchIconWrap: { width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  searchCircle: { width: 9, height: 9, borderRadius: 5, borderWidth: 1.5, borderColor: Colors.textTertiary },
  searchInput: { flex: 1, fontSize: FontSize.md, color: Colors.textPrimary },
  productRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, paddingHorizontal: Spacing.sm,
  },
  productName: { fontSize: FontSize.md, fontWeight: '500', color: Colors.textPrimary },
  backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  backChevron: { fontSize: 18, color: Colors.accent, fontWeight: '500' },
  backText: { fontSize: FontSize.sm, color: Colors.accent, marginLeft: 4 },
  selectedProduct: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.primaryLight, borderRadius: Radius.md, padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  selectedName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.primaryDark },
  fieldLabel: {
    fontSize: 10, color: Colors.textTertiary, fontWeight: '600',
    letterSpacing: 0.5, marginBottom: Spacing.xs, marginTop: Spacing.md,
  },
  input: {
    borderWidth: 0.5, borderColor: Colors.border, borderRadius: Radius.md,
    padding: Spacing.md, fontSize: FontSize.md, color: Colors.textPrimary,
    backgroundColor: Colors.surface, height: 48,
  },
  methodRow: { flexDirection: 'row', gap: Spacing.sm },
  methodBtn: {
    flex: 1, height: 48, borderRadius: Radius.md, borderWidth: 0.5, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface,
  },
  methodBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  methodText: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textSecondary },
  methodTextActive: { color: Colors.white },
  saveBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.md, height: 52,
    alignItems: 'center', justifyContent: 'center', marginTop: Spacing.lg,
  },
  saveBtnText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.white },
  doneBox: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.sm },
  doneCheckCircle: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.successLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm,
  },
  doneBar1: {
    position: 'absolute', width: 12, height: 3,
    backgroundColor: Colors.success, borderRadius: 2,
    transform: [{ rotate: '45deg' }, { translateX: -6 }, { translateY: 2 }],
  },
  doneBar2: {
    position: 'absolute', width: 22, height: 3,
    backgroundColor: Colors.success, borderRadius: 2,
    transform: [{ rotate: '-45deg' }, { translateX: 4 }, { translateY: -2 }],
  },
  doneName: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  doneAmount: { fontSize: FontSize.md, color: Colors.textSecondary },
  doneTotal: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.success, marginTop: Spacing.xs },
  invoiceBtn: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.primaryLight, borderRadius: Radius.md, height: 52, marginBottom: Spacing.sm,
  },
  invoiceBtnText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.primaryDark },
  closeBtn: {
    height: 48, borderRadius: Radius.md, borderWidth: 0.5, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md,
  },
  closeBtnText: { fontSize: FontSize.md, color: Colors.textSecondary },
});
