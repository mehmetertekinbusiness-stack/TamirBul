import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Modal, ScrollView, RefreshControl, ActivityIndicator, Linking, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback } from 'react';
import {
  ClipboardText, Car, Storefront, Clock,
  CheckCircle, X, Phone, ArrowRight,
} from 'phosphor-react-native';
import { useAuth } from '@clerk/clerk-expo';
import { supabase } from '../../supabase';
import { C, WORK_ORDER_STATUSES, REPAIR_CATEGORIES } from '../../lib/constants';

type WorkOrderStatus = keyof typeof WORK_ORDER_STATUSES;

type Update = {
  id: string; status: string; note: string | null; photo_url: string | null; created_at: string;
};

type WorkOrder = {
  id: string; status: WorkOrderStatus; category: string;
  description: string | null; mechanic_note: string | null;
  created_at: string; updated_at: string;
  repair_shops: { name: string; phone: string | null } | null;
  vehicles:     { plate: string; brand: string; model: string } | null;
  work_order_updates: Update[];
};

const STATUS_FLOW: WorkOrderStatus[] = ['received', 'inspecting', 'in_progress', 'ready', 'delivered'];
const CANCELLED: WorkOrderStatus = 'cancelled';
const DAYS = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60)  return `${m} dk önce`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h} sa önce`;
  return `${Math.floor(h / 24)} gün önce`;
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${DAYS[d.getDay()]} ${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
}

// ─── Durum Timeline ───────────────────────────────────────────────────────────
function StatusTimeline({ current }: { current: WorkOrderStatus }) {
  if (current === CANCELLED) {
    return (
      <View style={[tl.wrap, { backgroundColor: '#FEF2F2', borderRadius: 10, padding: 10 }]}>
        <Text style={{ color: C.danger, fontWeight: '700', fontSize: 13 }}>
          ✕ İş emri tamirci tarafından reddedildi
        </Text>
      </View>
    );
  }
  const idx = STATUS_FLOW.indexOf(current);
  return (
    <View style={tl.wrap}>
      {STATUS_FLOW.map((st, i) => {
        const done   = i <= idx;
        const active = i === idx;
        const info   = WORK_ORDER_STATUSES[st];
        return (
          <View key={st} style={tl.row}>
            <View style={tl.dotCol}>
              <View style={[tl.dot, done && { backgroundColor: info.color }]}>
                {done && <CheckCircle size={12} color="#fff" weight="fill" />}
              </View>
              {i < STATUS_FLOW.length - 1 && (
                <View style={[tl.line, i < idx && { backgroundColor: C.primary }]} />
              )}
            </View>
            <Text style={[tl.label, active && { fontWeight: '700', color: C.text }]}>
              {info.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const tl = StyleSheet.create({
  wrap:  { gap: 0, paddingVertical: 4 },
  row:   { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  dotCol:{ alignItems: 'center', width: 20 },
  dot:   { width: 20, height: 20, borderRadius: 10, backgroundColor: C.border, alignItems: 'center', justifyContent: 'center' },
  line:  { width: 2, height: 18, backgroundColor: C.border, marginTop: 2 },
  label: { fontSize: 13, color: C.muted, paddingVertical: 2 },
});

// ─── Ana Ekran ────────────────────────────────────────────────────────────────
export default function WorkOrdersScreen() {
  const { userId: clerkUserId } = useAuth();

  const [orders,     setOrders]     = useState<WorkOrder[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter,     setFilter]     = useState<'active' | 'all'>('active');
  const [selected,   setSelected]   = useState<WorkOrder | null>(null);

  const load = useCallback(async () => {
    if (!clerkUserId) return;
    const { data: me } = await supabase.from('users').select('id').eq('clerk_id', clerkUserId).maybeSingle();
    if (!me) return;

    const { data } = await supabase
      .from('work_orders')
      .select('id, status, category, description, mechanic_note, created_at, updated_at, repair_shops(name,phone), vehicles(plate,brand,model), work_order_updates(id,status,note,photo_url,created_at)')
      .eq('customer_id', me.id)
      .order('created_at', { ascending: false });

    setOrders((data as unknown as WorkOrder[]) || []);
  }, [clerkUserId]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const displayed = filter === 'active'
    ? orders.filter(o => o.status !== 'delivered')
    : orders;

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.title}>İş Emirlerim</Text>
        <View style={s.filterRow}>
          {(['active', 'all'] as const).map(f => (
            <TouchableOpacity
              key={f}
              style={[s.filterBtn, filter === f && s.filterBtnActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[s.filterBtnText, filter === f && s.filterBtnTextActive]}>
                {f === 'active' ? `Aktif (${orders.filter(o => o.status !== 'delivered').length})` : `Tümü (${orders.length})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={s.centered}><ActivityIndicator color={C.primary} size="large" /></View>
      ) : (
        <FlatList
          data={displayed}
          keyExtractor={o => o.id}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
          renderItem={({ item }) => {
            const info = WORK_ORDER_STATUSES[item.status];
            const cat  = REPAIR_CATEGORIES.find(r => r.id === item.category);
            return (
              <TouchableOpacity style={s.card} onPress={() => setSelected(item)} activeOpacity={0.88}>
                <View style={[s.stripe, { backgroundColor: info.color }]} />
                <View style={s.cardBody}>
                  <View style={s.cardTop}>
                    <Text style={s.cardCat}>{cat?.icon} {cat?.label ?? item.category}</Text>
                    <View style={[s.badge, { backgroundColor: info.color + '22' }]}>
                      <Text style={[s.badgeText, { color: info.color }]}>{info.label}</Text>
                    </View>
                  </View>
                  {item.vehicles && (
                    <View style={s.metaRow}>
                      <Car size={12} color={C.muted} />
                      <Text style={s.metaText}>{item.vehicles.plate}  {item.vehicles.brand} {item.vehicles.model}</Text>
                    </View>
                  )}
                  {item.repair_shops && (
                    <View style={s.metaRow}>
                      <Storefront size={12} color={C.muted} />
                      <Text style={s.metaText}>{item.repair_shops.name}</Text>
                    </View>
                  )}
                  <View style={s.cardBottom}>
                    <View style={s.metaRow}>
                      <Clock size={11} color={C.muted} />
                      <Text style={s.timeText}>{timeAgo(item.updated_at)}</Text>
                    </View>
                    <ArrowRight size={14} color={C.muted} />
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={s.empty}>
              <ClipboardText size={48} color={C.border} weight="thin" />
              <Text style={s.emptyTitle}>
                {filter === 'active' ? 'Aktif iş emri yok' : 'Henüz iş emri yok'}
              </Text>
              <Text style={s.emptyBody}>
                {filter === 'active'
                  ? 'Tüm iş emirlerini görmek için "Tümü" seçin.'
                  : 'Haritadan tamirci bulun ve randevu alın.'}
              </Text>
            </View>
          }
        />
      )}

      {/* ─── Detay Modal ───────────────────────────────────────────────── */}
      <Modal visible={!!selected} animationType="slide" transparent statusBarTranslucent>
        <View style={d.overlay}>
          <View style={d.sheet}>
            {selected && <DetailSheet order={selected} onClose={() => setSelected(null)} />}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Detay Sheet ──────────────────────────────────────────────────────────────
function DetailSheet({ order, onClose }: { order: WorkOrder; onClose: () => void }) {
  const info = WORK_ORDER_STATUSES[order.status];
  const cat  = REPAIR_CATEGORIES.find(r => r.id === order.category);
  const sortedUpdates = [...order.work_order_updates].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <>
      <View style={d.header}>
        <View style={{ flex: 1 }}>
          <Text style={d.headerTitle}>{cat?.icon} {cat?.label ?? order.category}</Text>
          <Text style={d.headerDate}>{fmtDate(order.created_at)}</Text>
        </View>
        <View style={[d.badge, { backgroundColor: info.color + '22' }]}>
          <Text style={[d.badgeText, { color: info.color }]}>{info.label}</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
          <X size={20} color={C.muted} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={d.scroll} showsVerticalScrollIndicator={false}>

        {/* Araç + servis bilgisi */}
        <View style={d.section}>
          {order.vehicles && (
            <View style={d.row}>
              <Car size={15} color={C.primary} />
              <Text style={d.rowText}>
                {order.vehicles.plate}  ·  {order.vehicles.brand} {order.vehicles.model}
              </Text>
            </View>
          )}
          {order.repair_shops && (
            <View style={d.row}>
              <Storefront size={15} color={C.primary} />
              <Text style={d.rowText}>{order.repair_shops.name}</Text>
              {order.repair_shops.phone && (
                <TouchableOpacity
                  style={d.phoneBtn}
                  onPress={() => Linking.openURL(`tel:${order.repair_shops!.phone}`)}
                >
                  <Phone size={13} color={C.primary} />
                  <Text style={d.phoneBtnText}>Ara</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          {order.description ? <Text style={d.desc}>{order.description}</Text> : null}
        </View>

        {/* Durum akışı */}
        <View style={d.section}>
          <Text style={d.sectionTitle}>Durum Akışı</Text>
          <StatusTimeline current={order.status} />
        </View>

        {/* Tamirci notu */}
        {order.mechanic_note && (
          <View style={d.section}>
            <Text style={d.sectionTitle}>Tamirci Notu</Text>
            <Text style={d.noteText}>{order.mechanic_note}</Text>
          </View>
        )}

        {/* Güncelleme geçmişi */}
        {sortedUpdates.length > 0 && (
          <View style={d.section}>
            <Text style={d.sectionTitle}>Güncelleme Geçmişi</Text>
            {sortedUpdates.map(u => {
              const uInfo = (WORK_ORDER_STATUSES as any)[u.status];
              return (
                <View key={u.id} style={d.updateRow}>
                  <View style={[d.updateDot, { backgroundColor: uInfo?.color ?? C.muted }]} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={d.updateStatus}>{uInfo?.label ?? u.status}</Text>
                    {u.note ? <Text style={d.updateNote}>{u.note}</Text> : null}
                    {u.photo_url ? (
                      <Image source={{ uri: u.photo_url }} style={d.updatePhoto} resizeMode="cover" />
                    ) : null}
                  </View>
                  <Text style={d.updateTime}>
                    {new Date(u.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </>
  );
}

const s = StyleSheet.create({
  safe:              { flex: 1, backgroundColor: C.bg },
  header:            { backgroundColor: C.surface, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: C.border, gap: 12 },
  title:             { fontSize: 22, fontWeight: '800', color: C.secondary },
  filterRow:         { flexDirection: 'row', gap: 8 },
  filterBtn:         { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: C.border, backgroundColor: C.bg },
  filterBtnActive:   { borderColor: C.primary, backgroundColor: '#FFF3EE' },
  filterBtnText:     { fontSize: 13, color: C.muted, fontWeight: '600' },
  filterBtnTextActive: { color: C.primary },
  centered:          { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list:              { padding: 16, paddingBottom: 32 },
  card:              { flexDirection: 'row', backgroundColor: C.surface, borderRadius: 14, marginBottom: 10, overflow: 'hidden', borderWidth: 0.5, borderColor: C.border },
  stripe:            { width: 4 },
  cardBody:          { flex: 1, padding: 14, gap: 5 },
  cardTop:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardCat:           { fontSize: 14, fontWeight: '700', color: C.text },
  badge:             { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText:         { fontSize: 11, fontWeight: '600' },
  metaRow:           { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText:          { fontSize: 12, color: C.muted },
  cardBottom:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  timeText:          { fontSize: 11, color: C.muted },
  empty:             { alignItems: 'center', paddingTop: 72, gap: 12, padding: 32 },
  emptyTitle:        { fontSize: 16, fontWeight: '600', color: C.secondary },
  emptyBody:         { fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 22 },
});

const d = StyleSheet.create({
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet:        { backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  header:       { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 20, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: C.border },
  headerTitle:  { fontSize: 18, fontWeight: '800', color: C.secondary },
  headerDate:   { fontSize: 12, color: C.muted, marginTop: 2 },
  badge:        { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginTop: 2 },
  badgeText:    { fontSize: 12, fontWeight: '700' },
  scroll:       { padding: 16, gap: 12 },
  section:      { backgroundColor: C.bg, borderRadius: 12, padding: 14, gap: 8 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  row:          { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowText:      { fontSize: 14, color: C.text, flex: 1 },
  phoneBtn:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFF3EE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  phoneBtnText: { fontSize: 12, color: C.primary, fontWeight: '600' },
  desc:         { fontSize: 13, color: C.muted, lineHeight: 20 },
  noteText:     { fontSize: 14, color: C.text, lineHeight: 20, fontStyle: 'italic' },
  updateRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  updateDot:    { width: 10, height: 10, borderRadius: 5, marginTop: 3 },
  updateStatus: { fontSize: 13, fontWeight: '600', color: C.text },
  updateNote:   { fontSize: 12, color: C.muted },
  updatePhoto:  { width: '100%', height: 140, borderRadius: 8 },
  updateTime:   { fontSize: 11, color: C.muted },
});
