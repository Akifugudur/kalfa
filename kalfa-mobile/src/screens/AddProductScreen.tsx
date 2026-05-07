import React, { useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { productsApi } from '../api/products';
import { Colors, FontSize, Radius, Spacing } from '../theme/colors';
import type { RootStackScreenProps } from '../navigation/types';

export default function AddProductScreen({ navigation }: RootStackScreenProps<'AddProduct'>) {
  const [name, setName] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [stock, setStock] = useState('0');
  const [unit, setUnit] = useState('adet');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Hata', 'Ürün adı girin'); return; }
    setSaving(true);
    try {
      await productsApi.create({
        name: name.trim(),
        purchase_price: parseFloat(buyPrice) || 0,
        sale_price: parseFloat(sellPrice) || 0,
        stock_quantity: parseInt(stock, 10) || 0,
        unit,
      });
      navigation.goBack();
    } catch (e: unknown) {
      Alert.alert('Hata', e instanceof Error ? e.message : 'Kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  const Field = ({ label, value, onChangeText, placeholder, keyboardType = 'default' }: any) => (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label.toUpperCase()}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textTertiary}
        keyboardType={keyboardType}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Yeni Ürün</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          <Text style={[styles.saveText, saving && { opacity: 0.5 }]}>Kaydet</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Field label="Ürün Adı" value={name} onChangeText={setName} placeholder="ör. Yağ Filtresi" />
          <Field label="Alış Fiyatı (₺)" value={buyPrice} onChangeText={setBuyPrice} placeholder="0" keyboardType="decimal-pad" />
          <Field label="Satış Fiyatı (₺)" value={sellPrice} onChangeText={setSellPrice} placeholder="0" keyboardType="decimal-pad" />
          <Field label="Başlangıç Stoku" value={stock} onChangeText={setStock} placeholder="0" keyboardType="numeric" />
          <Field label="Birim" value={unit} onChangeText={setUnit} placeholder="adet" />

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            <Text style={styles.saveBtnText}>{saving ? 'Kaydediliyor…' : 'Ürünü Ekle'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.surface, borderBottomWidth: 0.5, borderBottomColor: Colors.border,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  closeIcon: { fontSize: 18, color: Colors.textPrimary },
  headerTitle: { fontSize: FontSize.lg, fontWeight: '600', color: Colors.textPrimary },
  saveText: { fontSize: FontSize.md, color: Colors.primary, fontWeight: '600' },
  scroll: { padding: Spacing.lg, gap: Spacing.md },
  field: { gap: Spacing.xs },
  fieldLabel: { fontSize: 10, color: Colors.textTertiary, fontWeight: '600', letterSpacing: 0.5 },
  input: {
    borderWidth: 0.5, borderColor: Colors.border, borderRadius: Radius.md,
    padding: Spacing.md, fontSize: FontSize.md, color: Colors.textPrimary,
    backgroundColor: Colors.surface, height: 48,
  },
  saveBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    height: 52, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.md,
  },
  saveBtnText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.white },
});
