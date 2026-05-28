import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: { backgroundColor: '#000', borderTopColor: '#111', height: 60 },
      tabBarActiveTintColor: '#bb0000',
      tabBarInactiveTintColor: '#555',
    }}>
      <Tabs.Screen name="index" options={{
        title: 'Tienda',
        tabBarIcon: ({ color, size }) => <Ionicons name="flash" size={size} color={color} />
      }} />
      <Tabs.Screen name="search" options={{
        title: 'Buscar',
        tabBarIcon: ({ color, size }) => <Ionicons name="search" size={size} color={color} />
      }} />
      <Tabs.Screen name="cart" options={{
        title: 'Carrito',
        tabBarIcon: ({ color, size }) => <Ionicons name="cart" size={size} color={color} />
      }} />
      <Tabs.Screen name="profile" options={{
        title: 'Perfil',
        tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />
      }} />
    </Tabs>
  );
}