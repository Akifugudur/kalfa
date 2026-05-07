import React, { useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { debtsApi } from '../api/debts';
import { Colors, FontSize, Radius, Spacing } from '../theme/colors';
import type { RootStackScreenProps } from '../navigation/types';

export default function AddDebtScreen({ route, navigation }: RootStackScreenProps<'AddDebt'>) {
  const { direction } = route.params;
  const isReceivable = direction === 'they_owe';

  const [personName, setPersonName] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!personName.trim()) { Alert.alert('Hata', 'Ad girin'); return; }
    if (!amount || parseFloat(amount) <= 0) { Alert.alert('Hata', 'Tutar girin'); return; }
    setSaving(true);
    try {
      await debtsApi.create({
        direction,
        person_name: personName.trim(),
        amount: parseFloat(amount),
        note: note || undefined,
      });
      navigation.goBack();
    } catch (e: unknown) {
      Alert.alert('Hata', e instanceof Error ? e.message : 'Kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isReceivable ? 'Yeni Alacak' : 'Yeni Borç'}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>
              {isReceivable ? 'KİMDEN ALACAKSIN?' : 'KİME BORÇLUSUN?'}
            </Text>
            <TextInput
              style={styles.input} value={personName} onChangeText={setPersonName}
              placeholder="Ad Soyad veya firma adı"
              placeholderTextColor={Colors.textTertiary}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>TUTAR (₺)</Text>
            <TextInput
              style={styles.input} value={amount} onChangeText={setAmount}
              placeholder="0" placeholderTextColor={Colors.textTertiary}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>NOT (OPSİYONEL)</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top', paddingTop: Spacing.md }]}
              value={note} onChangeText={setNote}
              placeholder="Açıklama…" placeholderTextColor={Colors.textTertiary}
              multiline
            />
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: isReceivable ? Colors.primary : Colors.danger }]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveBtnText}>
              {saving ? 'Kaydediliyor…' : isReceivable ? 'Alacak Ekle' : 'Borç Ekle'}
            </Text>
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
  scroll: { padding: Spacing.lg, gap: Spacing.md },
  field: { gap: Spacing.xs },
  fieldLabel: { fontSize: 10, color: Colors.textTertiary, fontWeight: '600', letterSpacing: 0.5 },
  input: {
    borderWidth: 0.5, borderColor: Colors.border, borderRadius: Radius.md,
    padding: Spacing.md, fontSize: FontSize.md, color: Colors.textPrimary,
    backgroundColor: Colors.surface, height: 48,
  },
  saveBtn: {
    borderRadius: Radius.md, height: 52,
    alignItems: 'center', justifyContent: 'center', marginTop: Spacing.md,
  },
  saveBtnText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.white },
});
