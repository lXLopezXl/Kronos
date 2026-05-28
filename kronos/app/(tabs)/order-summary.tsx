// 📂 Archivo: app/(tabs)/order-summary.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/firebaseConfig';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function OrderSummaryScreen() {
  const { user } = useAuth();
  const { orderId } = useLocalSearchParams(); 
  const router = useRouter();
  const [lastOrder, setLastOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      try {
        // 1. Si venimos directamente redireccionados por registrar la orden con un ID específico
        if (orderId) {
          const docRef = doc(db, "orders", orderId as string);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setLastOrder({ id: docSnap.id, ...docSnap.data() });
            setLoading(false);
            return;
          }
        }

        // 2. Fallback: Si entra de forma directa desde los tabs, busca la última orden del usuario
        if (!user?.uid) {
          setLoading(false);
          return;
        }

        const q = query(collection(db, "orders"), where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const fetchedOrders = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              createdAtDate: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || 0)
            };
          });

          // Ordenar por fecha descendente (más recientes primero)
          fetchedOrders.sort((a: any, b: any) => b.createdAtDate - a.createdAtDate);

          const validOrder = fetchedOrders.find((order: any) => order.items && Array.isArray(order.items));
          setLastOrder(validOrder || null);
        } else {
          setLastOrder(null);
        }
      } catch (error) { 
        console.error("Error al obtener el pedido:", error); 
      } finally { 
        setLoading(false); 
      }
    };

    fetchOrder();
  }, [user, orderId]);

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator color="#bb0000" size="large" />
    </View>
  );

  if (!lastOrder) return (
    <View style={styles.center}>
      <Ionicons name="receipt-outline" size={80} color="#1a1a1a" />
      <Text style={styles.noOrderText}>NO TIENES PEDIDOS RECIENTES</Text>
      <Text style={styles.subNoOrder}>Tus compras aparecerán aquí una vez confirmadas.</Text>
      <TouchableOpacity style={styles.backCatalogBtn} onPress={() => router.replace('/(tabs)/index')}>
        <Text style={styles.backCatalogText}>VOLVER A LA TIENDA</Text>
      </TouchableOpacity>
    </View>
  );

  // 🧮 Cálculos dinámicos del desglose de precios cargados directamente desde la base de datos
  const subtotalProductos = lastOrder.subtotal !== undefined 
    ? lastOrder.subtotal 
    : (lastOrder.items?.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0) || 0);
  
  const totalPagadoReal = lastOrder.totalPagado !== undefined ? lastOrder.totalPagado : (lastOrder.total || subtotalProductos);
  const montoDescontado = subtotalProductos - totalPagadoReal;

  return (
    <View style={styles.container}>
      <View style={styles.headerTitleRow}>
        <View style={styles.headerTitle}>
          <Text style={styles.title}>RESUMEN DE PEDIDO</Text>
          <Text style={styles.orderId}>ORDEN: #{lastOrder.id.toUpperCase()}</Text>
        </View>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.replace('/(tabs)/index')} activeOpacity={0.7}>
          <Ionicons name="close-outline" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={lastOrder.items}
        keyExtractor={(_, index) => index.toString()}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const imgUri = item.image || (item.imageUrls && item.imageUrls[0]);

          return (
            <View style={styles.itemRow}>
              <View style={styles.imageBg}>
                <Image source={{ uri: imgUri }} style={styles.itemImage} resizeMode="contain" />
              </View>
              <View style={styles.itemDetails}>
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.itemSub}>Talla: {item.size} | Cant: {item.quantity}</Text>
                {item.customColor && (
                   <View style={styles.colorRow}>
                      <Text style={styles.itemSub}>Color: </Text>
                      <View style={[styles.colorDot, { backgroundColor: item.customColor }]} />
                   </View>
                )}
                <Text style={styles.itemPrice}>
                  ${item.price ? (item.price * item.quantity).toLocaleString() : '0'}
                </Text>
              </View>
            </View>
          );
        }}
        ListFooterComponent={
          <View style={styles.footer}>
            <View style={styles.divider} />
            
            {/* 🏷️ Desglose Completo Sincronizado */}
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Subtotal</Text>
              <Text style={styles.priceValue}>${subtotalProductos.toLocaleString()}</Text>
            </View>

            {montoDescontado > 0 && (
              <View style={[styles.priceRow, { marginTop: 8 }]}>
                <Text style={[styles.priceLabel, { color: '#00FF66' }]}>
                  Descuento {lastOrder.cuponAplicado ? `(${lastOrder.cuponAplicado})` : ''}
                </Text>
                <Text style={[styles.priceValue, { color: '#00FF66' }]}>
                  -${montoDescontado.toLocaleString()}
                </Text>
              </View>
            )}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TOTAL PAGADO</Text>
              <Text style={styles.totalValue}>${totalPagadoReal.toLocaleString()}</Text>
            </View>

            <View style={styles.statusBox}>
              <Ionicons name="cube-outline" size={22} color="#fff" />
              <View style={{ flex: 1 }}>
                <Text style={styles.statusText}>ESTADO: {(lastOrder.status || 'en preparación').toUpperCase()}</Text>
                <Text style={styles.statusSub}>Estamos procesando tus Kronos en bodega.</Text>
              </View>
            </View>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', paddingHorizontal: 20 },
  center: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', padding: 20 },
  headerTitleRow: { marginTop: 60, marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { flex: 0.9 },
  closeBtn: { backgroundColor: '#111', padding: 8, borderRadius: 12, borderWidth: 1, borderColor: '#222' },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold', letterSpacing: 0.5 },
  orderId: { color: '#bb0000', fontSize: 11, fontWeight: 'bold', marginTop: 5, letterSpacing: 1 },
  itemRow: { flexDirection: 'row', marginBottom: 15, backgroundColor: '#0a0a0a', padding: 15, borderRadius: 20, borderWidth: 1, borderColor: '#1a1a1a' },
  imageBg: { width: 75, height: 75, backgroundColor: '#111', borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  itemImage: { width: 65, height: 65 },
  itemDetails: { marginLeft: 15, flex: 1, justifyContent: 'center' },
  itemName: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  itemSub: { color: '#666', fontSize: 12, marginTop: 2 },
  colorRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  colorDot: { width: 10, height: 10, borderRadius: 5, marginLeft: 5 },
  itemPrice: { color: '#fff', fontWeight: 'bold', marginTop: 5, fontSize: 15 },
  footer: { marginTop: 10, marginBottom: 40 },
  divider: { height: 1, backgroundColor: '#1a1a1a', marginVertical: 20 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceLabel: { color: '#666', fontSize: 14 },
  priceValue: { color: '#aaa', fontSize: 15, fontWeight: '500' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, borderTopWidth: 1, borderColor: '#1a1a1a', paddingTop: 15 },
  totalLabel: { color: '#fff', fontWeight: 'bold', fontSize: 13, letterSpacing: 0.5 },
  totalValue: { color: '#fff', fontSize: 26, fontWeight: 'bold' },
  statusBox: { flexDirection: 'row', backgroundColor: '#bb0000', padding: 18, borderRadius: 16, marginTop: 30, alignItems: 'center', gap: 15 },
  statusText: { color: '#fff', fontWeight: 'bold', fontSize: 13, letterSpacing: 0.5 },
  statusSub: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2 },
  noOrderText: { color: '#fff', fontWeight: 'bold', marginTop: 15, fontSize: 16 },
  subNoOrder: { color: '#444', textAlign: 'center', marginTop: 10, fontSize: 13, marginBottom: 25 },
  backCatalogBtn: { borderColor: '#bb0000', borderWidth: 1, paddingVertical: 12, paddingHorizontal: 25, borderRadius: 10 },
  backCatalogText: { color: '#bb0000', fontWeight: 'bold', fontSize: 12 }
});