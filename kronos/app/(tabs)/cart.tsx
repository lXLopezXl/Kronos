// 📂 Archivo: app/(tabs)/cart.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  TextInput, 
  Alert, 
  ActivityIndicator 
} from 'react-native';
import { useCart } from '../../context/CartContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function CartScreen() {
  const { cart, total, updateQuantity, removeFromCart } = useCart();
  const router = useRouter();

  const [cupónTexto, setCupónTexto] = useState('');
  const [descuentoAplicado, setDescuentoAplicado] = useState(0); 
  const [cargandoCupón, setCargandoCupón] = useState(false);

  const valorDescontado = (total * descuentoAplicado) / 100;
  const totalFinal = total - valorDescontado;

  // 🌐 Función para validar el cupón con la API desplegada en Render
  const manejarAplicarCupon = async () => {
    if (!cupónTexto.trim()) {
      Alert.alert('Atención', 'Por favor ingresa un código de cupón.');
      return;
    }

    setCargandoCupón(true);
    try {
      // URL de producción conectada a Render
      const respuesta = await fetch(`https://kronos-1bsm.onrender.com/api/cupones/${cupónTexto.trim().toUpperCase()}`);
      const data = await respuesta.json();

      if (respuesta.ok && data.valido) {
        setDescuentoAplicado(data.porcentaje);
        Alert.alert('¡Éxito!', `Cupón aplicado. Obtienes un ${data.porcentaje}% de descuento.`);
      } else {
        setDescuentoAplicado(0);
        Alert.alert('Cupón Inválido', data.mensaje || 'El cupón ingresado no existe o expiró.');
      }
    } catch (error) {
      console.error('Error validando cupón:', error);
      Alert.alert('Error de Conexión', 'No se pudo conectar con el servidor de Kronos.');
    } finally {
      setCargandoCupón(false);
    }
  };

  const procederAlPago = () => {
    router.push({
      pathname: '/envio',
      params: { 
        totalCarrito: total,
        descuentoInicial: descuentoAplicado,
        codigoCupon: descuentoAplicado > 0 ? cupónTexto.trim().toUpperCase() : ''
      }
    });
  };

  if (!cart || cart.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="cart-outline" size={80} color="#1a1a1a" />
        <Text style={styles.emptyText}>TU CARRITO ESTÁ VACÍO</Text>
        <TouchableOpacity style={styles.exploreBtn} onPress={() => router.push('/(tabs)/index')}>
          <Text style={styles.exploreBtnText}>VER CATÁLOGO</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>CARRITO</Text>
      </View>

      <FlatList
        data={cart}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            <Image source={{ uri: item.image }} style={styles.itemImage} />
            <View style={styles.itemDetails}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>${(item.price * (item.quantity || 1)).toLocaleString()}</Text>
            </View>
            <TouchableOpacity onPress={() => removeFromCart && removeFromCart(item.id, item.size)}>
              <Ionicons name="trash-outline" size={20} color="#bb0000" />
            </TouchableOpacity>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.couponContainer}>
          <TextInput
            style={styles.couponInput}
            placeholder="¿Cupón?"
            autoCapitalize="characters"
            value={cupónTexto}
            onChangeText={setCupónTexto}
            editable={!cargandoCupón}
          />
          <TouchableOpacity style={styles.couponButton} onPress={manejarAplicarCupon} disabled={cargandoCupón}>
            {cargandoCupón ? <ActivityIndicator color="#fff" /> : <Text style={styles.couponButtonText}>Aplicar</Text>}
          </TouchableOpacity>
        </View>

        <Text style={styles.totalValueFinal}>TOTAL: ${totalFinal.toLocaleString()}</Text>
        <TouchableOpacity style={styles.checkoutBtn} onPress={procederAlPago}>
          <Text style={styles.checkoutBtnText}>PROCEDER AL PAGO</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 20 },
  header: { marginTop: 50, marginBottom: 20 },
  title: { color: '#fff', fontSize: 26, fontWeight: 'bold' },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, backgroundColor: '#111', padding: 10, borderRadius: 10 },
  itemImage: { width: 60, height: 60, borderRadius: 5 },
  itemDetails: { flex: 1, marginLeft: 15 },
  itemName: { color: '#fff', fontWeight: 'bold' },
  itemPrice: { color: '#aaa', marginTop: 5 },
  footer: { borderTopWidth: 1, borderTopColor: '#333', paddingTop: 20 },
  couponContainer: { flexDirection: 'row', marginBottom: 20 },
  couponInput: { flex: 1, backgroundColor: '#222', color: '#fff', padding: 10, borderRadius: 5 },
  couponButton: { backgroundColor: '#bb0000', padding: 10, borderRadius: 5, marginLeft: 10, justifyContent: 'center' },
  couponButtonText: { color: '#fff', fontWeight: 'bold' },
  totalValueFinal: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'right' },
  checkoutBtn: { backgroundColor: '#fff', padding: 15, borderRadius: 10, alignItems: 'center' },
  checkoutBtnText: { fontWeight: 'bold' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  emptyText: { color: '#fff', fontSize: 18, marginVertical: 20 },
  exploreBtn: { borderColor: '#bb0000', borderWidth: 1, padding: 10, borderRadius: 5 },
  exploreBtnText: { color: '#bb0000' }
});