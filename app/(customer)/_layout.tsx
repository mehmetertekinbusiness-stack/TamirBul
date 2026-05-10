import { Tabs } from 'expo-router';
import { Wrench, ClipboardText, Car, User } from 'phosphor-react-native';
import { C } from '../../lib/constants';

export default function CustomerLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: C.surface,
          borderTopWidth: 0.5,
          borderTopColor: C.border,
        },
        tabBarActiveTintColor:   C.primary,
        tabBarInactiveTintColor: C.muted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Keşfet',
          tabBarIcon: ({ color, focused }) => (
            <Wrench size={22} color={color} weight={focused ? 'fill' : 'regular'} />
          ),
        }}
      />
      <Tabs.Screen
        name="work-orders"
        options={{
          title: 'İş Emirleri',
          tabBarIcon: ({ color, focused }) => (
            <ClipboardText size={22} color={color} weight={focused ? 'fill' : 'regular'} />
          ),
        }}
      />
      <Tabs.Screen
        name="vehicles"
        options={{
          title: 'Araçlarım',
          tabBarIcon: ({ color, focused }) => (
            <Car size={22} color={color} weight={focused ? 'fill' : 'regular'} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Hesabım',
          tabBarIcon: ({ color, focused }) => (
            <User size={22} color={color} weight={focused ? 'fill' : 'regular'} />
          ),
        }}
      />
    </Tabs>
  );
}
