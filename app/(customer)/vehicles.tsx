import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Car, Plus, Trash } from 'phosphor-react-native';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { supabase } from '../../supabase';
import { C } from '../../lib/constants';

type Vehicle = { id: string; plate: string; brand: string; model: string; year: number | null; km: number | null; };

export default function VehiclesScreen() {
  const { userId: clerkUserId } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading,  setLoading]  = useState(true);

  const fetchVehicles = useCallback(async () => {
    if (!clerkUserId) return;
    const { data: user } = await supabase.from('users').select('id').eq('clerk_id', clerkUserId).maybeSingle();
    if (!user) return;
    const { data } = await supabase.from('vehicles').select('*').eq('owner_id', user.id).order('created_at');
    setVehicles(data || []);
  }, [clerkUserId]);

  useEffect(() => {
    setLoading(true);
    fetchVehicles().finally(() => setLoading(false));
  }, [fetchVehicles]);

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
        <TouchableOpacity style={s.addBtn} onPress={() => Alert.alert('Yakında', 'Araç ekleme özelliği geliştirme aşamasında.')}>
          <Plus size={18} color="#fff" weight="bold" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.centered}><ActivityIndicator color={C.primary} /></View>
      ) : (
        <FlatList
          data={vehicles}
          keyExtractor={v => v.id}
          contentContainerStyle={s.list}
          renderItem={({ item }) => (
            <View style={s.card}>
              <View style={s.cardIcon}><Car size={28} color={C.primary} weight="duotone" /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.cardTitle}>{item.brand} {item.model}</Text>
                <Text style={s.cardSub}>
                  {item.plate}
                  {item.year ? ` · ${item.year}` : ''}
                  {item.km  ? ` · ${item.km.toLocaleString('tr-TR')} km` : ''}
                </Text>
              </View>
              <TouchableOpacity onPress={() => deleteVehicle(item.id)}>
                <Trash size={18} color={C.muted} />
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <View style={s.empty}>
              <Car size={48} color={C.border} weight="thin" />
              <Text style={s.emptyTitle}>Araç eklenmemiş</Text>
              <Text style={s.emptyBody}>Sağ üstteki + butonundan araç ekleyebilirsiniz.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: C.bg },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: C.border },
  header:    { fontSize: 22, fontWeight: '800', color: C.secondary },
  addBtn:    { backgroundColor: C.primary, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list:      { padding: 16 },
  card:      { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 14, padding: 14, marginBottom: 10, gap: 12, borderWidth: 0.5, borderColor: C.border },
  cardIcon:  { width: 48, height: 48, borderRadius: 12, backgroundColor: '#FFF3EE', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: C.text },
  cardSub:   { fontSize: 13, color: C.muted, marginTop: 2 },
  empty:     { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTitle:{ fontSize: 16, fontWeight: '600', color: C.secondary },
  emptyBody: { fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 22 },
});
