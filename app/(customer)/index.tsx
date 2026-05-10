import { View, Text, StyleSheet } from 'react-native';
import { C } from '../../lib/constants';

// TODO: Müşteri ana ekranı — harita + tamirci listesi
export default function CustomerHome() {
  return (
    <View style={s.container}>
      <Text style={s.title}>Yakınımda Tamirci</Text>
      <Text style={s.sub}>Harita görünümü — geliştirme aşamasında</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: C.secondary,
    marginBottom: 8,
  },
  sub: {
    fontSize: 14,
    color: C.muted,
  },
});
