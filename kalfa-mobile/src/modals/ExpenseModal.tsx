import React, { useState } from 'react';
import {
  Alert, StyleSheet, Text, TextInput, TouchableOpacity,
} from 'react-native';
import { transactionsApi } from '../api/transactions';
import ModalSheet from '../components/ModalSheet';
import { Colors, FontSize, Radius, Spacing } from '../theme/colors';
import type { ExpenseCategory } from '../types/api';
import type { RootStackScreenProps } from '../navigation/types';

const LABELS: Record<ExpenseCategory, string> = {
  credit_card: 'Kredi Kartı', food: 'Yemek', rent: 'Kira',
  bills: 'Faturalar', salary: 'Maaş', material: 'Malzeme', other: 'Diğer',
};

export default function ExpenseModal({ route, navigation }: RootStackScreenProps<'ExpenseModal'>) {
  const cat = (route.params?.category ?? 'other') as ExpenseCategory;
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!amount || parseFloat(amount) <= 0) { Alert.alert('Hata', 'Tutar girin'); return; }
    setSaving(true);
    try {
      await transactionsApi.expense({
        amount: parseFloat(amount),
        category: cat,
        note: note || undefined,
      });
      navigation.goBack();
    } catch (e: unknown) {
      Alert.alert('Hata', e instanceof Error ? e.message : 'İşlem başarısız');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalSheet title={LABELS[cat]} onClose={() => navigation.goBack()}>
      <Text style={styles.fieldLabel}>TUTAR (₺)</Text>
      <TextInput
        style={styles.input} value={amount} onChangeText={setAmount}
        keyboardType="decimal-pad" placeholder="0"
        placeholderTextColor={Colors.textTertiary}
        autoFocus
      />

      <Text style={styles.fieldLabel}>NOT (OPSİYONEL)</Text>
      <TextInput
        style={[styles.input, styles.noteInput]} value={note} onChangeText={setNote}
        placeholder="Açıklama…" placeholderTextColor={Colors.textTertiary}
        multiline textAlignVertical="top"
      />

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
        <Text style={styles.saveBtnText}>{saving ? 'Kaydediliyor…' : 'Gideri Kaydet'}</Text>
      </TouchableOpacity>
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  fieldLabel: { fontSize: 10, color: Colors.textTertiary, fontWeight: '600', letterSpacing: 0.5, marginBottom: Spacing.xs, marginTop: Spacing.md },
  input: {
    borderWidth: 0.5, borderColor: Colors.border, borderRadius: Radius.md,
    padding: Spacing.md, fontSize: FontSize.md, color: Colors.textPrimary,
    backgroundColor: Colors.surface, height: 48,
  },
  noteInput: { height: 80, paddingTop: Spacing.md },
  saveBtn: {
    backgroundColor: Colors.danger, borderRadius: Radius.md, height: 52,
    alignItems: 'center', justifyContent: 'center', marginTop: Spacing.lg,
  },
  saveBtnText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.white },
});
