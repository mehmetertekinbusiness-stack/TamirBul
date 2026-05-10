import Constants from 'expo-constants';

const _extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string>;

// ─── Supabase ─────────────────────────────────────────────────────────────────
export const SUPABASE_URL  = _extra.supabaseUrl;
export const SUPABASE_ANON = _extra.supabaseAnonKey;
export const GOOGLE_MAPS_KEY = _extra.googleMapsKey;

// ─── AdMob IDs (TamirBul — lansımdan önce gerçek ID'ler eklenecek) ────────────
export const BANNER_ID = __DEV__
  ? 'ca-app-pub-3940256099942544/6300978111'
  : 'ca-app-pub-PLACEHOLDER/PLACEHOLDER';

// ─── Tasarım Renkleri ─────────────────────────────────────────────────────────
export const C = {
  primary:    '#E8540A',   // Turuncu — ana renk
  secondary:  '#1A3A5C',   // Lacivert — vurgu
  bg:         '#F5F5F0',   // Kırık Beyaz — arka plan
  surface:    '#FFFFFF',
  border:     '#E5E7EB',
  text:       '#111111',
  muted:      '#6B7280',
  success:    '#10B981',   successBg: '#D1FAE5',
  warn:       '#F59E0B',   warnBg:    '#FEF3C7',
  danger:     '#EF4444',   dangerBg:  '#FEE2E2',
};

/**
 * TamirBul sabit değerleri
 */

export const REPAIR_CATEGORIES = [
  { id: 'engine',       label: 'Motor',          icon: '🔧' },
  { id: 'electrical',   label: 'Elektrik',        icon: '⚡' },
  { id: 'bodywork',     label: 'Kaporta',         icon: '🚗' },
  { id: 'tires',        label: 'Lastik',          icon: '⭕' },
  { id: 'periodic',     label: 'Periyodik Bakım', icon: '📋' },
  { id: 'ac',           label: 'Klima',           icon: '❄️' },
  { id: 'exhaust',      label: 'Egzoz',           icon: '💨' },
  { id: 'wash',         label: 'Yıkama',          icon: '🫧' },
] as const;

export type RepairCategoryId = typeof REPAIR_CATEGORIES[number]['id'];

export const WORK_ORDER_STATUSES = {
  received:    { label: 'Alındı',       color: '#9CA3AF' },
  inspecting:  { label: 'İnceleniyor',  color: '#F59E0B' },
  in_progress: { label: 'Onarımda',     color: '#3B82F6' },
  ready:       { label: 'Hazır',        color: '#10B981' },
  delivered:   { label: 'Teslim edildi', color: '#6B7280' },
} as const;

export type WorkOrderStatus = keyof typeof WORK_ORDER_STATUSES;

// İstanbul pilot — ileride genişletilebilir
export const ACTIVE_CITIES = ['İstanbul'] as const;

// Harita: İstanbul merkez
export const ISTANBUL_REGION = {
  latitude:      41.0082,
  longitude:     28.9784,
  latitudeDelta:  0.15,
  longitudeDelta: 0.15,
};

export const APP_VERSION = '1.0.0';
