import React, { useState } from 'react';
import {
  Alert, StyleSheet, Text, TextInput, TouchableOpacity,
} from 'react-native';
import { transactionsApi } from '../api/transactions';
import ModalSheet from '../components/ModalSheet';
import { Colors, FontSize, Radius, Spacing } from '../theme/colors';
import type { RootStackScreenProps } from '../navigation/types';

export default function CollectionModal({ route, navigation }: RootStackScreenProps<'CollectionModal'>) {
  const [person, setPerson] = useState(route.params?.personName ?? '');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!person.trim()) { Alert.alert('Hata', 'Kişi adı girin'); return; }
    if (!amount || parseFloat(amount) <= 0) { Alert.alert('Hata', 'Tutar girin'); return; }
    setSaving(true);
    try {
      await transactionsApi.collection({
        amount: parseFloat(amount),
        related_person: person.trim(),
        related_debt_id: route.params?.debtId,
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
    <ModalSheet title="Tahsilat" onClose={() => navigation.goBack()}>
      <Text style={styles.fieldLabel}>KİMDEN?</Text>
      <TextInput style={styles.input} value={person} onChangeText={setPerson}
        placeholder="Ad Soyad" placeholderTextColor={Colors.textTertiary} />

      <Text style={styles.fieldLabel}>TUTAR (₺)</Text>
      <TextInput style={styles.input} value={amount} onChangeText={setAmount}
        keyboardType="decimal-pad" placeholder="0"
        placeholderTextColor={Colors.textTertiary} />

      <Text style={styles.fieldLabel}>NOT (OPSİYONEL)</Text>
      <TextInput style={[styles.input, styles.noteInput]} value={note} onChangeText={setNote}
        placeholder="Açıklama…" placeholderTextColor={Colors.textTertiary}
        multiline textAlignVertical="top" />

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
        <Text style={styles.saveBtnText}>{saving ? 'Kaydediliyor…' : 'Tahsilatı Kaydet'}</Text>
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
    backgroundColor: Colors.primary, borderRadius: Radius.md, height: 52,
    alignItems: 'center', justifyContent: 'center', marginTop: Spacing.lg,
  },
  saveBtnText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.white },
});
