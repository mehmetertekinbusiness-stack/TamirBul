const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

const ADS_MOCK   = path.resolve(__dirname, 'lib/ads-mock.js');
const NOTIF_MOCK = path.resolve(__dirname, 'lib/notifications-mock.js');

// Expo Go'da çalışmayan native modülleri mock'la.
// Production build'de bu mock'lar kullanılmaz (gerçek modüller native binary'de).
const originalResolveRequest = config.resolver?.resolveRequest;
config.resolver = {
  ...config.resolver,
  resolveRequest: (context, moduleName, platform) => {
    if (moduleName === 'react-native-google-mobile-ads') {
      return { filePath: ADS_MOCK, type: 'sourceFile' };
    }
    if (moduleName === 'expo-notifications') {
      return { filePath: NOTIF_MOCK, type: 'sourceFile' };
    }
    if (originalResolveRequest) {
      return originalResolveRequest(context, moduleName, platform);
    }
    return context.resolveRequest(context, moduleName, platform);
  },
};

module.exports = config;
