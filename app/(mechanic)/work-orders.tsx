import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { ClipboardText, Clock, Car, CheckCircle, X } from 'phosphor-react-native';
import { useAuth } from '@clerk/clerk-expo';
import { supabase } from '../../supabase';
import { C, WORK_ORDER_STATUSES, REPAIR_CATEGORIES } from '../../lib/constants';

type WorkOrderStatus = keyof typeof WORK_ORDER_STATUSES;

type WorkOrder = {
  id: string; status: WorkOrderStatus; category: string;
  description: string | null; created_at: string;
  vehicles: { plate: string; brand: string; model: string } | null;
  users:    { full_name: string | null } | null;
};

const FILTERS: { id: WorkOrderStatus | 'all'; label: string }[] = [
  { id: 'all',         label: 'Tümü' },
  { id: 'received',    label: 'Bekleyenler' },
  { id: 'inspecting',  label: 'İnceleniyor' },
  { id: 'in_progress', label: 'Onarımda' },
  { id: 'ready',       label: 'Hazır' },
  { id: 'delivered',   label: 'Teslim' },
];

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60)  return `${m} dk önce`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h} sa önce`;
  return `${Math.floor(h / 24)} gün önce`;
}

export default function WorkOrdersScreen() {
  const { userId: clerkUserId } = useAuth();
  const router = useRouter();
  const [orders,    setOrders]    = useState<WorkOrder[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState<WorkOrderStatus | 'all'>('all');
  const [myUserId,  setMyUserId]  = useState<string | null>(null);
  const [acting,    setActing]    = useState<string | null>(null); // iş emri ID

  const fetchOrders = useCallback(async () => {
    if (!clerkUserId) return;
    const { data: user } = await supabase
      .from('users').select('id').eq('clerk_id', clerkUserId).maybeSingle();
    if (!user) return;
    setMyUserId(user.id);

    const { data: shop } = await supabase
      .from('repair_shops').select('id').eq('owner_id', user.id).maybeSingle();
    if (!shop) return;

    const { data } = await supabase
      .from('work_orders')
      .select('id, status, category, description, created_at, vehicles(plate, brand, model), users(full_name)')
      .eq('shop_id', shop.id)
      .not('status', 'eq', 'cancelled')
      .order('created_at', { ascending: false });

    setOrders((data as unknown as WorkOrder[]) ?? []);
  }, [clerkUserId]);

  useEffect(() => {
    setLoading(true);
    fetchOrders().finally(() => setLoading(false));
  }, [fetchOrders]);

  async function handleAccept(orderId: string) {
    if (!myUserId) return;
    setActing(orderId);
    const { error } = await supabase
      .from('work_orders')
      .update({ status: 'inspecting', updated_at: new Date().toISOString() })
      .eq('id', orderId);

    if (!error) {
      await supabase.from('work_order_updates').insert({
        work_order_id: orderId,
        status: 'inspecting',
        note: 'İş emri kabul edildi, araç incelemeye alındı.',
        updated_by: myUserId,
      });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'inspecting' } : o));
    } else {
      Alert.alert('Hata', 'İş emri kabul edilemedi.');
    }
    setActing(null);
  }

  async function handleReject(orderId: string) {
    Alert.alert(
      'İş Emrini Reddet',
      'Bu iş emrini reddetmek istediğinizden emin misiniz? Müşteri bilgilendirilecek.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Reddet', style: 'destructive',
          onPress: async () => {
            if (!myUserId) return;
            setActing(orderId);
            const { error } = await supabase
              .from('work_orders')
              .update({ status: 'cancelled', updated_at: new Date().toISOString() })
              .eq('id', orderId);

            if (!error) {
              await supabase.from('work_order_updates').insert({
                work_order_id: orderId,
                status: 'cancelled',
                note: 'İş emri tamirci tarafından reddedildi.',
                updated_by: myUserId,
              });
              setOrders(prev => prev.filter(o => o.id !== orderId));
            } else {
              Alert.alert('Hata', 'İşlem gerçekleştirilemedi.');
            }
            setActing(null);
          },
        },
      ]
    );
  }

  const displayed = filter === 'all'
    ? orders
    : orders.filter(o => o.status === filter);

  const pendingCount = orders.filter(o => o.status === 'received').length;

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.headerRow}>
        <Text style={s.header}>İş Emirleri</Text>
        {pendingCount > 0 && (
          <View style={s.pendingBadge}>
            <Text style={s.pendingBadgeText}>{pendingCount} yeni</Text>
          </View>
        )}
      </View>

      {/* Filtre bar */}
      <FlatList
        horizontal
        data={FILTERS}
        keyExtractor={f => f.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.filterList}
        renderItem={({ item }) => {
          const active = filter === item.id;
          const count  = item.id === 'all'
            ? orders.length
            : orders.filter(o => o.status === item.id).length;
          return (
            <TouchableOpacity
              style={[s.filterChip, active && s.filterChipActive]}
              onPress={() => setFilter(item.id as any)}
            >
              <Text style={[s.filterLabel, active && s.filterLabelActive]}>
                {item.label}{count > 0 ? ` (${count})` : ''}
              </Text>
            </TouchableOpacity>
          );
        }}
        style={s.filterBar}
      />

      {loading ? (
        <View style={s.centered}><ActivityIndicator color={C.primary} /></View>
      ) : (
        <FlatList
          data={displayed}
          keyExtractor={o => o.id}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={false} onRefresh={fetchOrders} tintColor={C.primary} />}
          renderItem={({ item }) => {
            const info    = WORK_ORDER_STATUSES[item.status] ?? WORK_ORDER_STATUSES.received;
            const cat     = REPAIR_CATEGORIES.find(r => r.id === item.category);
            const isNew   = item.status === 'received';
            const isActing = acting === item.id;

            return (
              <TouchableOpacity
                style={[s.card, isNew && s.cardNew]}
                activeOpacity={0.88}
                onPress={() => !isNew && router.push({
                  pathname: '/(mechanic)/work-order/[id]',
                  params: { id: item.id },
                } as any)}
                disabled={isNew}
              >
                <View style={s.cardHead}>
                  <Text style={s.cardCat}>{cat?.icon} {cat?.label ?? item.category}</Text>
                  <View style={[s.badge, { backgroundColor: info.color + '22' }]}>
                    <Text style={[s.badgeText, { color: info.color }]}>{info.label}</Text>
                  </View>
                </View>

                {item.users?.full_name && (
                  <Text style={s.customerName}>{item.users.full_name}</Text>
                )}

                {item.vehicles && (
                  <View style={s.vehicleRow}>
                    <Car size={13} color={C.muted} />
                    <Text style={s.vehicleText}>
                      {item.vehicles.plate} — {item.vehicles.brand} {item.vehicles.model}
                    </Text>
                  </View>
                )}

                {item.description ? (
                  <Text style={s.desc} numberOfLines={2}>{item.description}</Text>
                ) : null}

                <View style={s.timeRow}>
                  <Clock size={12} color={C.muted} />
                  <Text style={s.timeText}>{timeAgo(item.created_at)}</Text>
                </View>

                {/* Kabul / Red — sadece 'received' durumundaki iş emirlerinde */}
                {isNew && (
                  <View style={s.actionRow}>
                    <TouchableOpacity
                      style={[s.btnReject, isActing && s.btnDisabled]}
                      onPress={() => handleReject(item.id)}
                      disabled={isActing}
                    >
                      <X size={14} color={C.danger} weight="bold" />
                      <Text style={s.btnRejectText}>Reddet</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[s.btnAccept, isActing && s.btnDisabled]}
                      onPress={() => handleAccept(item.id)}
                      disabled={isActing}
                    >
                      {isActing
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <>
                            <CheckCircle size={14} color="#fff" weight="fill" />
                            <Text style={s.btnAcceptText}>Kabul Et</Text>
                          </>
                      }
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={s.empty}>
              <ClipboardText size={40} color={C.border} weight="thin" />
              <Text style={s.emptyTitle}>İş emri yok</Text>
              <Text style={s.emptyDesc}>
                {filter === 'all' ? 'Henüz gelen iş emri bulunmuyor.' : 'Bu filtrede kayıt yok.'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: C.bg },
  headerRow:        { flexDirection: 'row', alignItems: 'center', padding: 20, paddingBottom: 12, gap: 10, backgroundColor: C.surface, borderBottomWidth: 0.5, borderBottomColor: C.border },
  header:           { fontSize: 22, fontWeight: '800', color: C.secondary },
  pendingBadge:     { backgroundColor: C.primary, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  pendingBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  filterBar:        { backgroundColor: C.surface, borderBottomWidth: 0.5, borderBottomColor: C.border, maxHeight: 52 },
  filterList:       { paddingHorizontal: 16, gap: 8, alignItems: 'center', paddingVertical: 10 },
  filterChip:       { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface },
  filterChipActive: { borderColor: C.primary, backgroundColor: '#FFF3EE' },
  filterLabel:      { fontSize: 12, color: C.muted, fontWeight: '500' },
  filterLabelActive:{ color: C.primary, fontWeight: '700' },
  centered:         { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list:             { padding: 16, gap: 10 },
  card:             { backgroundColor: C.surface, borderRadius: 14, padding: 14, borderWidth: 0.5, borderColor: C.border, gap: 6 },
  cardNew:          { borderColor: C.primary, borderWidth: 1.5, backgroundColor: '#FFFAF8' },
  cardHead:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardCat:          { fontSize: 14, fontWeight: '700', color: C.text },
  badge:            { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText:        { fontSize: 11, fontWeight: '600' },
  customerName:     { fontSize: 13, fontWeight: '600', color: C.secondary },
  vehicleRow:       { flexDirection: 'row', alignItems: 'center', gap: 4 },
  vehicleText:      { fontSize: 12, color: C.muted },
  desc:             { fontSize: 12, color: C.muted, lineHeight: 17 },
  timeRow:          { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeText:         { fontSize: 11, color: C.muted },
  actionRow:        { flexDirection: 'row', gap: 10, marginTop: 8, borderTopWidth: 0.5, borderTopColor: C.border, paddingTop: 10 },
  btnReject:        { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderWidth: 1.5, borderColor: C.danger, borderRadius: 10, paddingVertical: 9 },
  btnRejectText:    { fontSize: 13, fontWeight: '700', color: C.danger },
  btnAccept:        { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: C.primary, borderRadius: 10, paddingVertical: 9 },
  btnAcceptText:    { fontSize: 13, fontWeight: '700', color: '#fff' },
  btnDisabled:      { opacity: 0.5 },
  empty:            { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyTitle:       { fontSize: 15, fontWeight: '700', color: C.muted },
  emptyDesc:        { fontSize: 13, color: C.muted },
});
