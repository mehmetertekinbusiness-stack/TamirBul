import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, ActivityIndicator, Modal, FlatList,
  Linking, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  CaretLeft, Star, MapPin, Phone, CheckCircle,
  Wrench, Car, X, ArrowRight,
} from 'phosphor-react-native';
import { useAuth } from '@clerk/clerk-expo';
import { supabase } from '../../supabase';
import { C, REPAIR_CATEGORIES } from '../../lib/constants';

// ─── Tipler ───────────────────────────────────────────────────────────────────
type Shop = {
  id: string; name: string; address: string | null; district: string | null;
  city: string; phone: string | null; description: string | null;
  avg_rating: number | null; review_count: number;
  is_verified: boolean; is_premium: boolean;
  shop_categories: { category: string }[];
  shop_hours: { day_of_week: number; open_time: string; close_time: string; is_closed: boolean }[];
};

type Review = {
  id: string; rating: number; comment: string | null; created_at: string;
};

type Vehicle = {
  id: string; plate: string; brand: string; model: string; year: number | null;
};

const DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

// ─── Yardımcılar ──────────────────────────────────────────────────────────────
function Stars({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={13} color="#F59E0B"
          weight={i <= Math.round(rating) ? 'fill' : 'regular'} />
      ))}
    </View>
  );
}

// ─── Ana Ekran ────────────────────────────────────────────────────────────────
export default function ShopDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router  = useRouter();
  const { userId: clerkUserId } = useAuth();

  const [shop,      setShop]      = useState<Shop | null>(null);
  const [reviews,   setReviews]   = useState<Review[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [myUserId,  setMyUserId]  = useState<string | null>(null);
  const [vehicles,  setVehicles]  = useState<Vehicle[]>([]);
  const [showBook,  setShowBook]  = useState(false);

  // ─── Booking form state ───────────────────────────────────────────────────
  const [selVehicle, setSelVehicle] = useState<Vehicle | null>(null);
  const [selCat,     setSelCat]     = useState<string>('');
  const [desc,       setDesc]       = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ─── Veri yükle ───────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    try {
      const [shopRes, reviewRes] = await Promise.all([
        supabase
          .from('repair_shops')
          .select('id, name, address, district, city, phone, description, avg_rating, review_count, is_verified, is_premium, shop_categories(category), shop_hours(day_of_week, open_time, close_time, is_closed)')
          .eq('id', id)
          .single(),
        supabase
          .from('reviews')
          .select('id, rating, comment, created_at')
          .eq('shop_id', id)
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      if (shopRes.data) setShop(shopRes.data as unknown as Shop);
      if (reviewRes.data) setReviews(reviewRes.data as Review[]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Müşteri UUID + araçlarını yükle
  const loadCustomerData = useCallback(async () => {
    if (!clerkUserId) return;
    const { data: me } = await supabase.from('users').select('id').eq('clerk_id', clerkUserId).maybeSingle();
    if (!me) return;
    setMyUserId(me.id);
    const { data: vList } = await supabase
      .from('vehicles')
      .select('id, plate, brand, model, year')
      .eq('owner_id', me.id)
      .order('created_at', { ascending: false });
    setVehicles((vList as Vehicle[]) || []);
    if (vList && vList.length > 0) setSelVehicle(vList[0] as Vehicle);
  }, [clerkUserId]);

  useEffect(() => {
    load();
    loadCustomerData();
  }, [load, loadCustomerData]);

  // ─── Randevu oluştur ──────────────────────────────────────────────────────
  async function submitBooking() {
    if (!selCat) { Alert.alert('Kategori seçin', 'Hizmet türünü seçmelisiniz.'); return; }
    if (!myUserId) { Alert.alert('Hata', 'Oturum bilgisi alınamadı.'); return; }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('work_orders').insert({
        customer_id: myUserId,
        shop_id:     id,
        vehicle_id:  selVehicle?.id ?? null,
        category:    selCat,
        description: desc.trim() || null,
      });

      if (error) throw error;

      setShowBook(false);
      setDesc('');
      Alert.alert(
        'Randevu Alındı',
        'İş emriniz iletildi. Tamirci onayladığında bildirim alacaksınız.',
        [{ text: 'Tamam', onPress: () => router.back() }]
      );
    } catch {
      Alert.alert('Hata', 'Randevu oluşturulamadı, lütfen tekrar deneyin.');
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Yükleniyor ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.centered}><ActivityIndicator size="large" color={C.primary} /></View>
      </SafeAreaView>
    );
  }

  if (!shop) {
    return (
      <SafeAreaView style={s.safe}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <CaretLeft size={20} color={C.secondary} weight="bold" />
        </TouchableOpacity>
        <View style={s.centered}><Text style={s.emptyText}>Servis bulunamadı.</Text></View>
      </SafeAreaView>
    );
  }

  const sortedHours = [...shop.shop_hours].sort((a, b) => a.day_of_week - b.day_of_week);
  const todayDay    = new Date().getDay();

  return (
    <View style={s.safe}>
      {/* Header banner */}
      <View style={s.banner}>
        <SafeAreaView edges={['top']} style={s.bannerSafe}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <CaretLeft size={22} color="#fff" weight="bold" />
          </TouchableOpacity>
          <View style={s.bannerContent}>
            <View style={s.badgeRow}>
              {shop.is_verified && (
                <View style={s.verifiedBadge}>
                  <CheckCircle size={12} color="#fff" weight="fill" />
                  <Text style={s.badgeText}>Doğrulandı</Text>
                </View>
              )}
              {shop.is_premium && (
                <View style={s.premiumBadge}>
                  <Star size={12} color="#fff" weight="fill" />
                  <Text style={s.badgeText}>Öne Çıkan</Text>
                </View>
              )}
            </View>
            <Text style={s.bannerName}>{shop.name}</Text>
            {shop.avg_rating ? (
              <View style={s.ratingRow}>
                <Stars rating={shop.avg_rating} />
                <Text style={s.ratingText}>
                  {shop.avg_rating.toFixed(1)}  ({shop.review_count} değerlendirme)
                </Text>
              </View>
            ) : (
              <Text style={s.noRating}>Henüz değerlendirme yok</Text>
            )}
          </View>
        </SafeAreaView>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* İletişim */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>İletişim & Konum</Text>
          {(shop.address || shop.district) && (
            <View style={s.infoRow}>
              <MapPin size={15} color={C.primary} weight="fill" />
              <Text style={s.infoText}>
                {[shop.address, shop.district, shop.city].filter(Boolean).join(', ')}
              </Text>
            </View>
          )}
          {shop.phone && (
            <TouchableOpacity
              style={s.infoRow}
              onPress={() => Linking.openURL(`tel:${shop.phone}`)}
            >
              <Phone size={15} color={C.primary} weight="fill" />
              <Text style={[s.infoText, s.phoneText]}>{shop.phone}</Text>
            </TouchableOpacity>
          )}
          {shop.description && (
            <Text style={s.descText}>{shop.description}</Text>
          )}
        </View>

        {/* Hizmetler */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Hizmetler</Text>
          <View style={s.catGrid}>
            {shop.shop_categories.map(c => {
              const cat = REPAIR_CATEGORIES.find(r => r.id === c.category);
              return (
                <View key={c.category} style={s.catChip}>
                  <Text style={s.catIcon}>{cat?.icon ?? '🔧'}</Text>
                  <Text style={s.catLabel}>{cat?.label ?? c.category}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Çalışma saatleri */}
        {sortedHours.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Çalışma Saatleri</Text>
            {sortedHours.map(h => {
              const isToday = h.day_of_week === todayDay;
              return (
                <View key={h.day_of_week} style={[s.hourRow, isToday && s.hourRowToday]}>
                  <View style={s.hourDayWrap}>
                    {isToday && <View style={s.todayDot} />}
                    <Text style={[s.hourDay, isToday && s.hourDayToday]}>
                      {DAYS[h.day_of_week]}
                    </Text>
                  </View>
                  {h.is_closed ? (
                    <Text style={s.hourClosed}>Kapalı</Text>
                  ) : (
                    <Text style={[s.hourTime, isToday && s.hourTimeToday]}>
                      {h.open_time.slice(0, 5)} – {h.close_time.slice(0, 5)}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Değerlendirmeler */}
        {reviews.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Değerlendirmeler</Text>
            {reviews.map(r => (
              <View key={r.id} style={s.reviewCard}>
                <View style={s.reviewTop}>
                  <Stars rating={r.rating} />
                  <Text style={s.reviewDate}>
                    {new Date(r.created_at).toLocaleDateString('tr-TR')}
                  </Text>
                </View>
                {r.comment && <Text style={s.reviewComment}>{r.comment}</Text>}
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Randevu butonu */}
      <View style={s.footer}>
        <TouchableOpacity style={s.bookBtn} onPress={() => setShowBook(true)} activeOpacity={0.88}>
          <Wrench size={18} color="#fff" weight="bold" />
          <Text style={s.bookBtnText}>Randevu Al</Text>
          <ArrowRight size={16} color="#fff" weight="bold" />
        </TouchableOpacity>
      </View>

      {/* ─── Randevu Modal ─────────────────────────────────────────────── */}
      <Modal visible={showBook} animationType="slide" transparent statusBarTranslucent>
        <View style={s.modalOverlay}>
          <View style={s.modalSheet}>
            {/* Modal header */}
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Randevu Al</Text>
              <TouchableOpacity onPress={() => setShowBook(false)}>
                <X size={20} color={C.muted} />
              </TouchableOpacity>
            </View>
            <Text style={s.modalShop}>{shop.name}</Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: '80%' }}>

              {/* Araç seçimi */}
              <Text style={s.fieldLabel}>Araç</Text>
              {vehicles.length === 0 ? (
                <TouchableOpacity
                  style={s.noVehicleBtn}
                  onPress={() => { setShowBook(false); router.push('/(customer)/vehicles' as any); }}
                >
                  <Car size={16} color={C.primary} />
                  <Text style={s.noVehicleText}>Önce araç ekleyin →</Text>
                </TouchableOpacity>
              ) : (
                <FlatList
                  horizontal
                  data={vehicles}
                  keyExtractor={v => v.id}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
                  renderItem={({ item }) => {
                    const sel = selVehicle?.id === item.id;
                    return (
                      <TouchableOpacity
                        style={[s.vehicleChip, sel && s.vehicleChipSel]}
                        onPress={() => setSelVehicle(item)}
                      >
                        <Car size={14} color={sel ? C.primary : C.muted} />
                        <Text style={[s.vehicleChipText, sel && s.vehicleChipTextSel]}>
                          {item.plate}
                        </Text>
                        <Text style={[s.vehicleChipSub, sel && { color: C.primary }]}>
                          {item.brand} {item.model}
                        </Text>
                      </TouchableOpacity>
                    );
                  }}
                />
              )}

              {/* Kategori seçimi */}
              <Text style={[s.fieldLabel, { marginTop: 16 }]}>Hizmet Türü *</Text>
              <View style={s.catSelectGrid}>
                {shop.shop_categories.map(c => {
                  const cat = REPAIR_CATEGORIES.find(r => r.id === c.category);
                  const sel = selCat === c.category;
                  return (
                    <TouchableOpacity
                      key={c.category}
                      style={[s.catSelectChip, sel && s.catSelectChipSel]}
                      onPress={() => setSelCat(c.category)}
                    >
                      <Text style={s.catIcon}>{cat?.icon ?? '🔧'}</Text>
                      <Text style={[s.catLabel, sel && { color: C.primary, fontWeight: '700' }]}>
                        {cat?.label ?? c.category}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Açıklama */}
              <Text style={[s.fieldLabel, { marginTop: 16 }]}>Açıklama (opsiyonel)</Text>
              <TextInput
                style={s.descInput}
                value={desc}
                onChangeText={setDesc}
                placeholder="Sorun veya istek hakkında kısaca bilgi verin..."
                placeholderTextColor={C.muted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              {/* Gönder */}
              <TouchableOpacity
                style={[s.submitBtn, (submitting || vehicles.length === 0) && s.btnDisabled]}
                onPress={submitBooking}
                disabled={submitting || vehicles.length === 0}
                activeOpacity={0.85}
              >
                {submitting
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.submitBtnText}>Randevu Gönder</Text>
                }
              </TouchableOpacity>

              <View style={{ height: 32 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: C.bg },
  centered:        { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText:       { fontSize: 15, color: C.muted },

  // Banner
  banner:          { backgroundColor: C.secondary, paddingBottom: 24 },
  bannerSafe:      { paddingHorizontal: 20 },
  backBtn:         { paddingVertical: 8, alignSelf: 'flex-start' },
  bannerContent:   { paddingBottom: 4, gap: 8 },
  badgeRow:        { flexDirection: 'row', gap: 8 },
  verifiedBadge:   { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(16,185,129,0.8)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  premiumBadge:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(245,158,11,0.85)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText:       { fontSize: 11, color: '#fff', fontWeight: '600' },
  bannerName:      { fontSize: 26, fontWeight: '900', color: '#fff' },
  ratingRow:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ratingText:      { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  noRating:        { fontSize: 13, color: 'rgba(255,255,255,0.55)' },

  // İçerik
  scroll:          { padding: 16, gap: 12 },
  section:         { backgroundColor: C.surface, borderRadius: 14, padding: 16, gap: 10, borderWidth: 0.5, borderColor: C.border },
  sectionTitle:    { fontSize: 12, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },

  // İletişim
  infoRow:         { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  infoText:        { fontSize: 14, color: C.text, flex: 1, lineHeight: 20 },
  phoneText:       { color: C.primary, fontWeight: '600' },
  descText:        { fontSize: 13, color: C.muted, lineHeight: 20, marginTop: 4 },

  // Hizmetler
  catGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip:         { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: C.border, backgroundColor: C.bg },
  catIcon:         { fontSize: 15 },
  catLabel:        { fontSize: 12, color: C.muted, fontWeight: '500' },

  // Saatler
  hourRow:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  hourRowToday:    { backgroundColor: '#FFF3EE', marginHorizontal: -6, paddingHorizontal: 6, borderRadius: 8 },
  hourDayWrap:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  todayDot:        { width: 6, height: 6, borderRadius: 3, backgroundColor: C.primary },
  hourDay:         { fontSize: 14, color: C.text },
  hourDayToday:    { fontWeight: '700', color: C.primary },
  hourTime:        { fontSize: 14, color: C.muted },
  hourTimeToday:   { color: C.primary, fontWeight: '600' },
  hourClosed:      { fontSize: 14, color: C.danger },

  // Yorumlar
  reviewCard:      { gap: 4, paddingBottom: 10, borderBottomWidth: 0.5, borderBottomColor: C.border },
  reviewTop:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewDate:      { fontSize: 11, color: C.muted },
  reviewComment:   { fontSize: 13, color: C.text, lineHeight: 20 },

  // Footer
  footer:          { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, paddingBottom: Platform.OS === 'ios' ? 32 : 16, backgroundColor: C.surface, borderTopWidth: 0.5, borderTopColor: C.border },
  bookBtn:         { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  bookBtnText:     { color: '#fff', fontWeight: '800', fontSize: 16 },

  // Modal
  modalOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet:      { backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 0 },
  modalHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  modalTitle:      { fontSize: 20, fontWeight: '800', color: C.secondary },
  modalShop:       { fontSize: 13, color: C.muted, marginBottom: 20 },

  // Booking form
  fieldLabel:      { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 8 },
  vehicleChip:     { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.bg, gap: 4 },
  vehicleChipSel:  { borderColor: C.primary, backgroundColor: '#FFF3EE' },
  vehicleChipText: { fontSize: 13, fontWeight: '700', color: C.muted },
  vehicleChipTextSel: { color: C.primary },
  vehicleChipSub:  { fontSize: 11, color: C.muted },
  noVehicleBtn:    { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: C.primary, borderStyle: 'dashed' },
  noVehicleText:   { color: C.primary, fontWeight: '600', fontSize: 14 },
  catSelectGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catSelectChip:   { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 20, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.bg },
  catSelectChipSel:{ borderColor: C.primary, backgroundColor: '#FFF3EE' },
  descInput:       { backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 14, fontSize: 14, color: C.text, minHeight: 90 },
  submitBtn:       { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
  submitBtnText:   { color: '#fff', fontWeight: '800', fontSize: 16 },
  btnDisabled:     { opacity: 0.5 },
});
