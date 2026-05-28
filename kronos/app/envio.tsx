// 📂 Archivo: app/envio.tsx
import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  ActivityIndicator 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCart } from '../context/CartContext'; // 👈 Importamos el carrito real para vaciarlo e inyectar los items
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function EnvioScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { cart, clearCart } = useCart(); // 👈 Traemos los items del carrito y la función de limpiar
  
  // 📥 Recibimos los datos de cobro y descuento calculados heredados del carrito
  const params = useLocalSearchParams();
  const descuentoAplicado = parseInt(params.descuentoInicial as string) || 0;
  const cuponNombre = (params.codigoCupon as string) || '';
  const total = parseFloat(params.totalCarrito as string) || 0; 

  // 📍 Estados del Formulario de Envío
  const [direccion, setDireccion] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [telefono, setTelefono] = useState('');
  const [procesandoOrden, setProcesandoOrden] = useState(false);

  // 🧮 Cálculos automáticos basados en lo heredado del carrito
  const valorDescontado = (total * descuentoAplicado) / 100;
  const totalFinal = total - valorDescontado;

  // 🛒 Procesar el envío final, subirlo a Firestore y redireccionar
  const manejarFormularioEnvio = async () => {
    if (!direccion || !ciudad || !telefono) {
      Alert.alert('Campos incompletos', 'Por favor llena todos los datos de envío.');
      return;
    }

    if (!user?.uid) {
      Alert.alert('Error de Sesión', 'Debes estar autenticado para finalizar el pedido.');
      return;
    }

    setProcesandoOrden(true);

    try {
      // 🚀 Mapeamos los items exactamente con la estructura que espera tu order-summary
      const itemsOrden = cart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity || 1,
        size: item.size,
        image: item.image,
        customColor: item.customColor || null
      }));

      // Inyección estructurada de datos en Firestore
      const docRef = await addDoc(collection(db, "orders"), {
        userId: user.uid,
        items: itemsOrden,
        subtotal: total,
        total: total, // Mantenemos compatibilidad base
        totalPagado: totalFinal, // El precio neto con descuento aplicado
        cuponAplicado: cuponNombre || null,
        porcentajeDescuento: descuentoAplicado,
        datosEnvio: {
          direccion,
          ciudad,
          telefono
        },
        status: 'en preparación',
        createdAt: serverTimestamp()
      });

      // Vaciar el carrito local y de Firestore una vez guardada la orden con éxito
      if (clearCart) await clearCart();

      Alert.alert(
        'Pedido Confirmado', 
        `Tu pedido por un total de $${totalFinal.toLocaleString()} será enviado a ${ciudad}.`,
        [
          {
            text: 'Ver Resumen',
            onPress: () => router.replace({
              pathname: '/(tabs)/order-summary',
              params: { orderId: docRef.id } // 👈 Sincroniza directo mandándole el ID recién creado
            })
          }
        ]
      );
    } catch (error) {
      console.error("Error al registrar la orden en Firebase:", error);
      Alert.alert("Error", "No se pudo procesar tu compra. Revisa tu conexión.");
    } finally {
      setProcesandoOrden(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>Datos de Envío</Text>

      {/* Formulario */}
      <View style={styles.form}>
        <Text style={styles.label}>Dirección de entrega</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Calle 45 #12-34"
          placeholderTextColor="#666"
          value={direccion}
          onChangeText={setDireccion}
          editable={!procesandoOrden}
        />

        <Text style={styles.label}>Ciudad</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Medellín"
          placeholderTextColor="#666"
          value={ciudad}
          onChangeText={setCiudad}
          editable={!procesandoOrden}
        />

        <Text style={styles.label}>Teléfono de contacto</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: 3001234567"
          placeholderTextColor="#666"
          keyboardType="phone-pad"
          value={telefono}
          onChangeText={setTelefono}
          editable={!procesandoOrden}
        />
      </View>

      {/* Resumen del cobro final heredado del carrito */}
      <View style={styles.summaryBox}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal:</Text>
          <Text style={styles.summarySubValue}>${total.toLocaleString()}</Text>
        </View>
        
        {/* Renderizado del descuento informativo si existe */}
        {descuentoAplicado > 0 && (
          <View style={[styles.summaryRow, { marginTop: 8 }]}>
            <Text style={[styles.summaryLabel, { color: '#00FF66' }]}>
              Descuento {cuponNombre ? `(${cuponNombre})` : `(${descuentoAplicado}%)`}:
            </Text>
            <Text style={[styles.summarySubValue, { color: '#00FF66' }]}>
              -${valorDescontado.toLocaleString()}
            </Text>
          </View>
        )}

        <View style={[styles.summaryRow, { marginTop: 12, borderTopWidth: 1, borderColor: '#222', paddingTop: 12 }]}>
          <Text style={styles.summaryLabelFinal}>Total a pagar:</Text>
          <Text style={styles.summaryValue}>${totalFinal.toLocaleString()}</Text>
        </View>
        <Text style={styles.paymentMethod}>Método: Pago contra entrega / Confirmación manual</Text>
      </View>

      {/* Botón de Acción Principal */}
      <TouchableOpacity 
        style={[styles.submitButton, procesandoOrden && { backgroundColor: '#00aa44' }]} 
        onPress={manejarFormularioEnvio} 
        disabled={procesandoOrden}
        activeOpacity={0.8}
      >
        {procesandoOrden ? (
          <ActivityIndicator color="#000" size="small" />
        ) : (
          <Text style={styles.submitButtonText}>Finalizar Pedido</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFF', marginBottom: 20, marginTop: 10 },
  form: { marginBottom: 20 },
  label: { fontSize: 14, color: '#AAA', marginBottom: 8, marginTop: 10 },
  input: { backgroundColor: '#121212', borderWidth: 1, borderColor: '#222', borderRadius: 8, padding: 12, color: '#FFF', fontSize: 16, marginBottom: 12 },
  summaryBox: { backgroundColor: '#121212', borderWidth: 1, borderColor: '#222', borderRadius: 8, padding: 16, marginBottom: 25, marginTop: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { color: '#888', fontSize: 14 },
  summarySubValue: { color: '#AAA', fontSize: 14, fontWeight: '600' },
  summaryLabelFinal: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  summaryValue: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  paymentMethod: { color: '#666', fontSize: 12, textAlign: 'center', marginTop: 12, fontStyle: 'italic' },
  submitButton: { backgroundColor: '#00FF66', padding: 16, borderRadius: 8, alignItems: 'center' },
  submitButtonText: { color: '#000', fontSize: 18, fontWeight: 'bold' }
});