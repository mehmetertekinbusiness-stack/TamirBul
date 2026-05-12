import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, ActivityIndicator, RefreshControl, StyleSheet,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import {
  MagnifyingGlass, MapTrifold, List, Star, MapPin, X, Wrench,
} from 'phosphor-react-native';

import { supabase } from '../../supabase';
import { useSession } from '../../lib/session-context';
import { greeting } from '../../lib/helpers';
import { C, REPAIR_CATEGORIES, ISTANBUL_REGION, BANNER_ID } from '../../lib/constants';
import { BannerAd, BannerAdSize } from '../../lib/ads-mock.js';

type Shop = {
  id: string; name: string; address: string | null; city: string;
  lat: number | null; lng: number | null; phone: string | null;
  avg_rating: number | null; review_count: number;
  is_verified: boolean; is_premium: boolean;
  shop_categories: { category: string }[];
};

// ─── ShopCard ─────────────────────────────────────────────────────────────────
const ShopCard = memo(function ShopCard({ item, onPress }: { item: Shop; onPress: () => void }) {
  const cats = item.shop_categories.map(c => {
    const found = REPAIR_CATEGORIES.find(r => r.id === c.category);
    return found ? `${found.icon} ${found.label}` : c.category;
  }).slice(0, 3);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.92} style={s.card}>
      {/* Renkli banner */}
      <View style={s.cardBanner}>
        <Wrench size={28} color="rgba(255,255,255,0.4)" weight="thin" />
        {item.is_premium && (
          <View style={s.premiumBadge}><Text style={s.premiumText}>⭐ Öne Çıkan</Text></View>
        )}
        {item.is_verified && (
          <View style={s.verifiedBadge}><Text style={s.verifiedText}>✓ Doğrulandı</Text></View>
        )}
      </View>

      <View style={s.cardBody}>
        <View style={s.cardRow}>
          <Text style={s.cardName} numberOfLines={1}>{item.name}</Text>
          {item.avg_rating ? (
            <View style={s.ratingRow}>
              <Star size={12} color="#F59E0B" weight="fill" />
              <Text style={s.ratingText}>{item.avg_rating.toFixed(1)}</Text>
              {item.review_count > 0 && (
                <Text style={s.reviewCount}>({item.review_count})</Text>
              )}
            </View>
          ) : null}
        </View>

        {item.address ? (
          <View style={s.addressRow}>
            <MapPin size={11} color={C.muted} weight="fill" />
            <Text style={s.addressText} numberOfLines={1}>{item.address}</Text>
          </View>
        ) : null}

        <View style={s.catRow}>
          {cats.map((c, i) => (
            <View key={i} style={s.catBadge}>
              <Text style={s.catBadgeText}>{c}</Text>
            </View>
          ))}
          {item.shop_categories.length > 3 && (
            <View style={s.catBadge}>
              <Text style={s.catBadgeText}>+{item.shop_categories.length - 3}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity onPress={onPress} style={s.cardBtn} activeOpacity={0.85}>
          <Text style={s.cardBtnText}>Randevu Al →</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
});

// ─── Customer Home ────────────────────────────────────────────────────────────
export default function CustomerHome() {
  const router = useRouter();
  useSession();

  const [shops,      setShops]      = useState<Shop[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search,     setSearch]     = useState('');
  const [catFilter,  setCatFilter]  = useState<string>('all');
  const [viewMode,   setViewMode]   = useState<'list' | 'map'>('list');
  const [mapRegion,  setMapRegion]  = useState(ISTANBUL_REGION);
  const [selShop,    setSelShop]    = useState<Shop | null>(null);
  const [showSearchHere, setShowSearchHere] = useState(false);
  const mapRef = useRef<any>(null);
  const mapInitRef = useRef(false);
  const currentRegionRef = useRef<any>(null);
  const markersReady = useRef(false);

  // ─── Veri çek ─────────────────────────────────────────────────────────────
  const fetchShops = useCallback(async () => {
    const { data, error } = await supabase
      .from('repair_shops')
      .select('id, name, address, city, lat, lng, phone, avg_rating, review_count, is_verified, is_premium, shop_categories(category)')
      .order('is_premium', { ascending: false })
      .order('avg_rating',  { ascending: false, nullsFirst: false })
      .limit(100);
    if (!error && data) setShops(data as Shop[]);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchShops().finally(() => setLoading(false));
    getUserLocation();
  }, [fetchShops]);

  async function getUserLocation() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setMapRegion({
        latitude:      loc.coords.latitude,
        longitude:     loc.coords.longitude,
        latitudeDelta:  0.12,
        longitudeDelta: 0.12,
      });
    } catch {
      // İzin verilmedi — İstanbul merkez kullan
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchShops();
    setRefreshing(false);
  }, [fetchShops]);

  // ─── Filtrele ─────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return shops.filter(shop => {
      const q = search.toLowerCase();
      const matchSearch = !q
        || shop.name.toLowerCase().includes(q)
        || (shop.address || '').toLowerCase().includes(q);
      const matchCat = catFilter === 'all'
        || shop.shop_categories.some(c => c.category === catFilter);
      return matchSearch && matchCat;
    });
  }, [shops, search, catFilter]);

  // ─── Map view (inline — remount'u önler, A-02) ────────────────────────────
  const mapViewJSX = (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1, position: 'relative' }}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={{ flex: 1 }}
          initialRegion={mapRegion}
          showsUserLocation
          showsMyLocationButton
          onMapReady={() => { markersReady.current = true; }}
          onRegionChangeComplete={region => {
            if (!mapInitRef.current) { mapInitRef.current = true; return; }
            currentRegionRef.current = region;
            setShowSearchHere(true);
          }}
        >
          {filtered.map(shop => {
            if (!shop.lat || !shop.lng) return null;
            return (
              <Marker
                key={shop.id}
                coordinate={{ latitude: shop.lat, longitude: shop.lng }}
                pinColor={C.primary}
                title={shop.name}
                onPress={() => {
                  setSelShop(shop);
                  mapRef.current?.animateToRegion({
                    latitude: shop.lat!, longitude: shop.lng!,
                    latitudeDelta: 0.02, longitudeDelta: 0.02,
                  }, 500);
                }}
              />
            );
          })}
        </MapView>

        {showSearchHere && (
          <View style={s.searchHereWrap}>
            <TouchableOpacity
              style={s.searchHereBtn}
              onPress={() => {
                const r = currentRegionRef.current;
                if (!r) return;
                setShowSearchHere(false);
                setMapRegion(r);
              }}
            >
              <MagnifyingGlass size={13} color="#fff" weight="bold" />
              <Text style={s.searchHereText}>Bu alanda ara</Text>
            </TouchableOpacity>
          </View>
        )}

        {selShop && (
          <View style={s.mapSheet}>
            <View style={s.mapSheetRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.mapSheetName}>{selShop.name}</Text>
                {selShop.address ? <Text style={s.mapSheetAddr}>{selShop.address}</Text> : null}
              </View>
              <TouchableOpacity onPress={() => setSelShop(null)}>
                <X size={18} color={C.muted} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={s.mapSheetBtn}
              onPress={() => router.push({ pathname: '/shop/[id]', params: { id: selShop.id } } as any)}
            >
              <Text style={s.mapSheetBtnText}>Detay ve Randevu →</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={s.countBadge}>
          <Text style={s.countText}>{filtered.length} servis</Text>
        </View>
      </View>
    </GestureHandlerRootView>
  );

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header */}
      <SafeAreaView style={s.header} edges={['top']}>
        <View style={s.headerTop}>
          <View>
            <Text style={s.headerGreeting}>{greeting().toUpperCase()}</Text>
            <Text style={s.headerTitle}>Yakınımda Tamirci</Text>
          </View>
          <View style={s.viewToggle}>
            <TouchableOpacity
              style={[s.toggleBtn, viewMode === 'list' && s.toggleBtnActive]}
              onPress={() => setViewMode('list')}
            >
              <List size={16} color={viewMode === 'list' ? '#fff' : C.muted}
                weight={viewMode === 'list' ? 'fill' : 'regular'} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.toggleBtn, viewMode === 'map' && s.toggleBtnActive]}
              onPress={() => setViewMode('map')}
            >
              <MapTrifold size={16} color={viewMode === 'map' ? '#fff' : C.muted}
                weight={viewMode === 'map' ? 'fill' : 'regular'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Arama */}
        <View style={s.searchBar}>
          <MagnifyingGlass size={16} color={C.muted} />
          <TextInput
            style={s.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Tamirci veya ilçe ara..."
            placeholderTextColor={C.muted}
          />
          {search !== '' && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <X size={15} color={C.muted} />
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>

      {/* Kategori filtreleri */}
      <View style={s.filterWrap}>
        <FlatList
          horizontal
          data={[{ id: 'all', label: 'Tümü', icon: '🔍' }, ...REPAIR_CATEGORIES]}
          keyExtractor={i => i.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.filterList}
          renderItem={({ item }) => {
            const active = catFilter === item.id;
            return (
              <TouchableOpacity
                style={[s.filterChip, active && s.filterChipActive]}
                onPress={() => setCatFilter(item.id)}
              >
                <Text style={s.filterIcon}>{item.icon}</Text>
                <Text style={[s.filterLabel, active && s.filterLabelActive]}>{item.label}</Text>
              </TouchableOpacity>
            );
          }}
        />
        <Text style={s.filterCount}>{filtered.length} servis</Text>
      </View>

      {/* İçerik */}
      {viewMode === 'map' ? mapViewJSX : (
        loading ? (
          <View style={s.centered}>
            <ActivityIndicator size="large" color={C.primary} />
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={i => i.id}
            renderItem={({ item }) => (
              <ShopCard
                item={item}
                onPress={() => router.push({ pathname: '/shop/[id]', params: { id: item.id } } as any)}
              />
            )}
            contentContainerStyle={s.listContent}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews
            maxToRenderPerBatch={6}
            initialNumToRender={4}
            windowSize={5}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListFooterComponent={filtered.length > 0
              ? <View style={s.adWrap}><BannerAd unitId={BANNER_ID} size={BannerAdSize.BANNER} /></View>
              : null
            }
            ListEmptyComponent={
              <View style={s.emptyWrap}>
                <Wrench size={40} color={C.border} weight="thin" />
                <Text style={s.emptyTitle}>Bu kategoride servis bulunamadı</Text>
                <TouchableOpacity style={s.emptyBtn} onPress={() => { setCatFilter('all'); setSearch(''); }}>
                  <Text style={s.emptyBtnText}>Tümünü Göster</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )
      )}
    </View>
  );
}

const s = StyleSheet.create({
  // Header
  header:          { backgroundColor: C.surface, paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: C.border },
  headerTop:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: 8, marginBottom: 14 },
  headerGreeting:  { fontSize: 11, color: C.muted, letterSpacing: 1 },
  headerTitle:     { fontSize: 22, fontWeight: '800', color: C.secondary, marginTop: 2 },
  viewToggle:      { flexDirection: 'row', backgroundColor: C.bg, borderRadius: 10, padding: 3, borderWidth: 1, borderColor: C.border },
  toggleBtn:       { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 7 },
  toggleBtnActive: { backgroundColor: C.primary },
  searchBar:       { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bg, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, borderWidth: 1, borderColor: C.border, gap: 10 },
  searchInput:     { flex: 1, fontSize: 14, color: C.text, padding: 0 },

  // Filtreler
  filterWrap:      { backgroundColor: C.surface, paddingTop: 10, paddingBottom: 8, borderBottomWidth: 0.5, borderBottomColor: C.border },
  filterList:      { paddingHorizontal: 16, gap: 8 },
  filterChip:      { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface },
  filterChipActive:{ borderColor: C.primary, backgroundColor: '#FFF3EE' },
  filterIcon:      { fontSize: 14 },
  filterLabel:     { fontSize: 12, color: C.muted, fontWeight: '500' },
  filterLabelActive:{ color: C.primary, fontWeight: '700' },
  filterCount:     { fontSize: 11, color: C.muted, textAlign: 'right', paddingRight: 16, paddingTop: 4 },

  // Liste
  listContent:     { padding: 16, paddingBottom: 32 },
  centered:        { flex: 1, alignItems: 'center', justifyContent: 'center' },
  adWrap:          { alignItems: 'center', marginTop: 8 },
  emptyWrap:       { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTitle:      { fontSize: 15, fontWeight: '600', color: C.secondary },
  emptyBtn:        { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: C.primary },
  emptyBtnText:    { color: '#fff', fontSize: 13, fontWeight: '600' },

  // Kart
  card:            { backgroundColor: C.surface, borderRadius: 16, marginBottom: 12, overflow: 'hidden', borderWidth: 0.5, borderColor: C.border, elevation: 1 },
  cardBanner:      { height: 100, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  premiumBadge:    { position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  premiumText:     { fontSize: 11, color: '#fff', fontWeight: '600' },
  verifiedBadge:   { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(16,185,129,0.85)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  verifiedText:    { fontSize: 11, color: '#fff', fontWeight: '600' },
  cardBody:        { padding: 14, gap: 6 },
  cardRow:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardName:        { fontSize: 15, fontWeight: '700', color: C.secondary, flex: 1, marginRight: 8 },
  ratingRow:       { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText:      { fontSize: 13, fontWeight: '600', color: C.text },
  reviewCount:     { fontSize: 12, color: C.muted },
  addressRow:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addressText:     { fontSize: 12, color: C.muted, flex: 1 },
  catRow:          { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  catBadge:        { backgroundColor: '#FFF3EE', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  catBadgeText:    { fontSize: 11, color: C.primary },
  cardBtn:         { backgroundColor: C.primary, borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 6 },
  cardBtnText:     { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Map
  searchHereWrap:  { position: 'absolute', top: 12, left: 0, right: 0, alignItems: 'center' },
  searchHereBtn:   { backgroundColor: C.secondary, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', gap: 6, alignItems: 'center', elevation: 4 },
  searchHereText:  { color: '#fff', fontSize: 12, fontWeight: '600' },
  mapSheet:        { position: 'absolute', bottom: 20, left: 16, right: 16, backgroundColor: C.surface, borderRadius: 16, padding: 16, elevation: 8, gap: 10 },
  mapSheetRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  mapSheetName:    { fontSize: 15, fontWeight: '700', color: C.text },
  mapSheetAddr:    { fontSize: 12, color: C.muted, marginTop: 2 },
  mapSheetBtn:     { backgroundColor: C.primary, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  mapSheetBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  countBadge:      { position: 'absolute', top: 12, right: 12, backgroundColor: C.secondary, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  countText:       { color: '#fff', fontSize: 12, fontWeight: '600' },
});
