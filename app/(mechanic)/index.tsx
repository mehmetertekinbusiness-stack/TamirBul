import { View, Text, StyleSheet } from 'react-native';
import { C } from '../../lib/constants';

// TODO: Tamirci dashboard ekranı — gelen iş emirleri
export default function MechanicDashboard() {
  return (
    <View style={s.container}>
      <Text style={s.title}>Tamirci Paneli</Text>
      <Text style={s.sub}>Gelen iş emirleri — geliştirme aşamasında</Text>
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
