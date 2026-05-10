import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SignOut, User, Info, CaretRight } from 'phosphor-react-native';
import { useAuth } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import { C, APP_VERSION } from '../../lib/constants';

export default function SettingsScreen() {
  const { userId: clerkUserId, signOut } = useAuth();

  async function handleSignOut() {
    Alert.alert('Çıkış Yap', 'Hesabınızdan çıkmak istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Çıkış Yap', style: 'destructive',
        onPress: async () => {
          if (clerkUserId) await SecureStore.deleteItemAsync(`onboarded_${clerkUserId}`);
          await signOut();
        },
      },
    ]);
  }

  const rows: { icon: React.ReactElement; label: string; onPress: () => void }[] = [
    {
      icon: <User size={20} color={C.primary} />,
      label: 'Profil Bilgileri',
      onPress: () => Alert.alert('Yakında', 'Profil düzenleme geliştirme aşamasında.'),
    },
    {
      icon: <Info size={20} color={C.primary} />,
      label: `Uygulama Sürümü: ${APP_VERSION}`,
      onPress: () => {},
    },
  ];

  return (
    <SafeAreaView style={s.safe}>
      <Text style={s.header}>Hesabım</Text>

      <View style={s.section}>
        {rows.map((row, i) => (
          <TouchableOpacity key={i} style={[s.row, i < rows.length - 1 && s.rowBorder]} onPress={row.onPress}>
            {row.icon}
            <Text style={s.rowLabel}>{row.label}</Text>
            <CaretRight size={14} color={C.muted} />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={s.signOutBtn} onPress={handleSignOut}>
        <SignOut size={18} color={C.danger} />
        <Text style={s.signOutText}>Çıkış Yap</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: C.bg },
  header:      { fontSize: 22, fontWeight: '800', color: C.secondary, padding: 20, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: C.border },
  section:     { backgroundColor: C.surface, marginHorizontal: 16, marginTop: 20, borderRadius: 14, borderWidth: 0.5, borderColor: C.border, overflow: 'hidden' },
  row:         { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  rowBorder:   { borderBottomWidth: 0.5, borderBottomColor: C.border },
  rowLabel:    { flex: 1, fontSize: 15, color: C.text },
  signOutBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 16, marginTop: 16, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: C.danger },
  signOutText: { color: C.danger, fontWeight: '600', fontSize: 15 },
});
