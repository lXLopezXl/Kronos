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

  // 🏷️ Estados para el Control del Cupón y la API
  const [cupónTexto, setCupónTexto] = useState('');
  const [descuentoAplicado, setDescuentoAplicado] = useState(0); // Guarda el porcentaje (ej: 20)
  const [cargandoCupón, setCargandoCupón] = useState(false);

  // 🧮 Cálculos dinámicos basados en el estado del carrito y el cupón
  const valorDescontado = (total * descuentoAplicado) / 100;
  const totalFinal = total - valorDescontado;

  // 🌐 Función para validar el cupón con kronos-api
  const manejarAplicarCupon = async () => {
    if (!cupónTexto.trim()) {
      Alert.alert('Atención', 'Por favor ingresa un código de cupón.');
      return;
    }

    setCargandoCupón(true);
    try {
      const respuesta = await fetch(`http://192.168.40.74:3000/api/cupones/${cupónTexto.trim().toUpperCase()}`);
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

  // Redirección pasando el total real y los datos del descuento a la pantalla de envío
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

  // Si la colección temporal "cart" en Firestore está vacía
  if (!cart || cart.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="cart-outline" size={80} color="#1a1a1a" />
        <Text style={styles.emptyText}>TU CARRITO ESTÁ VACÍO</Text>
        <Text style={styles.subEmpty}>Explora la tienda y añade tus Kronos favoritos.</Text>
        <TouchableOpacity style={styles.exploreBtn} onPress={() => router.push('/(tabs)/index')}>
          <Text style={styles.exploreBtnText}>VER CATÁLOGO</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Si hay artículos en el carrito
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>CARRITO</Text>
        <Text style={styles.count}>{cart.length} {cart.length === 1 ? 'Producto' : 'Productos'}</Text>
      </View>

      <FlatList
        data={cart}
        keyExtractor={(item, index) => `${item.id}-${item.size}-${item.customColor || 'orig'}-${index}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => {
          const imgUri = item.image;
          const currentQty = item.quantity || 1;

          return (
            <View style={styles.itemRow}>
              <View style={styles.imageBg}>
                <Image source={{ uri: imgUri }} style={styles.itemImage} resizeMode="contain" />
              </View>
              
              <View style={styles.itemDetails}>
                <View style={styles.nameRow}>
                  <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                  <TouchableOpacity onPress={() => removeFromCart && removeFromCart(item.id, item.size)}>
                    <Ionicons name="trash-outline" size={18} color="#bb0000" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.itemSub}>Talla: {item.size}</Text>
                
                {item.customColor && (
                  <View style={styles.colorRow}>
                    <Text style={styles.itemSub}>Color: </Text>
                    <View style={[styles.colorDot, { backgroundColor: item.customColor }]} />
                  </View>
                )}

                <View style={styles.actionsRow}>
                  <Text style={styles.itemPrice}>
                    ${(item.price * currentQty).toLocaleString()}
                  </Text>
                  
                  <View style={styles.quantityControls}>
                    <TouchableOpacity 
                      style={styles.qtyBtn} 
                      onPress={() => {
                        if (currentQty > 1) {
                          updateQuantity && updateQuantity(item.id, item.size, currentQty - 1);
                        } else {
                          removeFromCart && removeFromCart(item.id, item.size);
                        }
                      }}
                    >
                      <Text style={styles.qtyBtnText}>-</Text>
                    </TouchableOpacity>
                    
                    <Text style={styles.qtyText}>{currentQty}</Text>
                    
                    <TouchableOpacity 
                      style={styles.qtyBtn} 
                      onPress={() => updateQuantity && updateQuantity(item.id, item.size, currentQty + 1)}
                    >
                      <Text style={styles.qtyBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          );
        }}
      />

      <View style={styles.footer}>
        <View style={styles.divider} />

        {/* 🎟️ Entrada de Código de Cupón */}
        <View style={styles.couponContainer}>
          <TextInput
            style={styles.couponInput}
            placeholder="¿Tienes un cupón?"
            placeholderTextColor="#555"
            autoCapitalize="characters"
            value={cupónTexto}
            onChangeText={setCupónTexto}
            editable={!cargandoCupón}
          />
          <TouchableOpacity 
            style={styles.couponButton} 
            onPress={manejarAplicarCupon}
            disabled={cargandoCupón}
          >
            {cargandoCupón ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.couponButtonText}>Aplicar</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Desglose de Precios */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>SUBTOTAL ESTIMADO</Text>
          <Text style={styles.totalValue}>${total.toLocaleString()}</Text>
        </View>

        {/* Fila del Descuento */}
        {descuentoAplicado > 0 && (
          <View style={[styles.totalRow, { marginBottom: 15 }]}>
            <Text style={[styles.totalLabel, { color: '#00FF66' }]}>DESCUENTO ({descuentoAplicado}%)</Text>
            <Text style={[styles.totalValue, { color: '#00FF66' }]}>-${valorDescontado.toLocaleString()}</Text>
          </View>
        )}

        {descuentoAplicado > 0 && <View style={[styles.divider, { marginVertical: 10 }]} />}

        <View style={[styles.totalRow, { marginBottom: 25 }]}>
          <Text style={styles.totalLabelFinal}>TOTAL A PAGAR</Text>
          <Text style={styles.totalValueFinal}>${totalFinal.toLocaleString()}</Text>
        </View>

        <TouchableOpacity style={styles.checkoutBtn} onPress={procederAlPago} activeOpacity={0.8}>
          <Text style={styles.checkoutBtnText}>PROCEDER AL PAGO</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', paddingHorizontal: 20 },
  center: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', padding: 20 },
  header: { marginTop: 60, marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  title: { color: '#fff', fontSize: 26, fontWeight: 'bold', letterSpacing: 1 },
  count: { color: '#bb0000', fontSize: 13, fontWeight: 'bold' },
  itemRow: { flexDirection: 'row', marginBottom: 15, backgroundColor: '#0a0a0a', padding: 15, borderRadius: 20, borderWidth: 1, borderColor: '#1a1a1a' },
  imageBg: { width: 85, height: 85, backgroundColor: '#111', borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  itemImage: { width: 75, height: 75 },
  itemDetails: { marginLeft: 15, flex: 1, justifyContent: 'space-between' },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemName: { color: '#fff', fontWeight: 'bold', fontSize: 16, flex: 0.9 },
  itemSub: { color: '#666', fontSize: 12, marginTop: 2 },
  colorRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  colorDot: { width: 10, height: 10, borderRadius: 5, marginLeft: 5 },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  itemPrice: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  quantityControls: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', borderRadius: 8, borderWidth: 1, borderColor: '#222' },
  qtyBtn: { paddingHorizontal: 14, paddingVertical: 6 },
  qtyBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  qtyText: { color: '#fff', fontSize: 14, fontWeight: 'bold', paddingHorizontal: 4 },
  footer: { marginBottom: 30, backgroundColor: '#000' },
  divider: { height: 1, backgroundColor: '#1a1a1a', marginVertical: 15 },
  couponContainer: { flexDirection: 'row', marginBottom: 18, backgroundColor: '#0a0a0a', borderRadius: 10, borderWidth: 1, borderColor: '#1a1a1a', overflow: 'hidden' },
  couponInput: { flex: 1, padding: 12, color: '#fff', fontSize: 14, fontWeight: '600' },
  couponButton: { backgroundColor: '#bb0000', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 18 },
  couponButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  totalLabel: { color: '#666', fontWeight: 'bold', fontSize: 12 },
  totalValue: { color: '#aaa', fontSize: 18, fontWeight: 'bold' },
  totalLabelFinal: { color: '#fff', fontWeight: 'bold', fontSize: 13, letterSpacing: 0.5 },
  totalValueFinal: { color: '#fff', fontSize: 26, fontWeight: 'bold' },
  checkoutBtn: { backgroundColor: '#fff', padding: 18, borderRadius: 12, alignItems: 'center' },
  checkoutBtnText: { color: '#000', fontWeight: 'bold', fontSize: 15, letterSpacing: 0.5 },
  emptyText: { color: '#fff', fontWeight: 'bold', marginTop: 15, fontSize: 16 },
  subEmpty: { color: '#444', textAlign: 'center', marginTop: 10, fontSize: 13, marginBottom: 25 },
  exploreBtn: { borderColor: '#bb0000', borderWidth: 1, paddingVertical: 12, paddingHorizontal: 30, borderRadius: 10 },
  exploreBtnText: { color: '#bb0000', fontWeight: 'bold', fontSize: 13 }
});