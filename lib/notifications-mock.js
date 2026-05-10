// Expo Go stub — expo-notifications push işlevselliği SDK 53+ Expo Go'da çalışmaz.
// Development build veya production APK gerektirir.
const noop = () => {};
const noopAsync = async () => {};

module.exports = {
  requestPermissionsAsync: noopAsync,
  getPermissionsAsync: async () => ({ status: 'denied' }),
  scheduleNotificationAsync: noopAsync,
  cancelScheduledNotificationAsync: noopAsync,
  cancelAllScheduledNotificationsAsync: noopAsync,
  addNotificationReceivedListener: () => ({ remove: noop }),
  addNotificationResponseReceivedListener: () => ({ remove: noop }),
  removeNotificationSubscription: noop,
  setNotificationHandler: noop,
  AndroidImportance: { HIGH: 4, DEFAULT: 3 },
  getExpoPushTokenAsync: async () => ({ data: '' }),
};
