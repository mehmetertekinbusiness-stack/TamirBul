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

// ─── Tasarım Renkleri (constants/theme.ts → Colors kaynağı) ──────────────────
// Ekranlar C.primary gibi kısa alias kullanıyor — kaynak tek, Colors.
import { Colors } from '../constants/theme';

export const C = {
  primary:    Colors.primary,
  secondary:  Colors.secondary,
  bg:         Colors.background,
  surface:    Colors.white,
  border:     Colors.border,
  text:       Colors.textPrimary,
  muted:      Colors.textSecondary,
  success:    Colors.success,    successBg: '#D1FAE5',
  warn:       Colors.warning,    warnBg:    '#FEF3C7',
  danger:     Colors.error,      dangerBg:  '#FEE2E2',
} as const;

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
  received:    { label: 'Bekliyor',     color: '#F59E0B' },
  inspecting:  { label: 'İnceleniyor',  color: '#3B82F6' },
  in_progress: { label: 'Onarımda',     color: '#8B5CF6' },
  ready:       { label: 'Hazır',        color: '#10B981' },
  delivered:   { label: 'Teslim edildi', color: '#6B7280' },
  cancelled:   { label: 'İptal edildi', color: '#EF4444' },
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
