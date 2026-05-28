import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from '../context/CartContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
        {/* StatusBar en blanco para resaltar sobre el fondo negro de Kronos */}
        <StatusBar style="light" />
        
        <Stack 
          screenOptions={{ 
            headerShown: false,
            contentStyle: { backgroundColor: '#000' } // Fondo negro global
          }}
        >
          {/* Flujos principales */}
          <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          
          {/* Pantalla de Detalle de Producto */}
          <Stack.Screen 
            name="(detail)/[id]" 
            options={{ 
              headerShown: true, 
              title: "DETALLE KRONOS",
              headerStyle: { backgroundColor: '#000' },
              headerTintColor: '#bb0000',
              headerTitleStyle: { 
                fontWeight: 'bold',
              },
              headerBackTitle: "Atrás",
              animation: 'slide_from_right'
            }} 
          />
          
          {/* Pantalla de Datos de Envío (Geolocalización) */}
          <Stack.Screen 
            name="envio" 
            options={{ 
              headerShown: true, 
              title: "DATOS DE ENTREGA",
              headerStyle: { backgroundColor: '#000' },
              headerTintColor: '#bb0000',
              headerTitleStyle: { fontWeight: 'bold' },
              headerBackTitle: "Atrás",
              animation: 'slide_from_bottom' // Transición limpia desde abajo tipo formulario
            }} 
          />
          
          {/* Pantalla de Administración */}
          <Stack.Screen 
            name="admin" 
            options={{ 
              headerShown: true, 
              title: "PANEL CONTROL",
              headerStyle: { backgroundColor: '#000' },
              headerTintColor: '#bb0000',
              headerTitleStyle: { fontWeight: 'bold' },
              animation: 'fade_from_bottom'
            }} 
          />
        </Stack>
      </CartProvider>
    </AuthProvider>
  );
}