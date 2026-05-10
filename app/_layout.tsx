import { View, Text, StatusBar, StyleSheet } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { Stack, useRouter } from 'expo-router';
import { supabase, setTokenGetter } from '../supabase';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { SessionCtx } from '../lib/session-context';
import { ClerkProvider, ClerkLoaded, useAuth } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const tokenCache = {
  async getToken(key: string) { return SecureStore.getItemAsync(key); },
  async saveToken(key: string, value: string) { return SecureStore.setItemAsync(key, value); },
  async clearToken(key: string) { return SecureStore.deleteItemAsync(key); },
};

ExpoSplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const unstable_settings = { initialRouteName: '(auth)' };

async function registerPushToken(userId: string) {
  try {
    if (!Device.isDevice) return;
    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;
    if (existing !== 'granted') {
      const { status: asked } = await Notifications.requestPermissionsAsync();
      status = asked;
    }
    if (status !== 'granted') return;
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    });
    await supabase.from('users').update({ push_token: token.data }).eq('id', userId);
  } catch (e) {
    if (__DEV__) console.warn('Push token error:', e);
  }
}

// ─── Minimal Splash ───────────────────────────────────────────────────────────
function SplashScreen() {
  return (
    <View style={s.splash}>
      <StatusBar barStyle="light-content" backgroundColor="#E8540A" />
      <Text style={s.brand}>TamirBul</Text>
      <Text style={s.sub}>OTO TAMİR · RANDEVU</Text>
    </View>
  );
}

// ─── Root Layout ──────────────────────────────────────────────────────────────
export default function RootLayout() {
  const publishableKey = Constants.expoConfig?.extra?.clerkPublishableKey as string;
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <ClerkLoaded>
        <AppLayout />
      </ClerkLoaded>
    </ClerkProvider>
  );
}

function AppLayout() {
  const { isSignedIn, userId: clerkUserId, getToken } = useAuth();
  const [authReady, setAuthReady] = useState(false);
  const [userId,    setUserId]    = useState<string | null>(null);
  const [userRole,  setUserRole]  = useState<string | null>(null);
  const router = useRouter();
  const lastTarget = useRef<string | null>(null);
  const pushRegistered = useRef(false);

  useEffect(() => {
    ExpoSplashScreen.hideAsync();
  }, []);

  async function fetchRole(id: string): Promise<string> {
    try {
      const { data } = await supabase.from('users').select('role').eq('clerk_id', id).maybeSingle();
      return data?.role || 'customer';
    } catch {
      return 'customer';
    }
  }

  function navigate(signedIn: boolean | undefined, role: string | null) {
    let target: string;
    if (!signedIn)              target = '/(auth)';
    else if (role === 'mechanic') target = '/(mechanic)';
    else                          target = '/(customer)';
    if (lastTarget.current === target) return;
    lastTarget.current = target;
    router.replace(target as any);
  }

  useEffect(() => {
    let mounted = true;

    async function onAuthChange() {
      if (isSignedIn && clerkUserId) {
        setTokenGetter(() => getToken());
        const role = await fetchRole(clerkUserId);
        if (!mounted) return;
        if (!pushRegistered.current) {
          pushRegistered.current = true;
          registerPushToken(clerkUserId);
        }
        setUserId(clerkUserId);
        setUserRole(role);
        navigate(true, role);
      } else {
        setTokenGetter(null);
        setUserId(null);
        setUserRole(null);
        navigate(false, null);
      }
      setAuthReady(true);
    }

    onAuthChange();
    return () => { mounted = false; };
  }, [isSignedIn, clerkUserId]);

  return (
    <ErrorBoundary>
      <SessionCtx.Provider value={{ userId, userRole }}>
        <Stack screenOptions={{ headerShown: false }} />
        {!authReady && <SplashScreen />}
      </SessionCtx.Provider>
    </ErrorBoundary>
  );
}

const s = StyleSheet.create({
  splash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#E8540A',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  brand: {
    fontSize: 42,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  sub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 12,
    letterSpacing: 5,
  },
});
