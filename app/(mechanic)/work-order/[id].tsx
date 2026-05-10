import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { CaretLeft, Car, CheckCircle, ArrowRight } from 'phosphor-react-native';
import { supabase } from '../../../supabase';
import { C, WORK_ORDER_STATUSES, REPAIR_CATEGORIES } from '../../../lib/constants';

type WorkOrderStatus = keyof typeof WORK_ORDER_STATUSES;

const STATUS_FLOW: WorkOrderStatus[] = ['received', 'inspecting', 'in_progress', 'ready', 'delivered'];

type Order = {
  id: string; status: WorkOrderStatus; category: string;
  description: string | null; mechanic_note: string | null;
  estimated_minutes: number | null; created_at: string;
  vehicles: { plate: string; brand: string; model: string; year: number | null } | null;
  updates: { id: string; status: string; note: string | null; created_at: string }[];
};

export default function WorkOrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [order,   setOrder]   = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [note,    setNote]    = useState('');

  useEffect(() => {
    loadOrder();
  }, [id]);

  async function loadOrder() {
    setLoading(true);
    const { data } = await supabase
      .from('work_orders')
      .select('id, status, category, description, mechanic_note, estimated_minutes, created_at, vehicles(plate, brand, model, year), work_order_updates(id, status, note, created_at)')
      .eq('id', id)
      .single();
    if (data) {
      const o = data as any;
      setOrder({ ...o, updates: o.work_order_updates || [] });
      setNote(o.mechanic_note || '');
    }
    setLoading(false);
  }

  async function advanceStatus() {
    if (!order) return;
    const idx = STATUS_FLOW.indexOf(order.status);
    if (idx >= STATUS_FLOW.length - 1) return;
    const next = STATUS_FLOW[idx + 1];

    setSaving(true);
    const { error } = await supabase
      .from('work_orders')
      .update({ status: next, mechanic_note: note || null, updated_at: new Date().toISOString() })
      .eq('id', order.id);

    if (!error) {
      await supabase.from('work_order_updates').insert({
        work_order_id: order.id,
        status: next,
        note: note || null,
      });
      setOrder(prev => prev ? { ...prev, status: next } : prev);
      await loadOrder();
    } else {
      Alert.alert('Hata', 'Durum güncellenemedi.');
    }
    setSaving(false);
  }

  async function saveNote() {
    if (!order) return;
    setSaving(true);
    await supabase.from('work_orders').update({ mechanic_note: note }).eq('id', order.id);
    setSaving(false);
  }

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.centered}><ActivityIndicator color={C.primary} size="large" /></View>
      </SafeAreaView>
    );
  }
  if (!order) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.centered}><Text style={s.emptyText}>İş emri bulunamadı.</Text></View>
      </SafeAreaView>
    );
  }

  const currentIdx  = STATUS_FLOW.indexOf(order.status);
  const nextStatus  = currentIdx < STATUS_FLOW.length - 1 ? STATUS_FLOW[currentIdx + 1] : null;
  const statusInfo  = WORK_ORDER_STATUSES[order.status];
  const catLabel    = REPAIR_CATEGORIES.find(r => r.id === order.category)?.label ?? order.category;

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <CaretLeft size={20} color={C.secondary} weight="bold" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>İş Emri Detay</Text>
        <View style={[s.statusPill, { backgroundColor: statusInfo.color + '22' }]}>
          <Text style={[s.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Araç */}
        {order.vehicles && (
          <View style={s.section}>
            <View style={s.sectionRow}>
              <Car size={16} color={C.primary} />
              <Text style={s.sectionTitle}>Araç</Text>
            </View>
            <Text style={s.vehiclePlate}>{order.vehicles.plate}</Text>
            <Text style={s.vehicleSub}>
              {order.vehicles.brand} {order.vehicles.model}
              {order.vehicles.year ? ` · ${order.vehicles.year}` : ''}
            </Text>
          </View>
        )}

        {/* Talep */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Hizmet</Text>
          <Text style={s.catText}>{catLabel}</Text>
          {order.description ? <Text style={s.descText}>{order.description}</Text> : null}
        </View>

        {/* Durum ilerleyişi */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Durum Akışı</Text>
          <View style={s.timeline}>
            {STATUS_FLOW.map((st, i) => {
              const done    = i <= currentIdx;
              const current = i === currentIdx;
              const info    = WORK_ORDER_STATUSES[st];
              return (
                <View key={st} style={s.timelineRow}>
                  <View style={[s.timelineDot, done && { backgroundColor: info.color }]}>
                    {done && <CheckCircle size={14} color="#fff" weight="fill" />}
                  </View>
                  <Text style={[s.timelineLabel, current && { fontWeight: '700', color: C.text }]}>
                    {info.label}
                  </Text>
                  {i < STATUS_FLOW.length - 1 && (
                    <View style={[s.timelineLine, done && i < currentIdx && { backgroundColor: C.primary }]} />
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Tamirci notu */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Tamirci Notu</Text>
          <TextInput
            style={s.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder="Müşteriye görünecek not (opsiyonel)..."
            placeholderTextColor={C.muted}
            multiline
            numberOfLines={3}
            onBlur={saveNote}
          />
        </View>

        {/* Güncelleme geçmişi */}
        {order.updates.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Geçmiş</Text>
            {order.updates.map(u => {
              const info = (WORK_ORDER_STATUSES as any)[u.status];
              return (
                <View key={u.id} style={s.updateRow}>
                  <View style={[s.updateDot, { backgroundColor: info?.color ?? C.muted }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.updateStatus}>{info?.label ?? u.status}</Text>
                    {u.note ? <Text style={s.updateNote}>{u.note}</Text> : null}
                  </View>
                  <Text style={s.updateTime}>
                    {new Date(u.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Aksiyon butonu */}
      {nextStatus && (
        <View style={s.footer}>
          <TouchableOpacity
            style={[s.advanceBtn, saving && s.btnDisabled]}
            onPress={advanceStatus}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={s.advanceBtnText}>
                  {WORK_ORDER_STATUSES[nextStatus].label} olarak işaretle
                </Text>
                <ArrowRight size={16} color="#fff" weight="bold" />
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: C.bg },
  centered:      { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText:     { fontSize: 15, color: C.muted },
  header:        { flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 12, backgroundColor: C.surface, borderBottomWidth: 0.5, borderBottomColor: C.border, gap: 10 },
  backBtn:       { padding: 4 },
  headerTitle:   { flex: 1, fontSize: 17, fontWeight: '700', color: C.secondary },
  statusPill:    { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  statusText:    { fontSize: 12, fontWeight: '600' },
  scroll:        { padding: 16, gap: 12, paddingBottom: 100 },
  section:       { backgroundColor: C.surface, borderRadius: 14, padding: 16, borderWidth: 0.5, borderColor: C.border, gap: 8 },
  sectionRow:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle:  { fontSize: 12, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  vehiclePlate:  { fontSize: 22, fontWeight: '900', color: C.secondary, letterSpacing: 2 },
  vehicleSub:    { fontSize: 14, color: C.muted },
  catText:       { fontSize: 16, fontWeight: '700', color: C.text },
  descText:      { fontSize: 14, color: C.muted, lineHeight: 20 },
  // Timeline
  timeline:      { gap: 0 },
  timelineRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, position: 'relative' },
  timelineDot:   { width: 24, height: 24, borderRadius: 12, backgroundColor: C.border, alignItems: 'center', justifyContent: 'center' },
  timelineLabel: { fontSize: 14, color: C.muted },
  timelineLine:  { position: 'absolute', left: 11, top: 30, width: 2, height: 12, backgroundColor: C.border },
  // Note
  noteInput:     { backgroundColor: C.bg, borderRadius: 10, borderWidth: 1, borderColor: C.border, padding: 12, fontSize: 14, color: C.text, minHeight: 80, textAlignVertical: 'top' },
  // History
  updateRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  updateDot:     { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  updateStatus:  { fontSize: 13, fontWeight: '600', color: C.text },
  updateNote:    { fontSize: 12, color: C.muted, marginTop: 2 },
  updateTime:    { fontSize: 11, color: C.muted },
  // Footer
  footer:        { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: C.surface, borderTopWidth: 0.5, borderTopColor: C.border },
  advanceBtn:    { backgroundColor: C.primary, borderRadius: 12, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  advanceBtnText:{ color: '#fff', fontWeight: '700', fontSize: 15 },
  btnDisabled:   { opacity: 0.6 },
});
