import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { C } from '../../lib/constants';

export default function AuthLanding() {
  const router = useRouter();

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      <View style={s.hero}>
        <View style={s.logoBox}>
          <Text style={s.logoIcon}>🔧</Text>
        </View>
        <Text style={s.brand}>TamirBul</Text>
        <Text style={s.tagline}>
          Güvenilir tamircileri bulun,{'\n'}işinizi gerçek zamanlı takip edin.
        </Text>
      </View>

      <View style={s.features}>
        {FEATURES.map((f) => (
          <View key={f.label} style={s.featureRow}>
            <Text style={s.featureIcon}>{f.icon}</Text>
            <Text style={s.featureText}>{f.label}</Text>
          </View>
        ))}
      </View>

      <View style={s.actions}>
        <TouchableOpacity
          style={s.btnPrimary}
          onPress={() => router.push('/(auth)/sign-in')}
          activeOpacity={0.85}
        >
          <Text style={s.btnPrimaryText}>Giriş Yap</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.btnSecondary}
          onPress={() => router.push('/(auth)/sign-up')}
          activeOpacity={0.85}
        >
          <Text style={s.btnSecondaryText}>Hesap Oluştur</Text>
        </TouchableOpacity>

        <Text style={s.mechNote}>
          Tamirci misiniz?{' '}
          <Text
            style={s.mechLink}
            onPress={() => router.push({ pathname: '/(auth)/sign-up', params: { role: 'mechanic' } })}
          >
            Esnaf hesabı açın →
          </Text>
        </Text>
      </View>
    </SafeAreaView>
  );
}

const FEATURES = [
  { icon: '📍', label: 'Yakınımdaki tamircileri haritada gör' },
  { icon: '📋', label: 'İş emrini adım adım takip et' },
  { icon: '💬', label: 'Tamirciyle anlık mesajlaş' },
  { icon: '⭐', label: 'Güvenilir değerlendirmeler' },
];

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg,
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingVertical: 24,
  },
  hero: {
    alignItems: 'center',
    paddingTop: 32,
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoIcon: { fontSize: 36 },
  brand: {
    fontSize: 34,
    fontWeight: '900',
    color: C.secondary,
    letterSpacing: 1,
    marginBottom: 10,
  },
  tagline: {
    fontSize: 15,
    color: C.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
  features: {
    gap: 10,
    paddingVertical: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  featureIcon: { fontSize: 20 },
  featureText: { fontSize: 14, color: C.text, flex: 1 },
  actions: {
    gap: 10,
  },
  btnPrimary: {
    backgroundColor: C.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  btnSecondary: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: C.primary,
  },
  btnSecondaryText: {
    color: C.primary,
    fontWeight: '700',
    fontSize: 16,
  },
  mechNote: {
    textAlign: 'center',
    fontSize: 13,
    color: C.muted,
    marginTop: 4,
  },
  mechLink: {
    color: C.secondary,
    fontWeight: '600',
  },
});
