import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, Alert, ActivityIndicator, Linking, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback } from 'react';
import { Plus, Phone, Trash, WhatsappLogo, AddressBook, X } from 'phosphor-react-native';
import { useAuth } from '@clerk/clerk-expo';
import { supabase } from '../../supabase';
import { C } from '../../lib/constants';

type Supplier = { id: string; name: string; phone: string | null; whatsapp: string | null; note: string | null; };

export default function SuppliersScreen() {
  const { userId: clerkUserId } = useAuth();
  const [shopId,     setShopId]     = useState<string | null>(null);
  const [suppliers,  setSuppliers]  = useState<Supplier[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [modalVisible, setModal]    = useState(false);

  // Yeni tedarikçi formu
  const [newName,      setNewName]      = useState('');
  const [newPhone,     setNewPhone]     = useState('');
  const [newWhatsapp,  setNewWhatsapp]  = useState('');
  const [newNote,      setNewNote]      = useState('');
  const [saving,       setSaving]       = useState(false);

  const load = useCallback(async () => {
    if (!clerkUserId) return;
    const { data: user } = await supabase.from('users').select('id').eq('clerk_id', clerkUserId).maybeSingle();
    if (!user) return;
    const { data: shop } = await supabase.from('repair_shops').select('id').eq('owner_id', user.id).maybeSingle();
    if (!shop) return;
    setShopId(shop.id);
    const { data } = await supabase.from('suppliers').select('*').eq('shop_id', shop.id).order('name');
    setSuppliers((data as Supplier[]) || []);
  }, [clerkUserId]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  async function addSupplier() {
    if (!shopId || !newName.trim()) { Alert.alert('Hata', 'Tedarikçi adı gerekli.'); return; }
    setSaving(true);
    const { data, error } = await supabase.from('suppliers').insert({
      shop_id:   shopId,
      name:      newName.trim(),
      phone:     newPhone.trim()    || null,
      whatsapp:  newWhatsapp.trim() || null,
      note:      newNote.trim()     || null,
    }).select().single();
    if (!error && data) {
      setSuppliers(prev => [...prev, data as Supplier].sort((a, b) => a.name.localeCompare(b.name)));
      resetForm();
      setModal(false);
    } else {
      Alert.alert('Hata', 'Eklenemedi.');
    }
    setSaving(false);
  }

  async function deleteSupplier(id: string) {
    Alert.alert('Tedarikçiyi Sil', 'Bu tedarikçiyi silmek istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil', style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('suppliers').delete().eq('id', id);
          if (!error) setSuppliers(prev => prev.filter(s => s.id !== id));
        },
      },
    ]);
  }

  function resetForm() {
    setNewName(''); setNewPhone(''); setNewWhatsapp(''); setNewNote('');
  }

  function openWhatsApp(number: string, supplierName: string) {
    const clean = number.replace(/\D/g, '');
    const msg   = encodeURIComponent(`Merhaba ${supplierName}, sipariş vermek istiyorum.`);
    Linking.openURL(`https://wa.me/90${clean}?text=${msg}`);
  }

  function openPhone(number: string) {
    Linking.openURL(`tel:${number}`);
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.headerRow}>
        <Text style={s.header}>Tedarikçilerim</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => { resetForm(); setModal(true); }}>
          <Plus size={18} color="#fff" weight="bold" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.centered}><ActivityIndicator color={C.primary} /></View>
      ) : (
        <FlatList
          data={suppliers}
          keyExtractor={s => s.id}
          contentContainerStyle={s.list}
          renderItem={({ item }) => (
            <View style={s.card}>
              <View style={s.cardLeft}>
                <Text style={s.cardInitial}>{item.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.cardName}>{item.name}</Text>
                {item.note ? <Text style={s.cardNote} numberOfLines={1}>{item.note}</Text> : null}
              </View>
              <View style={s.actions}>
                {item.whatsapp && (
                  <TouchableOpacity style={s.actionBtn} onPress={() => openWhatsApp(item.whatsapp!, item.name)}>
                    <WhatsappLogo size={20} color="#25D366" weight="fill" />
                  </TouchableOpacity>
                )}
                {item.phone && (
                  <TouchableOpacity style={s.actionBtn} onPress={() => openPhone(item.phone!)}>
                    <Phone size={20} color={C.secondary} weight="fill" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={s.actionBtn} onPress={() => deleteSupplier(item.id)}>
                  <Trash size={18} color={C.muted} />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={s.empty}>
              <AddressBook size={48} color={C.border} weight="thin" />
              <Text style={s.emptyTitle}>Tedarikçi eklenmemiş</Text>
              <Text style={s.emptyBody}>Sağ üstteki + butonundan eklemeye başlayın.</Text>
            </View>
          }
        />
      )}

      {/* Yeni Tedarikçi Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModal(false)}>
        <KeyboardAvoidingView style={s.modalBg} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={s.modalSheet}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Yeni Tedarikçi</Text>
              <TouchableOpacity onPress={() => setModal(false)}>
                <X size={22} color={C.muted} />
              </TouchableOpacity>
            </View>

            <MField label="Ad *" value={newName} onChange={setNewName} placeholder="Tedarikçi firması veya kişi adı" />
            <MField label="Telefon" value={newPhone} onChange={setNewPhone} placeholder="05xx xxx xx xx" keyboard="phone-pad" />
            <MField label="WhatsApp (siparişler için)" value={newWhatsapp} onChange={setNewWhatsapp} placeholder="05xx xxx xx xx" keyboard="phone-pad" />
            <MField label="Not" value={newNote} onChange={setNewNote} placeholder="Ör: Motor yağları, lastik, hızlı teslimat..." />

            <TouchableOpacity
              style={[s.saveBtn, saving && s.btnDisabled]}
              onPress={addSupplier}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveBtnText}>Ekle</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function MField({ label, value, onChange, placeholder, keyboard }: {
  label: string; value: string; onChange: (_v: string) => void;
  placeholder?: string; keyboard?: any;
}) {
  return (
    <View style={s.fieldGroup}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput
        style={s.fieldInput}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={C.muted}
        keyboardType={keyboard || 'default'}
      />
    </View>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: C.bg },
  headerRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: C.border, backgroundColor: C.surface },
  header:      { fontSize: 22, fontWeight: '800', color: C.secondary },
  addBtn:      { backgroundColor: C.primary, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  centered:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list:        { padding: 16, gap: 10 },
  card:        { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 14, padding: 14, borderWidth: 0.5, borderColor: C.border, gap: 12 },
  cardLeft:    { width: 44, height: 44, borderRadius: 22, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  cardInitial: { fontSize: 18, fontWeight: '800', color: '#fff' },
  cardName:    { fontSize: 15, fontWeight: '700', color: C.text },
  cardNote:    { fontSize: 12, color: C.muted, marginTop: 2 },
  actions:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionBtn:   { padding: 6 },
  empty:       { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTitle:  { fontSize: 16, fontWeight: '600', color: C.secondary },
  emptyBody:   { fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 22 },
  // Modal
  modalBg:     { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet:  { backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36, gap: 4 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle:  { fontSize: 18, fontWeight: '800', color: C.secondary },
  fieldGroup:  { marginBottom: 12 },
  fieldLabel:  { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 5 },
  fieldInput:  { backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 14, fontSize: 15, color: C.text },
  saveBtn:     { backgroundColor: C.primary, paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  btnDisabled: { opacity: 0.6 },
});
