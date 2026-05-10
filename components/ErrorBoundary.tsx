import { Component, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { C } from '../lib/constants';
import { router } from 'expo-router';

interface Props { children: ReactNode; }
interface State { hasError: boolean; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    if (__DEV__) console.error('[ErrorBoundary]', error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <View style={s.container}>
        <Text style={s.emoji}>⚠️</Text>
        <Text style={s.title}>Bir sorun oluştu</Text>
        <Text style={s.body}>Uygulama beklenmedik bir hatayla karşılaştı.</Text>
        <TouchableOpacity style={s.btn} onPress={() => this.setState({ hasError: false })}>
          <Text style={s.btnText}>Yeniden Dene</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.btnSecondary} onPress={() => {
          this.setState({ hasError: false });
          router.replace('/(auth)');
        }}>
          <Text style={s.btnSecondaryText}>Ana Sayfaya Dön</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emoji:           { fontSize: 48, marginBottom: 16 },
  title:           { fontSize: 20, fontWeight: '700', color: C.secondary, marginBottom: 8 },
  body:            { fontSize: 14, color: C.muted, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  btn:             { backgroundColor: C.secondary, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32, marginBottom: 12 },
  btnText:         { color: '#fff', fontWeight: '600', fontSize: 15 },
  btnSecondary:    { borderWidth: 1, borderColor: C.border, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32 },
  btnSecondaryText:{ color: C.secondary, fontWeight: '500', fontSize: 15 },
});
