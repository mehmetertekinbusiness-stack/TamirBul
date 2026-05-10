import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  StatusBar, SafeAreaView, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSignUp } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import { C } from '../../lib/constants';

type Role = 'customer' | 'mechanic';
type Step = 'form' | 'verify';

export default function SignUpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: string }>();
  const { signUp, setActive, isLoaded } = useSignUp();

  const [role,     setRole]     = useState<Role>((params.role as Role) || 'customer');
  const [fullName, setFullName] = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [code,     setCode]     = useState('');
  const [step,     setStep]     = useState<Step>('form');
  const [loading,  setLoading]  = useState(false);

  // ─── Adım 1: Hesap oluştur ve e-posta doğrulama gönder ────────────────────
  async function handleRegister() {
    if (!isLoaded) return;
    if (!fullName.trim() || !email.trim() || !password) {
      Alert.alert('Eksik bilgi', 'Tüm alanları doldurun.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Şifre kısa', 'Şifre en az 8 karakter olmalı.');
      return;
    }

    setLoading(true);
    try {
      await signUp.create({
        emailAddress: email.trim().toLowerCase(),
        password,
        firstName:    fullName.trim().split(' ')[0],
        lastName:     fullName.trim().split(' ').slice(1).join(' ') || undefined,
      });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setStep('verify');
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || 'Kayıt başarısız.';
      Alert.alert('Hata', msg);
    } finally {
      setLoading(false);
    }
  }

  // ─── Adım 2: E-posta OTP doğrula ve Supabase'e kullanıcı kaydet ───────────
  async function handleVerify() {
    if (!isLoaded) return;
    if (!code.trim()) {
      Alert.alert('Kod gerekli', 'E-postanıza gelen 6 haneli kodu girin.');
      return;
    }

    setLoading(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code: code.trim() });

      if (result.status === 'complete') {
        // Kayıt verisini sakla — Supabase insert'i _layout.tsx yapar (JWT hazır olunca)
        await SecureStore.setItemAsync(`reg_role_${result.createdUserId}`, role);
        await SecureStore.setItemAsync(`reg_name_${result.createdUserId}`, fullName.trim());

        await setActive({ session: result.createdSessionId });
        // _layout.tsx rolü okuyup ilgili panele yönlendirir
      } else {
        Alert.alert('Doğrulama hatası', 'Lütfen tekrar deneyin.');
      }
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || 'Doğrulama başarısız.';
      Alert.alert('Hata', msg);
    } finally {
      setLoading(false);
    }
  }

  // ─── Rol seçim kartları ────────────────────────────────────────────────────
  function RoleCard({ value, icon, title, desc }: { value: Role; icon: string; title: string; desc: string }) {
    const selected = role === value;
    return (
      <TouchableOpacity
        style={[s.roleCard, selected && s.roleCardSelected]}
        onPress={() => setRole(value)}
        activeOpacity={0.8}
      >
        <Text style={s.roleIcon}>{icon}</Text>
        <View style={s.roleInfo}>
          <Text style={[s.roleTitle, selected && s.roleTitleSelected]}>{title}</Text>
          <Text style={s.roleDesc}>{desc}</Text>
        </View>
        <View style={[s.radioOuter, selected && s.radioOuterSelected]}>
          {selected && <View style={s.radioInner} />}
        </View>
      </TouchableOpacity>
    );
  }

  // ─── Doğrulama adımı ──────────────────────────────────────────────────────
  if (step === 'verify') {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
        <KeyboardAvoidingView style={s.kav} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableOpacity style={s.back} onPress={() => setStep('form')}>
            <Text style={s.backText}>← Geri</Text>
          </TouchableOpacity>

          <View style={s.header}>
            <Text style={s.title}>E-postanızı Doğrulayın</Text>
            <Text style={s.subtitle}>
              <Text style={{ color: C.primary }}>{email}</Text>
              {'\n'}adresine 6 haneli kod gönderdik.
            </Text>
          </View>

          <View style={s.form}>
            <View style={s.inputGroup}>
              <Text style={s.label}>Doğrulama Kodu</Text>
              <TextInput
                style={[s.input, s.inputCode]}
                placeholder="000000"
                placeholderTextColor={C.muted}
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />
            </View>

            <TouchableOpacity
              style={[s.btn, loading && s.btnDisabled]}
              onPress={handleVerify}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.btnText}>Hesabı Oluştur</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => signUp?.prepareEmailAddressVerification({ strategy: 'email_code' })}
            >
              <Text style={s.resend}>Kodu tekrar gönder</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ─── Kayıt formu ──────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <KeyboardAvoidingView style={s.kav} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={s.back} onPress={() => router.back()}>
            <Text style={s.backText}>← Geri</Text>
          </TouchableOpacity>

          <View style={s.header}>
            <Text style={s.title}>Hesap Oluştur</Text>
            <Text style={s.subtitle}>TamirBul'a ücretsiz katılın</Text>
          </View>

          <Text style={s.sectionLabel}>Hesap türünü seçin</Text>
          <View style={s.roleGroup}>
            <RoleCard
              value="customer"
              icon="🚗"
              title="Araç Sahibi"
              desc="Tamirci bulun ve iş emrinizi takip edin"
            />
            <RoleCard
              value="mechanic"
              icon="🔧"
              title="Tamirci / Esnaf"
              desc="İşletmenizi yönetin, müşteri alın"
            />
          </View>

          <View style={s.form}>
            <View style={s.inputGroup}>
              <Text style={s.label}>Ad Soyad</Text>
              <TextInput
                style={s.input}
                placeholder="Mehmet Yılmaz"
                placeholderTextColor={C.muted}
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            </View>

            <View style={s.inputGroup}>
              <Text style={s.label}>E-posta</Text>
              <TextInput
                style={s.input}
                placeholder="ornek@eposta.com"
                placeholderTextColor={C.muted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={s.inputGroup}>
              <Text style={s.label}>Şifre</Text>
              <TextInput
                style={s.input}
                placeholder="En az 8 karakter"
                placeholderTextColor={C.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={[s.btn, loading && s.btnDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.btnText}>Devam Et →</Text>
              }
            </TouchableOpacity>
          </View>

          <View style={s.footer}>
            <Text style={s.footerText}>Zaten hesabınız var mı? </Text>
            <TouchableOpacity onPress={() => router.replace('/(auth)/sign-in')}>
              <Text style={s.footerLink}>Giriş Yap</Text>
            </TouchableOpacity>
          </View>

          <Text style={s.terms}>
            Devam ederek{' '}
            <Text style={{ color: C.secondary }}>Kullanım Koşulları</Text>
            {' '}ve{' '}
            <Text style={{ color: C.secondary }}>Gizlilik Politikası</Text>
            {`'nı`} kabul etmiş olursunuz.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: C.bg },
  kav:         { flex: 1, paddingHorizontal: 28, paddingTop: 16 },
  back:        { marginBottom: 24, alignSelf: 'flex-start' },
  backText:    { color: C.secondary, fontSize: 15, fontWeight: '600' },
  header:      { marginBottom: 24 },
  title:       { fontSize: 28, fontWeight: '900', color: C.text, marginBottom: 6 },
  subtitle:    { fontSize: 14, color: C.muted, lineHeight: 20 },
  sectionLabel:{ fontSize: 13, fontWeight: '600', color: C.muted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  roleGroup:   { gap: 10, marginBottom: 24 },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  roleCardSelected: { borderColor: C.primary, backgroundColor: '#FFF3EE' },
  roleIcon:    { fontSize: 28 },
  roleInfo:    { flex: 1 },
  roleTitle:   { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 2 },
  roleTitleSelected: { color: C.primary },
  roleDesc:    { fontSize: 12, color: C.muted },
  radioOuter: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
  },
  radioOuterSelected: { borderColor: C.primary },
  radioInner: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: C.primary,
  },
  form:        { gap: 16 },
  inputGroup:  { gap: 6 },
  label:       { fontSize: 13, fontWeight: '600', color: C.text },
  input: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    color: C.text,
  },
  inputCode:   { textAlign: 'center', fontSize: 24, fontWeight: '700', letterSpacing: 8 },
  btn: {
    backgroundColor: C.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText:     { color: '#fff', fontWeight: '700', fontSize: 16 },
  resend:      { textAlign: 'center', color: C.secondary, fontSize: 14, marginTop: 16, fontWeight: '600' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 28,
  },
  footerText:  { color: C.muted, fontSize: 14 },
  footerLink:  { color: C.primary, fontWeight: '700', fontSize: 14 },
  terms: {
    fontSize: 11,
    color: C.muted,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 16,
    marginBottom: 24,
  },
});
