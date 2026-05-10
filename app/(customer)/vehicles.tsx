import {
  View, Text, TouchableOpacity, FlatList, StyleSheet,
  Alert, ActivityIndicator, Modal, ScrollView,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Car, Plus, Trash, X } from 'phosphor-react-native';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { supabase } from '../../supabase';
import { C } from '../../lib/constants';

type Vehicle = {
  id: string; plate: string; brand: string; model: string;
  year: number | null; km: number | null;
};

const BRANDS = [
  'Renault','Volkswagen','Ford','Fiat','Toyota','Hyundai',
  'Opel','Peugeot','Honda','Dacia','Skoda','BMW',
  'Mercedes','Audi','Kia','Nissan','Diğer',
];

export default function VehiclesScreen() {
  const { userId: clerkUserId } = useAuth();
  const [vehicles,  setVehicles]  = useState<Vehicle[]>([]);
  const [myUserId,  setMyUserId]  = useState<string | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [showAdd,   setShowAdd]   = useState(false);

  // Form state
  const [plate,    setPlate]    = useState('');
  const [brand,    setBrand]    = useState('');
  const [model,    setModel]    = useState('');
  const [year,     setYear]     = useState('');
  const [km,       setKm]       = useState('');
  const [saving,   setSaving]   = useState(false);

  const load = useCallback(async () => {
    if (!clerkUserId) return;
    const { data: me } = await supabase.from('users').select('id').eq('clerk_id', clerkUserId).maybeSingle();
    if (!me) return;
    setMyUserId(me.id);
    const { data } = await supabase
      .from('vehicles')
      .select('id, plate, brand, model, year, km')
      .eq('owner_id', me.id)
      .order('created_at', { ascending: false });
    setVehicles((data as Vehicle[]) || []);
  }, [clerkUserId]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  function resetForm() {
    setPlate(''); setBrand(''); setModel(''); setYear(''); setKm('');
  }

  function openAdd() { resetForm(); setShowAdd(true); }
  function closeAdd() { setShowAdd(false); }

  async function saveVehicle() {
    if (!plate.trim())  { Alert.alert('Hata', 'Plaka boş olamaz.'); return; }
    if (!brand)         { Alert.alert('Hata', 'Marka seçin.'); return; }
    if (!model.trim())  { Alert.alert('Hata', 'Model boş olamaz.'); return; }
    if (!myUserId)      { Alert.alert('Hata', 'Oturum bilgisi alınamadı.'); return; }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .insert({
          owner_id: myUserId,
          plate:    plate.trim().toUpperCase().replace(/\s/g, ''),
          brand,
          model:    model.trim(),
          year:     year  ? parseInt(year, 10)  : null,
          km:       km    ? parseInt(km, 10)    : null,
        })
        .select('id, plate, brand, model, year, km')
        .single();

      if (error) throw error;
      setVehicles(prev => [data as Vehicle, ...prev]);
      closeAdd();
    } catch {
      Alert.alert('Hata', 'Araç eklenemedi, lütfen tekrar deneyin.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteVehicle(id: string) {
    Alert.alert('Aracı Sil', 'Bu aracı silmek istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil', style: 'destructive',
        onPress: async () => {
          await supabase.from('vehicles').delete().eq('id', id);
          setVehicles(prev => prev.filter(v => v.id !== id));
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.headerRow}>
        <Text style={s.header}>Araçlarım</Text>
        <TouchableOpacity style={s.addBtn} onPress={openAdd} activeOpacity={0.85}>
          <Plus size={18} color="#fff" weight="bold" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.centered}><ActivityIndicator color={C.primary} size="large" /></View>
      ) : (
        <FlatList
          data={vehicles}
          keyExtractor={v => v.id}
          contentContainerStyle={s.list}
          renderItem={({ item }) => (
            <View style={s.card}>
              <View style={s.cardIcon}>
                <Car size={26} color={C.primary} weight="duotone" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.cardTitle}>{item.brand} {item.model}</Text>
                <Text style={s.cardSub}>
                  {item.plate}
                  {item.year ? `  ·  ${item.year}` : ''}
                  {item.km   ? `  ·  ${item.km.toLocaleString('tr-TR')} km` : ''}
                </Text>
              </View>
              <TouchableOpacity onPress={() => deleteVehicle(item.id)} style={s.deleteBtn}>
                <Trash size={18} color={C.muted} />
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <View style={s.empty}>
              <Car size={52} color={C.border} weight="thin" />
              <Text style={s.emptyTitle}>Araç eklenmemiş</Text>
              <Text style={s.emptyBody}>Sağ üstteki + butonundan araç ekleyebilirsiniz.</Text>
              <TouchableOpacity style={s.emptyBtn} onPress={openAdd}>
                <Plus size={14} color="#fff" weight="bold" />
                <Text style={s.emptyBtnText}>Araç Ekle</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* ─── Araç Ekleme Modal ─────────────────────────────────────────── */}
      <Modal visible={showAdd} animationType="slide" transparent statusBarTranslucent>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={m.overlay}>
            <View style={m.sheet}>
              <View style={m.header}>
                <Text style={m.title}>Araç Ekle</Text>
                <TouchableOpacity onPress={closeAdd} style={{ padding: 4 }}>
                  <X size={20} color={C.muted} />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={m.scroll} showsVerticalScrollIndicator={false}>

                {/* Plaka */}
                <Text style={m.label}>Plaka *</Text>
                <TextInput
                  style={m.input}
                  value={plate}
                  onChangeText={setPlate}
                  placeholder="34 ABC 123"
                  placeholderTextColor={C.muted}
                  autoCapitalize="characters"
                />

                {/* Marka */}
                <Text style={[m.label, { marginTop: 14 }]}>Marka *</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={m.brandScroll}
                  contentContainerStyle={{ gap: 8, paddingRight: 8 }}
                >
                  {BRANDS.map(b => (
                    <TouchableOpacity
                      key={b}
                      style={[m.brandChip, brand === b && m.brandChipSel]}
                      onPress={() => setBrand(b)}
                    >
                      <Text style={[m.brandChipText, brand === b && m.brandChipTextSel]}>{b}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Model */}
                <Text style={[m.label, { marginTop: 14 }]}>Model *</Text>
                <TextInput
                  style={m.input}
                  value={model}
                  onChangeText={setModel}
                  placeholder="Örnek: Clio, Passat, Focus..."
                  placeholderTextColor={C.muted}
                />

                {/* Yıl + KM */}
                <View style={m.twoCol}>
                  <View style={{ flex: 1 }}>
                    <Text style={m.label}>Yıl</Text>
                    <TextInput
                      style={m.input}
                      value={year}
                      onChangeText={setYear}
                      placeholder="2018"
                      placeholderTextColor={C.muted}
                      keyboardType="number-pad"
                      maxLength={4}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={m.label}>Kilometre</Text>
                    <TextInput
                      style={m.input}
                      value={km}
                      onChangeText={setKm}
                      placeholder="85000"
                      placeholderTextColor={C.muted}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[m.saveBtn, saving && m.btnDisabled]}
                  onPress={saveVehicle}
                  disabled={saving}
                  activeOpacity={0.85}
                >
                  {saving
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={m.saveBtnText}>Kaydet</Text>
                  }
                </TouchableOpacity>

                <View style={{ height: 24 }} />
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: C.bg },
  headerRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: C.border, backgroundColor: C.surface },
  header:     { fontSize: 22, fontWeight: '800', color: C.secondary },
  addBtn:     { backgroundColor: C.primary, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  centered:   { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list:       { padding: 16, paddingBottom: 32 },
  card:       { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 14, padding: 14, marginBottom: 10, gap: 12, borderWidth: 0.5, borderColor: C.border },
  cardIcon:   { width: 48, height: 48, borderRadius: 12, backgroundColor: '#FFF3EE', alignItems: 'center', justifyContent: 'center' },
  cardTitle:  { fontSize: 15, fontWeight: '700', color: C.text },
  cardSub:    { fontSize: 13, color: C.muted, marginTop: 2 },
  deleteBtn:  { padding: 6 },
  empty:      { alignItems: 'center', paddingTop: 80, gap: 12, padding: 32 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: C.secondary },
  emptyBody:  { fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 22 },
  emptyBtn:   { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20, marginTop: 4 },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});

const m = StyleSheet.create({
  overlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet:         { backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: C.border },
  title:         { fontSize: 20, fontWeight: '800', color: C.secondary },
  scroll:        { padding: 20, paddingTop: 16 },
  label:         { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 8 },
  input:         { backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingVertical: 13, paddingHorizontal: 16, fontSize: 15, color: C.text },
  brandScroll:   { marginBottom: 4 },
  brandChip:     { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.surface },
  brandChipSel:  { borderColor: C.primary, backgroundColor: '#FFF3EE' },
  brandChipText: { fontSize: 13, color: C.muted, fontWeight: '500' },
  brandChipTextSel: { color: C.primary, fontWeight: '700' },
  twoCol:        { flexDirection: 'row', gap: 12, marginTop: 14 },
  saveBtn:       { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
  saveBtnText:   { color: '#fff', fontWeight: '800', fontSize: 16 },
  btnDisabled:   { opacity: 0.5 },
});
