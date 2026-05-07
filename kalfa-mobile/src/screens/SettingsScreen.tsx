import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { shopApi } from '../api/shop';
import Card from '../components/Card';
import SectionLabel from '../components/SectionLabel';
import { useApi } from '../hooks/useApi';
import { Colors, FontSize, Radius, Spacing } from '../theme/colors';
import type { RootStackScreenProps } from '../navigation/types';

export default function SettingsScreen({ navigation }: RootStackScreenProps<'Settings'>) {
  const { data: profile, loading, refetch } = useApi(() => shopApi.get(), []);
  const { data: employees, refetch: refetchEmp } = useApi(() => shopApi.listEmployees(), []);

  const [editing, setEditing] = useState(false);
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [city, setCity] = useState('');
  const [saving, setSaving] = useState(false);

  // Yeni çalışan formu
  const [showEmpForm, setShowEmpForm] = useState(false);
  const [empName, setEmpName] = useState('');
  const [empRole, setEmpRole] = useState('Çırak');
  const [empSalary, setEmpSalary] = useState('');

  const startEdit = () => {
    setShopName(profile?.shop_name ?? '');
    setOwnerName(profile?.owner_name ?? '');
    setCity(profile?.city ?? '');
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await shopApi.update({ shop_name: shopName, owner_name: ownerName, city: city || undefined });
      refetch();
      setEditing(false);
    } catch (e: unknown) {
      Alert.alert('Hata', e instanceof Error ? e.message : 'Kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  const handleAddEmployee = async () => {
    if (!empName.trim()) { Alert.alert('Hata', 'Ad girin'); return; }
    try {
      await shopApi.createEmployee({
        name: empName.trim(),
        role: empRole.trim() || 'Çırak',
        salary: parseFloat(empSalary) || 0,
      });
      setEmpName(''); setEmpRole('Çırak'); setEmpSalary('');
      setShowEmpForm(false);
      refetchEmp();
    } catch (e: unknown) {
      Alert.alert('Hata', e instanceof Error ? e.message : 'Kaydedilemedi');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator color={Colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ayarlar</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Dükkan Bilgileri */}
        <SectionLabel label="Dükkan Bilgileri" />
        <Card>
          {editing ? (
            <View style={styles.editForm}>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>DÜKKAN ADI</Text>
                <TextInput style={styles.input} value={shopName} onChangeText={setShopName} />
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>ESNAF ADI</Text>
                <TextInput style={styles.input} value={ownerName} onChangeText={setOwnerName} />
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>ŞEHİR</Text>
                <TextInput style={styles.input} value={city} onChangeText={setCity} />
              </View>
              <View style={styles.editBtns}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditing(false)}>
                  <Text style={styles.cancelText}>İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                  <Text style={styles.saveBtnText}>{saving ? '…' : 'Kaydet'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View>
              <InfoRow label="Dükkan" value={profile?.shop_name ?? '—'} />
              <InfoRow label="Esnaf" value={profile?.owner_name ?? '—'} />
              <InfoRow label="Şehir" value={profile?.city ?? '—'} />
              <TouchableOpacity style={styles.editBtn} onPress={startEdit}>
                <Text style={styles.editBtnText}>Düzenle</Text>
              </TouchableOpacity>
            </View>
          )}
        </Card>

        {/* Çalışanlar */}
        <SectionLabel
          label="Çalışanlar"
          actionLabel="+ Ekle"
          onAction={() => setShowEmpForm((v) => !v)}
        />

        {showEmpForm && (
          <Card style={styles.empForm}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>AD SOYAD</Text>
              <TextInput style={styles.input} value={empName} onChangeText={setEmpName} placeholder="ör. Ahmet Yılmaz" placeholderTextColor={Colors.textTertiary} />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>UNVAN</Text>
              <TextInput style={styles.input} value={empRole} onChangeText={setEmpRole} placeholder="Çırak" placeholderTextColor={Colors.textTertiary} />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>MAAŞ (₺)</Text>
              <TextInput style={styles.input} value={empSalary} onChangeText={setEmpSalary} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={Colors.textTertiary} />
            </View>
            <TouchableOpacity style={styles.saveBtn} onPress={handleAddEmployee}>
              <Text style={styles.saveBtnText}>Çalışan Ekle</Text>
            </TouchableOpacity>
          </Card>
        )}

        {(employees ?? []).length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>Henüz çalışan eklenmedi</Text>
          </Card>
        ) : (
          <Card>
            {(employees ?? []).map((emp, i) => (
              <View
                key={emp.id}
                style={[styles.empRow, i < (employees ?? []).length - 1 && styles.empBorder]}
              >
                <View style={styles.empAvatar}>
                  <Text style={styles.empAvatarText}>{emp.name[0].toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.empName}>{emp.name}</Text>
                  <Text style={styles.empRole}>{emp.role}</Text>
                </View>
                {emp.salary > 0 && (
                  <Text style={styles.empSalary}>{emp.salary.toLocaleString('tr-TR')} ₺</Text>
                )}
              </View>
            ))}
          </Card>
        )}

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.surface, borderBottomWidth: 0.5, borderBottomColor: Colors.border,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 28, color: Colors.textPrimary, lineHeight: 32 },
  headerTitle: { fontSize: FontSize.lg, fontWeight: '600', color: Colors.textPrimary },
  scroll: { padding: Spacing.lg, gap: Spacing.sm },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: Spacing.sm, borderBottomWidth: 0.5, borderBottomColor: Colors.border,
  },
  infoLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  infoValue: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary },
  editBtn: { marginTop: Spacing.md, alignSelf: 'flex-end' },
  editBtnText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '500' },
  editForm: { gap: Spacing.md },
  field: { gap: Spacing.xs },
  fieldLabel: { fontSize: 10, color: Colors.textTertiary, fontWeight: '600', letterSpacing: 0.5 },
  input: {
    borderWidth: 0.5, borderColor: Colors.border, borderRadius: Radius.md,
    padding: Spacing.md, fontSize: FontSize.md, color: Colors.textPrimary,
    backgroundColor: Colors.surface, height: 46,
  },
  editBtns: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm },
  cancelBtn: {
    flex: 1, height: 44, borderRadius: Radius.md, borderWidth: 0.5, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  cancelText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  saveBtn: {
    flex: 1, height: 44, borderRadius: Radius.md, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  saveBtnText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.white },
  empForm: { gap: Spacing.md },
  empRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm },
  empBorder: { borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  empAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  empAvatarText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.primaryMid },
  empName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
  empRole: { fontSize: FontSize.xs, color: Colors.textTertiary },
  empSalary: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.primary },
  emptyText: { fontSize: FontSize.sm, color: Colors.textTertiary, textAlign: 'center', paddingVertical: Spacing.md },
});
