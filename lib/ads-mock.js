// Expo Go stub — react-native-google-mobile-ads native build gerektirir.
const React = require('react');
const { View } = require('react-native');

const BannerAdSize = { BANNER: 'BANNER', LARGE_BANNER: 'LARGE_BANNER' };
const AdEventType  = { LOADED: 'loaded', CLOSED: 'closed', ERROR: 'error' };

function BannerAd(_props) {
  return React.createElement(View, { style: { height: 0 } });
}

const InterstitialAd = {
  createForAdRequest: (_unitId, _opts) => ({
    load: () => {},
    show: () => {},
    addAdEventListener: (_event, _cb) => () => {},
  }),
};

module.exports = { BannerAdSize, AdEventType, BannerAd, InterstitialAd };
