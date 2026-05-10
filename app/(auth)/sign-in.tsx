import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  StatusBar, SafeAreaView, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useSignIn } from '@clerk/clerk-expo';
import { C } from '../../lib/constants';

export default function SignInScreen() {
  const router = useRouter();
  const { signIn, setActive, isLoaded } = useSignIn();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleSignIn() {
    if (!isLoaded) return;
    if (!email.trim() || !password) {
      Alert.alert('Eksik bilgi', 'E-posta ve şifre gerekli.');
      return;
    }

    setLoading(true);
    try {
      const result = await signIn.create({
        identifier: email.trim().toLowerCase(),
        password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        // _layout.tsx auth state değişikliğini algılar ve yönlendirir
      } else {
        Alert.alert('Giriş hatası', 'Lütfen tekrar deneyin.');
      }
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || 'Giriş başarısız.';
      Alert.alert('Hata', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <KeyboardAvoidingView
        style={s.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity style={s.back} onPress={() => router.back()}>
          <Text style={s.backText}>← Geri</Text>
        </TouchableOpacity>

        <View style={s.header}>
          <Text style={s.title}>Giriş Yap</Text>
          <Text style={s.subtitle}>TamirBul hesabınıza giriş yapın</Text>
        </View>

        <View style={s.form}>
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
              placeholder="Şifreniz"
              placeholderTextColor={C.muted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[s.btn, loading && s.btnDisabled]}
            onPress={handleSignIn}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnText}>Giriş Yap</Text>
            }
          </TouchableOpacity>
        </View>

        <View style={s.footer}>
          <Text style={s.footerText}>Hesabınız yok mu? </Text>
          <TouchableOpacity onPress={() => router.replace('/(auth)/sign-up')}>
            <Text style={s.footerLink}>Kayıt Ol</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: C.bg },
  kav:        { flex: 1, paddingHorizontal: 28, paddingTop: 16 },
  back:       { marginBottom: 24, alignSelf: 'flex-start' },
  backText:   { color: C.secondary, fontSize: 15, fontWeight: '600' },
  header:     { marginBottom: 32 },
  title:      { fontSize: 28, fontWeight: '900', color: C.text, marginBottom: 6 },
  subtitle:   { fontSize: 14, color: C.muted },
  form:       { gap: 16 },
  inputGroup: { gap: 6 },
  label:      { fontSize: 13, fontWeight: '600', color: C.text },
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
  btn: {
    backgroundColor: C.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText:    { color: '#fff', fontWeight: '700', fontSize: 16 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerText: { color: C.muted, fontSize: 14 },
  footerLink: { color: C.primary, fontWeight: '700', fontSize: 14 },
});
