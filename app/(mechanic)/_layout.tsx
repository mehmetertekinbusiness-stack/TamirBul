import { Tabs } from 'expo-router';
import { Wrench, ClipboardText, Storefront, AddressBook } from 'phosphor-react-native';
import { C } from '../../lib/constants';

export default function MechanicLayout() {
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
          title: 'Dashboard',
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
        name="shop"
        options={{
          title: 'Dükkanım',
          tabBarIcon: ({ color, focused }) => (
            <Storefront size={22} color={color} weight={focused ? 'fill' : 'regular'} />
          ),
        }}
      />
      <Tabs.Screen
        name="suppliers"
        options={{
          title: 'Tedarikçiler',
          tabBarIcon: ({ color, focused }) => (
            <AddressBook size={22} color={color} weight={focused ? 'fill' : 'regular'} />
          ),
        }}
      />
    </Tabs>
  );
}
