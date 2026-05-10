import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { ClipboardText, Clock, CheckCircle, Car, Wrench } from 'phosphor-react-native';
import { useAuth } from '@clerk/clerk-expo';
import { supabase } from '../../supabase';
import { C, WORK_ORDER_STATUSES, REPAIR_CATEGORIES } from '../../lib/constants';

type WorkOrder = {
  id: string;
  status: string;
  category: string;
  description: string | null;
  created_at: string;
  vehicles: { plate: string; brand: string; model: string } | null;
  users:    { clerk_id: string } | null;
};

function statusColor(status: string) {
  return (WORK_ORDER_STATUSES as any)[status]?.color ?? C.muted;
}
function statusLabel(status: string) {
  return (WORK_ORDER_STATUSES as any)[status]?.label ?? status;
}
function categoryLabel(cat: string) {
  return REPAIR_CATEGORIES.find(r => r.id === cat)?.label ?? cat;
}
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m} dk önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} sa önce`;
  return `${Math.floor(h / 24)} gün önce`;
}

export default function MechanicDashboard() {
  const { userId: clerkUserId } = useAuth();
  const router = useRouter();
  const [shopId,     setShopId]     = useState<string | null>(null);
  const [orders,     setOrders]     = useState<WorkOrder[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!clerkUserId) return;
    const { data: user } = await supabase.from('users').select('id').eq('clerk_id', clerkUserId).maybeSingle();
    if (!user) return;
    const { data: shop } = await supabase.from('repair_shops').select('id').eq('owner_id', user.id).maybeSingle();
    if (!shop) return;
    setShopId(shop.id);

    const { data } = await supabase
      .from('work_orders')
      .select('id, status, category, description, created_at, vehicles(plate, brand, model), users(clerk_id)')
      .eq('shop_id', shop.id)
      .order('created_at', { ascending: false })
      .limit(50);
    setOrders((data as unknown as WorkOrder[]) || []);
  }, [clerkUserId]);

  useEffect(() => {
    setLoading(true);
    fetchOrders().finally(() => setLoading(false));
  }, [fetchOrders]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  }, [fetchOrders]);

  // Özet istatistikleri
  const activeCount  = orders.filter(o => !['delivered'].includes(o.status)).length;
  const todayCount   = orders.filter(o => {
    const d = new Date(o.created_at);
    const now = new Date();
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth();
  }).length;

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Tamirci Paneli</Text>
          <Text style={s.headerSub}>İş emirleri ve dükkan yönetimi</Text>
        </View>
        <View style={s.statRow}>
          <View style={s.statBadge}>
            <Text style={s.statNum}>{activeCount}</Text>
            <Text style={s.statLabel}>Aktif</Text>
          </View>
          <View style={s.statBadge}>
            <Text style={s.statNum}>{todayCount}</Text>
            <Text style={s.statLabel}>Bugün</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={s.centered}><ActivityIndicator color={C.primary} size="large" /></View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={o => o.id}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => {
            const color = statusColor(item.status);
            return (
              <TouchableOpacity
                style={s.card}
                activeOpacity={0.88}
                onPress={() => router.push({ pathname: '/(mechanic)/work-order/[id]', params: { id: item.id } } as any)}
              >
                <View style={[s.cardLeft, { backgroundColor: color + '22' }]}>
                  <Wrench size={22} color={color} weight="duotone" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={s.cardTop}>
                    <Text style={s.cardCat}>{categoryLabel(item.category)}</Text>
                    <View style={[s.statusBadge, { backgroundColor: color + '22' }]}>
                      <Text style={[s.statusText, { color }]}>{statusLabel(item.status)}</Text>
                    </View>
                  </View>
                  {item.vehicles && (
                    <View style={s.cardVehicle}>
                      <Car size={13} color={C.muted} />
                      <Text style={s.cardVehicleText}>{item.vehicles.plate} — {item.vehicles.brand} {item.vehicles.model}</Text>
                    </View>
                  )}
                  {item.description ? (
                    <Text style={s.cardDesc} numberOfLines={1}>{item.description}</Text>
                  ) : null}
                  <View style={s.cardBottom}>
                    <Clock size={12} color={C.muted} />
                    <Text style={s.cardTime}>{timeAgo(item.created_at)}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={s.empty}>
              <ClipboardText size={48} color={C.border} weight="thin" />
              <Text style={s.emptyTitle}>{shopId ? 'Henüz iş emri yok' : 'Dükkan bulunamadı'}</Text>
              <Text style={s.emptyBody}>
                {shopId
                  ? 'Müşteri randevu aldığında iş emirleri burada görünecek.'
                  : 'Onboarding\'i tamamlayarak dükkanınızı oluşturun.'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: C.bg },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingBottom: 14, backgroundColor: C.surface, borderBottomWidth: 0.5, borderBottomColor: C.border },
  headerTitle:   { fontSize: 20, fontWeight: '800', color: C.secondary },
  headerSub:     { fontSize: 12, color: C.muted, marginTop: 2 },
  statRow:       { flexDirection: 'row', gap: 10 },
  statBadge:     { alignItems: 'center', backgroundColor: '#FFF3EE', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  statNum:       { fontSize: 20, fontWeight: '800', color: C.primary },
  statLabel:     { fontSize: 11, color: C.muted, marginTop: 1 },
  centered:      { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list:          { padding: 16, gap: 10 },
  card:          { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: C.surface, borderRadius: 14, padding: 14, borderWidth: 0.5, borderColor: C.border },
  cardLeft:      { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardTop:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardCat:       { fontSize: 14, fontWeight: '700', color: C.text },
  statusBadge:   { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  statusText:    { fontSize: 11, fontWeight: '600' },
  cardVehicle:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  cardVehicleText:{ fontSize: 12, color: C.muted },
  cardDesc:      { fontSize: 13, color: C.text, marginBottom: 4 },
  cardBottom:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  cardTime:      { fontSize: 11, color: C.muted },
  empty:         { alignItems: 'center', paddingTop: 80, gap: 12, padding: 32 },
  emptyTitle:    { fontSize: 16, fontWeight: '600', color: C.secondary },
  emptyBody:     { fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 22 },
});
