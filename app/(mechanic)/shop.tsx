import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { CheckCircle, Storefront } from 'phosphor-react-native';
import { useAuth } from '@clerk/clerk-expo';
import { supabase } from '../../supabase';
import { C, REPAIR_CATEGORIES } from '../../lib/constants';

type Shop = {
  id: string; name: string; phone: string | null; address: string | null;
  district: string | null; description: string | null; is_verified: boolean;
  shop_categories: { category: string }[];
};

export default function ShopScreen() {
  const { userId: clerkUserId } = useAuth();
  const [shop,    setShop]    = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  // Form state
  const [name,        setName]        = useState('');
  const [phone,       setPhone]       = useState('');
  const [district,    setDistrict]    = useState('');
  const [address,     setAddress]     = useState('');
  const [description, setDescription] = useState('');
  const [selCats,     setSelCats]     = useState<string[]>([]);

  useEffect(() => {
    loadShop();
  }, [clerkUserId]);

  async function loadShop() {
    if (!clerkUserId) return;
    const { data: user } = await supabase.from('users').select('id').eq('clerk_id', clerkUserId).maybeSingle();
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from('repair_shops')
      .select('id, name, phone, address, district, description, is_verified, shop_categories(category)')
      .eq('owner_id', user.id)
      .maybeSingle();
    if (data) {
      const s = data as Shop;
      setShop(s);
      setName(s.name);
      setPhone(s.phone || '');
      setDistrict(s.district || '');
      setAddress(s.address || '');
      setDescription(s.description || '');
      setSelCats(s.shop_categories.map(c => c.category));
    }
    setLoading(false);
  }

  function toggleCat(id: string) {
    setSelCats(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  }

  async function save() {
    if (!shop) return;
    if (!name.trim()) { Alert.alert('Hata', 'Dükkan adı boş olamaz.'); return; }
    setSaving(true);
    try {
      await supabase.from('repair_shops').update({
        name:        name.trim(),
        phone:       phone.trim() || null,
        district:    district.trim() || null,
        address:     address.trim() || null,
        description: description.trim() || null,
        updated_at:  new Date().toISOString(),
      }).eq('id', shop.id);

      // Kategorileri güncelle: sil + yeniden ekle
      const { error: delErr } = await supabase.from('shop_categories').delete().eq('shop_id', shop.id);
      if (delErr) throw delErr;
      if (selCats.length > 0) {
        const { error: insErr } = await supabase.from('shop_categories').insert(
          selCats.map(cat => ({ shop_id: shop.id, category: cat }))
        );
        if (insErr) throw insErr;
      }
      Alert.alert('Kaydedildi', 'Dükkan bilgileri güncellendi.');
    } catch {
      Alert.alert('Hata', 'Kaydetme başarısız.');
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.centered}><ActivityIndicator color={C.primary} size="large" /></View>
      </SafeAreaView>
    );
  }

  if (!shop) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.centered}>
          <Storefront size={48} color={C.border} weight="thin" />
          <Text style={s.emptyTitle}>Dükkan bulunamadı</Text>
          <Text style={s.emptyBody}>Onboarding'i tamamlayarak dükkanınızı oluşturun.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Dükkanım</Text>
        {shop.is_verified && (
          <View style={s.verifiedBadge}>
            <CheckCircle size={14} color={C.success} weight="fill" />
            <Text style={s.verifiedText}>Doğrulandı</Text>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Field label="Dükkan Adı *" value={name} onChange={setName} placeholder="Örnek: Yılmaz Oto Servis" />
        <Field label="Telefon" value={phone} onChange={setPhone} placeholder="05xx xxx xx xx" keyboard="phone-pad" />
        <Field label="İlçe" value={district} onChange={setDistrict} placeholder="Örnek: Kadıköy" />
        <Field label="Adres" value={address} onChange={setAddress} placeholder="Mahalle, cadde, sokak..." />
        <Field label="Açıklama" value={description} onChange={setDescription}
          placeholder="Müşterilere kısa tanıtım..." multiline />

        <Text style={s.catTitle}>Hizmet Kategorileri *</Text>
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
                <Text style={s.catIcon}>{cat.icon}</Text>
                <Text style={[s.catLabel, sel && s.catLabelSel]}>{cat.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[s.saveBtn, saving && s.btnDisabled]}
          onPress={save}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveBtnText}>Kaydet</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, value, onChange, placeholder, keyboard, multiline }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; keyboard?: any; multiline?: boolean;
}) {
  return (
    <View style={s.fieldGroup}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput
        style={[s.fieldInput, multiline && s.fieldMulti]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={C.muted}
        keyboardType={keyboard || 'default'}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: C.bg },
  centered:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  emptyTitle:   { fontSize: 16, fontWeight: '600', color: C.secondary },
  emptyBody:    { fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 22 },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: C.border, backgroundColor: C.surface },
  headerTitle:  { fontSize: 22, fontWeight: '800', color: C.secondary },
  verifiedBadge:{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.successBg, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
  verifiedText: { fontSize: 12, color: C.success, fontWeight: '600' },
  scroll:       { padding: 20, gap: 4, paddingBottom: 40 },
  fieldGroup:   { marginBottom: 14 },
  fieldLabel:   { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 6 },
  fieldInput:   { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingVertical: 13, paddingHorizontal: 16, fontSize: 15, color: C.text },
  fieldMulti:   { minHeight: 80, textAlignVertical: 'top' },
  catTitle:     { fontSize: 13, fontWeight: '700', color: C.text, marginTop: 8, marginBottom: 10 },
  catGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  catChip:      { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.surface },
  catChipSel:   { borderColor: C.primary, backgroundColor: '#FFF3EE' },
  catIcon:      { fontSize: 16 },
  catLabel:     { fontSize: 13, color: C.muted },
  catLabelSel:  { color: C.primary, fontWeight: '700' },
  saveBtn:      { backgroundColor: C.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  saveBtnText:  { color: '#fff', fontWeight: '700', fontSize: 16 },
  btnDisabled:  { opacity: 0.6 },
});
