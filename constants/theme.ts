/**
 * TamirBul Renk Sistemi
 * Marka toplantısı kararı (Mayıs 2026):
 *   - Ana renk: Turuncu #E8540A (enerji, aciliyet, uygun fiyat)
 *   - Vurgu:    Lacivert #1A3A5C (güven, profesyonellik)
 *   - Arka plan: Kırık Beyaz #F5F5F0
 */

export const Colors = {
  // Marka renkleri
  primary: '#E8540A',      // Turuncu — CTA butonları, aktif ikonlar
  primaryDark: '#C44308',  // Turuncu koyu ton — pressed state
  secondary: '#1A3A5C',    // Lacivert — başlıklar, vurgu
  background: '#F5F5F0',   // Kırık Beyaz — sayfa arka planı

  // Durum renkleri (iş emri takibi)
  statusReceived: '#9CA3AF',    // Gri — alındı
  statusInspecting: '#F59E0B',  // Amber — inceleniyor
  statusInProgress: '#3B82F6',  // Mavi — onarımda
  statusReady: '#10B981',       // Yeşil — hazır
  statusDelivered: '#6B7280',   // Koyu gri — teslim edildi

  // Genel UI
  white: '#FFFFFF',
  black: '#111111',
  border: '#E5E7EB',
  textPrimary: '#111111',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',

  // Dark mod
  dark: {
    background: '#0F1923',
    surface: '#1A2535',
    border: '#2D3F52',
    textPrimary: '#F5F5F0',
    textSecondary: '#9CA3AF',
  },
} as const;

export type ColorKey = keyof typeof Colors;
