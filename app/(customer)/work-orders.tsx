import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ClipboardText } from 'phosphor-react-native';
import { C } from '../../lib/constants';

// TODO: Sprint 1 — İş emri listesi + canlı durum takibi
export default function WorkOrdersScreen() {
  return (
    <SafeAreaView style={s.safe}>
      <Text style={s.header}>İş Emirlerim</Text>
      <View style={s.empty}>
        <ClipboardText size={48} color={C.border} weight="thin" />
        <Text style={s.emptyTitle}>Henüz iş emri yok</Text>
        <Text style={s.emptyBody}>Tamirci randevusu aldıktan sonra iş emirleriniz burada görünecek.</Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: C.bg },
  header:     { fontSize: 22, fontWeight: '800', color: C.secondary, padding: 20, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: C.border },
  empty:      { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: C.secondary },
  emptyBody:  { fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 22 },
});
