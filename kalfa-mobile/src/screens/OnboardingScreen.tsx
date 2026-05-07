import React, { useState } from 'react';
import {
  Alert, Image, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { shopApi } from '../api/shop';
import { Colors, FontSize, Radius, Spacing } from '../theme/colors';
import type { RootStackScreenProps } from '../navigation/types';

const STEPS = [
  { title: 'Dükkanını tanıtalım', subtitle: 'Birkaç bilgi yeter, hızlı kurulum!' },
  { title: 'Çalışanlar', subtitle: 'Kaç kişiyle çalışıyorsun?' },
  { title: 'Sabit Giderler', subtitle: 'Aylık ödemelerin ne kadar?' },
];

export default function OnboardingScreen({ navigation }: RootStackScreenProps<'Onboarding'>) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [city, setCity] = useState('');

  // Step 2
  const [employeeCount, setEmployeeCount] = useState('1');

  // Step 3
  const [rent, setRent] = useState('');
  const [salaries, setSalaries] = useState('');
  const [bills, setBills] = useState('');

  const goNext = () => {
    if (step === 0) {
      if (!shopName.trim()) { Alert.alert('Hata', 'Dükkan adı girin'); return; }
      if (!ownerName.trim()) { Alert.alert('Hata', 'Adınızı girin'); return; }
    }
    setStep((s) => s + 1);
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      await shopApi.completeOnboarding({
        shop_name: shopName.trim(),
        owner_name: ownerName.trim(),
        city: city.trim() || undefined,
        employee_count: parseInt(employeeCount, 10) || 1,
        estimated_total_debt: 0,
        monthly_rent: parseFloat(rent) || 0,
        monthly_salaries: parseFloat(salaries) || 0,
        monthly_bills: parseFloat(bills) || 0,
      });
      navigation.replace('Tabs');
    } catch (e: unknown) {
      // Onboarding zaten tamamlandıysa direkt geç
      navigation.replace('Tabs');
    } finally {
      setSaving(false);
    }
  };

  const Field = ({ label, value, onChangeText, placeholder, keyboardType = 'default' }: any) => (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
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
    <SafeAreaView style={styles.safe}>
      {/* Progress bar */}
      <View style={styles.progressBar}>
        {STEPS.map((_, i) => (
          <View
            key={i}
            style={[styles.progressDot, i <= step && styles.progressDotActive]}
          />
        ))}
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Logo + Başlık */}
          <View style={styles.headerSection}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.stepTitle}>{STEPS[step].title}</Text>
            <Text style={styles.stepSubtitle}>{STEPS[step].subtitle}</Text>
          </View>

          {/* Step 1: Dükkan bilgileri */}
          {step === 0 && (
            <View style={styles.form}>
              <Field label="DÜKKAN ADI" value={shopName} onChangeText={setShopName} placeholder="ör. Akif Oto Yedek Parça" />
              <Field label="ADINIZ" value={ownerName} onChangeText={setOwnerName} placeholder="Ad Soyad" />
              <Field label="ŞEHİR (OPSİYONEL)" value={city} onChangeText={setCity} placeholder="ör. İstanbul" />
            </View>
          )}

          {/* Step 2: Çalışanlar */}
          {step === 1 && (
            <View style={styles.form}>
              <Text style={styles.hint}>Kendin dahil toplam kaç kişisiniz?</Text>
              <View style={styles.counterRow}>
                <TouchableOpacity
                  style={styles.counterBtn}
                  onPress={() => setEmployeeCount(String(Math.max(1, parseInt(employeeCount, 10) - 1)))}
                >
                  <Text style={styles.counterBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.counterValue}>{employeeCount}</Text>
                <TouchableOpacity
                  style={styles.counterBtn}
                  onPress={() => setEmployeeCount(String(parseInt(employeeCount, 10) + 1))}
                >
                  <Text style={styles.counterBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Step 3: Sabit giderler */}
          {step === 2 && (
            <View style={styles.form}>
              <Text style={styles.hint}>Aylık düzenli ödemelerin varsa gir. Boş bırakabilirsin.</Text>
              <Field label="KİRA (₺)" value={rent} onChangeText={setRent} placeholder="0" keyboardType="decimal-pad" />
              <Field label="MAAŞ TOPLAMI (₺)" value={salaries} onChangeText={setSalaries} placeholder="0" keyboardType="decimal-pad" />
              <Field label="FATURALAR (₺)" value={bills} onChangeText={setBills} placeholder="0" keyboardType="decimal-pad" />
            </View>
          )}

          {/* Butonlar */}
          <View style={styles.btnRow}>
            {step > 0 && (
              <TouchableOpacity style={styles.backBtn} onPress={() => setStep((s) => s - 1)}>
                <Text style={styles.backBtnText}>Geri</Text>
              </TouchableOpacity>
            )}
            {step < STEPS.length - 1 ? (
              <TouchableOpacity style={[styles.nextBtn, step > 0 && { flex: 1 }]} onPress={goNext}>
                <Text style={styles.nextBtnText}>Devam →</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.nextBtn, { flex: 1, backgroundColor: Colors.primaryDark }]}
                onPress={handleFinish}
                disabled={saving}
              >
                <Text style={styles.nextBtnText}>{saving ? 'Kaydediliyor…' : 'Başlayalım'}</Text>
              </TouchableOpacity>
            )}
          </View>

          {step === 2 && (
            <TouchableOpacity onPress={handleFinish} style={styles.skipBtn}>
              <Text style={styles.skipText}>Şimdilik atla</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  progressBar: {
    flexDirection: 'row', gap: 6, paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md, paddingBottom: Spacing.sm,
  },
  progressDot: {
    flex: 1, height: 4, borderRadius: Radius.full,
    backgroundColor: Colors.border,
  },
  progressDotActive: { backgroundColor: Colors.primary },
  scroll: { padding: Spacing.lg, gap: Spacing.xl },
  headerSection: { gap: Spacing.xs, marginTop: Spacing.lg },
  logo: { width: '70%', height: 70, alignSelf: 'center', marginBottom: Spacing.md },
  stepTitle: { fontSize: 26, fontWeight: '700', color: Colors.textPrimary },
  stepSubtitle: { fontSize: FontSize.md, color: Colors.textSecondary },
  form: { gap: Spacing.md },
  hint: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  field: { gap: Spacing.xs },
  fieldLabel: { fontSize: 10, color: Colors.textTertiary, fontWeight: '600', letterSpacing: 0.5 },
  input: {
    borderWidth: 0.5, borderColor: Colors.border, borderRadius: Radius.md,
    padding: Spacing.md, fontSize: FontSize.md, color: Colors.textPrimary,
    backgroundColor: Colors.surface, height: 50,
  },
  counterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xl, marginTop: Spacing.lg },
  counterBtn: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  counterBtnText: { fontSize: 28, color: Colors.primaryDark, fontWeight: '300', lineHeight: 34 },
  counterValue: { fontSize: 48, fontWeight: '700', color: Colors.textPrimary, minWidth: 60, textAlign: 'center' },
  btnRow: { flexDirection: 'row', gap: Spacing.md },
  backBtn: {
    height: 52, paddingHorizontal: Spacing.lg, borderRadius: Radius.md,
    borderWidth: 0.5, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  backBtnText: { fontSize: FontSize.md, color: Colors.textSecondary },
  nextBtn: {
    flex: 1, height: 52, borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  nextBtnText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.white },
  skipBtn: { alignItems: 'center', paddingVertical: Spacing.sm },
  skipText: { fontSize: FontSize.sm, color: Colors.textTertiary },
});
