import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { ClipboardText, Clock, Car } from 'phosphor-react-native';
import { useAuth } from '@clerk/clerk-expo';
import { supabase } from '../../supabase';
import { C, WORK_ORDER_STATUSES, REPAIR_CATEGORIES } from '../../lib/constants';

type WorkOrderStatus = keyof typeof WORK_ORDER_STATUSES;
type WorkOrder = {
  id: string; status: WorkOrderStatus; category: string;
  description: string | null; created_at: string;
  vehicles: { plate: string; brand: string; model: string } | null;
};

const FILTERS: { id: WorkOrderStatus | 'all'; label: string }[] = [
  { id: 'all',         label: 'Tümü' },
  { id: 'received',    label: 'Alındı' },
  { id: 'inspecting',  label: 'İnceleniyor' },
  { id: 'in_progress', label: 'Onarımda' },
  { id: 'ready',       label: 'Hazır' },
  { id: 'delivered',   label: 'Teslim' },
];

export default function WorkOrdersScreen() {
  const { userId: clerkUserId } = useAuth();
  const router = useRouter();
  const [orders,    setOrders]    = useState<WorkOrder[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState<WorkOrderStatus | 'all'>('all');

  const fetchOrders = useCallback(async () => {
    if (!clerkUserId) return;
    const { data: user } = await supabase.from('users').select('id').eq('clerk_id', clerkUserId).maybeSingle();
    if (!user) return;
    const { data: shop } = await supabase.from('repair_shops').select('id').eq('owner_id', user.id).maybeSingle();
    if (!shop) return;
    const { data } = await supabase
      .from('work_orders')
      .select('id, status, category, description, created_at, vehicles(plate, brand, model)')
      .eq('shop_id', shop.id)
      .order('created_at', { ascending: false });
    setOrders((data as unknown as WorkOrder[]) || []);
  }, [clerkUserId]);

  useEffect(() => {
    setLoading(true);
    fetchOrders().finally(() => setLoading(false));
  }, [fetchOrders]);

  const displayed = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  return (
    <SafeAreaView style={s.safe}>
      <Text style={s.header}>İş Emirleri</Text>

      {/* Filtre bar */}
      <FlatList
        horizontal
        data={FILTERS}
        keyExtractor={f => f.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.filterList}
        renderItem={({ item }) => {
          const active = filter === item.id;
          const count  = item.id === 'all' ? orders.length : orders.filter(o => o.status === item.id).length;
          return (
            <TouchableOpacity
              style={[s.filterChip, active && s.filterChipActive]}
              onPress={() => setFilter(item.id as any)}
            >
              <Text style={[s.filterLabel, active && s.filterLabelActive]}>
                {item.label} {count > 0 ? `(${count})` : ''}
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
          renderItem={({ item }) => {
            const info  = WORK_ORDER_STATUSES[item.status];
            const cat   = REPAIR_CATEGORIES.find(r => r.id === item.category);
            return (
              <TouchableOpacity
                style={s.card}
                activeOpacity={0.88}
                onPress={() => router.push({ pathname: '/(mechanic)/work-order/[id]', params: { id: item.id } } as any)}
              >
                <View style={s.cardHead}>
                  <Text style={s.cardCat}>{cat?.icon} {cat?.label ?? item.category}</Text>
                  <View style={[s.badge, { backgroundColor: info.color + '22' }]}>
                    <Text style={[s.badgeText, { color: info.color }]}>{info.label}</Text>
                  </View>
                </View>
                {item.vehicles && (
                  <View style={s.vehicleRow}>
                    <Car size={13} color={C.muted} />
                    <Text style={s.vehicleText}>{item.vehicles.plate} — {item.vehicles.brand} {item.vehicles.model}</Text>
                  </View>
                )}
                <View style={s.timeRow}>
                  <Clock size={12} color={C.muted} />
                  <Text style={s.timeText}>{new Date(item.created_at).toLocaleDateString('tr-TR')}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={s.empty}>
              <ClipboardText size={40} color={C.border} weight="thin" />
              <Text style={s.emptyTitle}>Kayıt yok</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: C.bg },
  header:          { fontSize: 22, fontWeight: '800', color: C.secondary, padding: 20, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: C.border, backgroundColor: C.surface },
  filterBar:       { backgroundColor: C.surface, borderBottomWidth: 0.5, borderBottomColor: C.border, maxHeight: 52 },
  filterList:      { paddingHorizontal: 16, gap: 8, alignItems: 'center', paddingVertical: 10 },
  filterChip:      { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface },
  filterChipActive:{ borderColor: C.primary, backgroundColor: '#FFF3EE' },
  filterLabel:     { fontSize: 12, color: C.muted, fontWeight: '500' },
  filterLabelActive:{ color: C.primary, fontWeight: '700' },
  centered:        { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list:            { padding: 16, gap: 10 },
  card:            { backgroundColor: C.surface, borderRadius: 14, padding: 14, borderWidth: 0.5, borderColor: C.border, gap: 6 },
  cardHead:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardCat:         { fontSize: 14, fontWeight: '700', color: C.text },
  badge:           { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText:       { fontSize: 11, fontWeight: '600' },
  vehicleRow:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  vehicleText:     { fontSize: 12, color: C.muted },
  timeRow:         { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeText:        { fontSize: 11, color: C.muted },
  empty:           { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTitle:      { fontSize: 15, color: C.muted },
});
