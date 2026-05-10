import {
  View, Text, TouchableOpacity, StyleSheet, Alert,
  Modal, TextInput, ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  SignOut, User, Pencil, CaretRight, Info,
  Bell, Shield, X, Check,
} from 'phosphor-react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import { useState } from 'react';
import { supabase } from '../../supabase';
import { C, APP_VERSION } from '../../lib/constants';

export default function SettingsScreen() {
  const { userId: clerkUserId, signOut } = useAuth();
  const { user } = useUser();

  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState('');
  const [saving,   setSaving]   = useState(false);

  // ─── İsim Düzenleme ──────────────────────────────────────────────────────
  function openEdit() {
    setEditName(user?.fullName ?? '');
    setShowEdit(true);
  }

  async function saveName() {
    const trimmed = editName.trim();
    if (!trimmed) { Alert.alert('Hata', 'İsim boş olamaz.'); return; }
    setSaving(true);
    try {
      await user?.update({ firstName: trimmed, lastName: '' });
      if (clerkUserId) {
        await supabase
          .from('users')
          .update({ full_name: trimmed })
          .eq('clerk_id', clerkUserId);
      }
      setShowEdit(false);
    } catch {
      Alert.alert('Hata', 'İsim güncellenemedi, lütfen tekrar deneyin.');
    } finally {
      setSaving(false);
    }
  }

  // ─── Çıkış ───────────────────────────────────────────────────────────────
  function handleSignOut() {
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

  const initials = (user?.fullName ?? user?.firstName ?? '?')
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const email = user?.primaryEmailAddress?.emailAddress ?? '';

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <Text style={s.pageTitle}>Hesabım</Text>

        {/* Profil kartı */}
        <View style={s.profileCard}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.profileName}>{user?.fullName ?? user?.firstName ?? '—'}</Text>
            {email ? <Text style={s.profileEmail}>{email}</Text> : null}
          </View>
          <TouchableOpacity style={s.editIcon} onPress={openEdit}>
            <Pencil size={16} color={C.primary} weight="bold" />
          </TouchableOpacity>
        </View>

        {/* Hesap */}
        <Text style={s.sectionTitle}>HESAP</Text>
        <View style={s.section}>
          <Row
            icon={<User size={18} color={C.primary} />}
            label="Profil Düzenle"
            sub="İsim bilgini değiştir"
            onPress={openEdit}
          />
          <Row
            icon={<Bell size={18} color={C.primary} />}
            label="Bildirimler"
            sub="Yakında"
            onPress={() => Alert.alert('Yakında', 'Bildirim ayarları geliştirme aşamasında.')}
            border={false}
          />
        </View>

        {/* Uygulama */}
        <Text style={s.sectionTitle}>UYGULAMA</Text>
        <View style={s.section}>
          <Row
            icon={<Shield size={18} color={C.primary} />}
            label="Gizlilik Politikası"
            onPress={() => Alert.alert('Yakında', 'Web sitemizde yayımlanacak.')}
          />
          <Row
            icon={<Info size={18} color={C.primary} />}
            label="Sürüm"
            sub={`v${APP_VERSION}`}
            onPress={() => {}}
            chevron={false}
            border={false}
          />
        </View>

        <TouchableOpacity style={s.signOutBtn} onPress={handleSignOut} activeOpacity={0.85}>
          <SignOut size={18} color={C.danger} />
          <Text style={s.signOutText}>Çıkış Yap</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* ─── İsim Düzenleme Modal ─────────────────────────────────────────── */}
      <Modal visible={showEdit} animationType="slide" transparent statusBarTranslucent>
        <View style={m.overlay}>
          <View style={m.sheet}>
            <View style={m.header}>
              <Text style={m.title}>Profil Düzenle</Text>
              <TouchableOpacity onPress={() => setShowEdit(false)} style={{ padding: 4 }}>
                <X size={20} color={C.muted} />
              </TouchableOpacity>
            </View>

            <View style={{ padding: 20 }}>
              <Text style={m.label}>Ad Soyad</Text>
              <TextInput
                style={m.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="Adınız Soyadınız"
                placeholderTextColor={C.muted}
                autoFocus
              />
              <TouchableOpacity
                style={[m.saveBtn, saving && m.btnDisabled]}
                onPress={saveName}
                disabled={saving}
                activeOpacity={0.85}
              >
                {saving
                  ? <ActivityIndicator color="#fff" />
                  : (
                    <>
                      <Check size={16} color="#fff" weight="bold" />
                      <Text style={m.saveBtnText}>Kaydet</Text>
                    </>
                  )
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Row({
  icon, label, sub, onPress, border = true, chevron = true,
}: {
  icon: React.ReactElement;
  label: string;
  sub?: string;
  onPress: () => void;
  border?: boolean;
  chevron?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[s.row, border && s.rowBorder]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={s.rowIconWrap}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={s.rowLabel}>{label}</Text>
        {sub ? <Text style={s.rowSub}>{sub}</Text> : null}
      </View>
      {chevron && <CaretRight size={14} color={C.muted} />}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: C.bg },
  scroll:       { paddingBottom: 48 },
  pageTitle:    { fontSize: 22, fontWeight: '800', color: C.secondary, padding: 20, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: C.border, backgroundColor: C.surface },

  profileCard:  { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, margin: 16, borderRadius: 16, padding: 16, gap: 14, borderWidth: 0.5, borderColor: C.border },
  avatar:       { width: 52, height: 52, borderRadius: 26, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText:   { color: '#fff', fontSize: 20, fontWeight: '800' },
  profileName:  { fontSize: 16, fontWeight: '700', color: C.text },
  profileEmail: { fontSize: 13, color: C.muted, marginTop: 2 },
  editIcon:     { width: 34, height: 34, borderRadius: 17, backgroundColor: '#FFF3EE', alignItems: 'center', justifyContent: 'center' },

  sectionTitle: { fontSize: 11, fontWeight: '700', color: C.muted, letterSpacing: 1, marginHorizontal: 16, marginBottom: 8, marginTop: 8 },
  section:      { backgroundColor: C.surface, marginHorizontal: 16, borderRadius: 14, borderWidth: 0.5, borderColor: C.border, overflow: 'hidden', marginBottom: 8 },

  row:          { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  rowBorder:    { borderBottomWidth: 0.5, borderBottomColor: C.border },
  rowIconWrap:  { width: 34, height: 34, borderRadius: 10, backgroundColor: '#FFF3EE', alignItems: 'center', justifyContent: 'center' },
  rowLabel:     { fontSize: 15, color: C.text, fontWeight: '500' },
  rowSub:       { fontSize: 12, color: C.muted, marginTop: 1 },

  signOutBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 16, marginTop: 12, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: C.danger },
  signOutText:  { color: C.danger, fontWeight: '700', fontSize: 15 },
});

const m = StyleSheet.create({
  overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet:       { backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 14, borderBottomWidth: 0.5, borderBottomColor: C.border },
  title:       { fontSize: 18, fontWeight: '800', color: C.secondary },
  label:       { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 8 },
  input:       { backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingVertical: 13, paddingHorizontal: 16, fontSize: 15, color: C.text, marginBottom: 16 },
  saveBtn:     { backgroundColor: C.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  btnDisabled: { opacity: 0.5 },
});
