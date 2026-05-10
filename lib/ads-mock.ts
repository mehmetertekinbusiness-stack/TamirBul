// Expo Go için stub — react-native-google-mobile-ads native build gerektirir.
// Production build'de gerçek modül kullanılır (metro.config.js alias kaldırılır).
import React from 'react';
import { View } from 'react-native';

export const BannerAdSize = { BANNER: 'BANNER', LARGE_BANNER: 'LARGE_BANNER' };

export const AdEventType = { LOADED: 'loaded', CLOSED: 'closed', ERROR: 'error' };

export function BannerAd(_props: any) {
  return React.createElement(View, { style: { height: 0 } });
}

export const InterstitialAd = {
  createForAdRequest: (_unitId: string, _opts?: any) => ({
    load: () => {},
    show: () => {},
    addAdEventListener: (_event: string, _cb: () => void) => () => {},
  }),
};
