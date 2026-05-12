import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ScrollView, ActivityIndicator,
  Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '@clerk/clerk-expo';
import { supabase } from '../supabase';
import { useSession } from '../lib/session-context';
import { C, REPAIR_CATEGORIES } from '../lib/constants';

type Step = 'welcome' | 'info' | 'done';

// ─── Araç markaları (sık kullanılan) ────────────────────────────────────────
const BRANDS = ['Renault', 'Volkswagen', 'Ford', 'Fiat', 'Toyota', 'Hyundai',
  'Opel', 'Peugeot', 'Honda', 'Dacia', 'Skoda', 'BMW', 'Mercedes', 'Audi', 'Kia', 'Diğer'];

export default function OnboardingScreen() {
  const router = useRouter();
  const { userId: clerkUserId } = useAuth();
  const { userRole } = useSession();
  const isMechanic = userRole === 'mechanic';

  const [step,    setStep]    = useState<Step>('welcome');
  const [loading, setLoading] = useState(false);

  // Müşteri — araç bilgileri
  const [plate,   setPlate]   = useState('');
  const [brand,   setBrand]   = useState('');
  const [model,   setModel]   = useState('');
  const [year,    setYear]    = useState('');

  // Tamirci — dükkan bilgileri
  const [shopName,    setShopName]    = useState('');
  const [shopPhone,   setShopPhone]   = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [shopDistrict,setShopDistrict]= useState('');
  const [selCats,     setSelCats]     = useState<string[]>([]);

  function toggleCat(id: string) {
    setSelCats(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  }

  // ─── Tamamla ──────────────────────────────────────────────────────────────
  async function handleComplete() {
    if (!clerkUserId) return;

    if (isMechanic) {
      if (!shopName.trim() || !shopPhone.trim()) {
        Alert.alert('Eksik bilgi', 'Dükkan adı ve telefon gerekli.');
        return;
      }
      if (selCats.length === 0) {
        Alert.alert('Kategori seçin', 'En az bir hizmet kategorisi seçin.');
        return;
      }
    } else {
      if (!plate.trim() || !brand || !model.trim()) {
        Alert.alert('Eksik bilgi', 'Plaka, marka ve model gerekli.');
        return;
      }
    }

    setLoading(true);
    try {
      // Kullanıcı UUID'sini al
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', clerkUserId)
        .maybeSingle();

      const userId = userData?.id;
      if (!userId) throw new Error('Kullanıcı kaydı bulunamadı.');

      if (isMechanic) {
        // Dükkan oluştur
        const { data: shop, error: shopErr } = await supabase
          .from('repair_shops')
          .insert({
            owner_id: userId,
            name:     shopName.trim(),
            phone:    shopPhone.trim(),
            district: shopDistrict.trim() || undefined,
            address:  shopAddress.trim() || undefined,
            city:     'İstanbul',
          })
          .select('id')
          .single();

        if (shopErr) throw shopErr;

        // Kategorileri ekle
        if (shop && selCats.length > 0) {
          await supabase.from('shop_categories').insert(
            selCats.map(cat => ({ shop_id: shop.id, category: cat }))
          );
        }
      } else {
        // Araç ekle
        await supabase.from('vehicles').insert({
          owner_id: userId,
          plate:    plate.trim().toUpperCase().replace(/\s/g, ''),
          brand:    brand,
          model:    model.trim(),
          year:     year ? parseInt(year, 10) : undefined,
        });
      }

      // Onboarding tamamlandı flag
      await SecureStore.setItemAsync(`onboarded_${clerkUserId}`, 'true');
      setStep('done');
    } catch (err: any) {
      Alert.alert('Hata', err?.message || 'Bir sorun oluştu, lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoHome() {
    const target = isMechanic ? '/(mechanic)' : '/(customer)';
    router.replace(target as any);
  }

  // ─── STEP: Welcome ────────────────────────────────────────────────────────
  if (step === 'welcome') {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="light-content" backgroundColor={C.primary} />
        <View style={s.welcomeContainer}>
          <View style={s.welcomeTop}>
            <Text style={s.welcomeIcon}>{isMechanic ? '🔧' : '🚗'}</Text>
            <Text style={s.welcomeTitle}>
              {isMechanic ? 'Dükkanınızı tanıtalım' : 'Aracınızı ekleyelim'}
            </Text>
            <Text style={s.welcomeBody}>
              {isMechanic
                ? 'Müşteriler sizi haritada bulsun diye birkaç bilgi alalım. 2 dakika sürer.'
                : 'İş emri takibi için araç bilgilerini girelim. Sonradan düzenleyebilirsiniz.'}
            </Text>
          </View>

          <View style={s.welcomeSteps}>
            {(isMechanic
              ? ['Dükkan adı ve iletişim', 'Hizmet kategorileri', 'Hazır!']
              : ['Plaka ve marka', 'Model ve yıl', 'Hazır!']
            ).map((label, i) => (
              <View key={i} style={s.stepRow}>
                <View style={s.stepBadge}><Text style={s.stepNum}>{i + 1}</Text></View>
                <Text style={s.stepLabel}>{label}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={s.btnWhite} onPress={() => setStep('info')} activeOpacity={0.85}>
            <Text style={s.btnWhiteText}>Başlayalım →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── STEP: Done ───────────────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.doneContainer}>
          <Text style={s.doneIcon}>🎉</Text>
          <Text style={s.doneTitle}>Hazırsınız!</Text>
          <Text style={s.doneBody}>
            {isMechanic
              ? 'Dükkanınız oluşturuldu. Yakında müşteri talepleri gelmeye başlayacak.'
              : 'Aracınız eklendi. Artık tamirci bulabilir ve iş emri takip edebilirsiniz.'}
          </Text>
          <TouchableOpacity style={s.btnPrimary} onPress={handleGoHome} activeOpacity={0.85}>
            <Text style={s.btnPrimaryText}>
              {isMechanic ? 'Panele Git →' : 'Haritaya Git →'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── STEP: Info form ──────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={s.formScroll} showsVerticalScrollIndicator={false}>
          <Text style={s.formTitle}>
            {isMechanic ? 'Dükkan Bilgileri' : 'Araç Bilgileri'}
          </Text>
          <Text style={s.formSub}>
            {isMechanic ? 'Müşterilerin sizi bulması için' : 'Takip için araç bilgilerini girin'}
          </Text>

          {isMechanic ? (
            <>
              <Field label="Dükkan Adı *" value={shopName} onChange={setShopName}
                placeholder="Örnek: Yılmaz Oto Servis" />
              <Field label="Telefon *" value={shopPhone} onChange={setShopPhone}
                placeholder="05xx xxx xx xx" keyboard="phone-pad" />
              <Field label="İlçe" value={shopDistrict} onChange={setShopDistrict}
                placeholder="Örnek: Kadıköy" />
              <Field label="Adres" value={shopAddress} onChange={setShopAddress}
                placeholder="Mahalle, cadde, sokak..." />

              <Text style={s.catTitle}>Hizmet Kategorileri *</Text>
              <Text style={s.catSub}>Hangi hizmetleri sunuyorsunuz? (Birden fazla seçilebilir)</Text>
              <View style={s.catGrid}>
                {REPAIR_CATEGORIES.map(cat => {
                  const sel = selCats.includes(cat.id);
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[s.catChip, sel && s.catChipSel]}
                      onPress={() => toggleCat(cat.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={s.catChipIcon}>{cat.icon}</Text>
                      <Text style={[s.catChipText, sel && s.catChipTextSel]}>{cat.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          ) : (
            <>
              <Field label="Plaka *" value={plate} onChange={setPlate}
                placeholder="34 ABC 123" autoCapitalize="characters" />

              <Text style={s.groupLabel}>Marka *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.brandScroll}>
                <View style={s.brandRow}>
                  {BRANDS.map(b => (
                    <TouchableOpacity
                      key={b}
                      style={[s.brandChip, brand === b && s.brandChipSel]}
                      onPress={() => setBrand(b)}
                    >
                      <Text style={[s.brandChipText, brand === b && s.brandChipTextSel]}>{b}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <Field label="Model *" value={model} onChange={setModel}
                placeholder="Örnek: Clio, Passat, Focus..." />
              <Field label="Yıl" value={year} onChange={setYear}
                placeholder="Örnek: 2018" keyboard="number-pad" maxLen={4} />
            </>
          )}

          <TouchableOpacity
            style={[s.btnPrimary, loading && s.btnDisabled]}
            onPress={handleComplete}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnPrimaryText}>Tamamla →</Text>
            }
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Yardımcı Field bileşeni ─────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder, keyboard, autoCapitalize, maxLen }: {
  label: string; value: string; onChange: (_v: string) => void;
  placeholder?: string; keyboard?: any; autoCapitalize?: any; maxLen?: number;
}) {
  return (
    <View style={s.inputGroup}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        style={s.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={C.muted}
        keyboardType={keyboard || 'default'}
        autoCapitalize={autoCapitalize || 'sentences'}
        maxLength={maxLen}
      />
    </View>
  );
}

const s = StyleSheet.create({
  safe:              { flex: 1, backgroundColor: C.bg },

  // Welcome
  welcomeContainer:  { flex: 1, backgroundColor: C.primary, padding: 32, justifyContent: 'space-between' },
  welcomeTop:        { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  welcomeIcon:       { fontSize: 64 },
  welcomeTitle:      { fontSize: 26, fontWeight: '900', color: '#fff', textAlign: 'center' },
  welcomeBody:       { fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 22 },
  welcomeSteps:      { gap: 12, marginBottom: 32 },
  stepRow:           { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepBadge:         { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  stepNum:           { color: '#fff', fontWeight: '700', fontSize: 13 },
  stepLabel:         { color: 'rgba(255,255,255,0.9)', fontSize: 14 },
  btnWhite:          { backgroundColor: '#fff', paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  btnWhiteText:      { color: C.primary, fontWeight: '700', fontSize: 16 },

  // Done
  doneContainer:     { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  doneIcon:          { fontSize: 64 },
  doneTitle:         { fontSize: 28, fontWeight: '900', color: C.text },
  doneBody:          { fontSize: 15, color: C.muted, textAlign: 'center', lineHeight: 22 },

  // Form
  formScroll:        { padding: 28, gap: 4 },
  formTitle:         { fontSize: 24, fontWeight: '900', color: C.text, marginBottom: 4 },
  formSub:           { fontSize: 13, color: C.muted, marginBottom: 20 },
  inputGroup:        { marginBottom: 14 },
  label:             { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 6 },
  input: {
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    borderRadius: 10, paddingVertical: 13, paddingHorizontal: 16, fontSize: 15, color: C.text,
  },
  groupLabel:        { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 8 },
  brandScroll:       { marginBottom: 14 },
  brandRow:          { flexDirection: 'row', gap: 8, paddingRight: 28 },
  brandChip:         { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.surface },
  brandChipSel:      { borderColor: C.primary, backgroundColor: '#FFF3EE' },
  brandChipText:     { fontSize: 13, color: C.muted },
  brandChipTextSel:  { color: C.primary, fontWeight: '700' },
  catTitle:          { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 4, marginTop: 8 },
  catSub:            { fontSize: 12, color: C.muted, marginBottom: 12 },
  catGrid:           { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  catChip:           { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.surface },
  catChipSel:        { borderColor: C.primary, backgroundColor: '#FFF3EE' },
  catChipIcon:       { fontSize: 16 },
  catChipText:       { fontSize: 13, color: C.muted },
  catChipTextSel:    { color: C.primary, fontWeight: '700' },
  btnPrimary:        { backgroundColor: C.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  btnPrimaryText:    { color: '#fff', fontWeight: '700', fontSize: 16 },
  btnDisabled:       { opacity: 0.6 },
});
