import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { 
  View, Text, StyleSheet, ActivityIndicator, 
  Image, TouchableOpacity, ScrollView, Dimensions, Alert 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { db } from '../../services/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { Canvas } from '@react-three/fiber/native';
import { useGLTF, OrbitControls, Stage, Center } from '@react-three/drei/native';
import { useCart } from '../../context/CartContext'; 
import { Ionicons } from '@expo/vector-icons';
import * as THREE from 'three';

const { width } = Dimensions.get('window');
const SIZES = ['38', '39', '40', '41', '42', '43'];

const SHOE_COLORS = [
  { name: 'Original', color: null },
  { name: 'Rojo', color: '#ff0000' },
  { name: 'Azul', color: '#0000ff' },
  { name: 'Verde', color: '#00ff00' },
  { name: 'Negro', color: '#111111' },
  { name: 'Blanco', color: '#ffffff' },
];

function Model({ url, selectedColor }: { url: string, selectedColor: string | null }) {
  const { scene } = useGLTF(url);
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  useEffect(() => {
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (selectedColor) {
          (mesh.material as THREE.MeshStandardMaterial).color.set(selectedColor);
        }
      }
    });
  }, [clonedScene, selectedColor]);

  return <primitive object={clonedScene} />;
}

export default function DetailScreen() {
  const { id } = useLocalSearchParams();
  const { addToCart } = useCart();
  const router = useRouter();
  
  const [shoe, setShoe] = useState<any>(null);
  const [view3D, setView3D] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentColor, setCurrentColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState('40');

  useEffect(() => {
    const fetchShoe = async () => {
      try {
        const docSnap = await getDoc(doc(db, "shoes", id as string));
        if (docSnap.exists()) {
          setShoe({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
        console.error("Error al cargar producto:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchShoe();
  }, [id]);

  const handleAddToCart = () => {
    if (!shoe) return;

    // Estructura normalizada de datos limpiando arrays complejos
    const productToCart = {
      id: shoe.id,
      name: shoe.name,
      brand: shoe.brand || '',
      price: shoe.price,
      image: shoe.imageUrls && shoe.imageUrls.length > 0 ? shoe.imageUrls[0] : '',
      customColor: currentColor,
    };

    addToCart(productToCart, selectedSize);
    Alert.alert("Añadido", `${shoe.name} se agregó al carrito.`);
  };

  if (loading) return (
    <View style={styles.loader}>
      <ActivityIndicator size="large" color="#bb0000" />
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.viewerContainer}>
        {view3D ? (
          <>
            <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
              <ambientLight intensity={0.8} />
              <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
              <Suspense fallback={null}>
                <Stage preset="rembrandt" intensity={1} environment="city" adjustCamera={1.8} shadows={false}>
                  {shoe?.modelUrl && (
                    <Center top precise> 
                      <Model url={shoe.modelUrl} selectedColor={currentColor} />
                    </Center>
                  )}
                </Stage>
              </Suspense>
              <OrbitControls makeDefault enablePan={false} enableZoom={false} autoRotate={true} autoRotateSpeed={3} minPolarAngle={Math.PI / 2.5} maxPolarAngle={Math.PI / 2} />
            </Canvas>
            <View style={styles.loadingOverlay} pointerEvents="none">
               <ActivityIndicator color="#bb0000" size="small" />
            </View>
          </>
        ) : (
          <Image source={{ uri: shoe?.imageUrls?.[0] }} style={styles.mainImage} resizeMode="contain" />
        )}

        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.toggleBtn} onPress={() => setView3D(!view3D)}>
          <Text style={styles.toggleText}>{view3D ? "VER FOTO" : "PERSONALIZAR 3D"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.brand}>{shoe?.brand?.toUpperCase()}</Text>
        <Text style={styles.name}>{shoe?.name}</Text>
        
        {view3D && (
          <View style={styles.optionsContainer}>
            <Text style={styles.sectionTitle}>Color personalizado:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {SHOE_COLORS.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.colorCircle, { backgroundColor: item.color || '#222' }, currentColor === item.color && styles.activeColorCircle]}
                  onPress={() => setCurrentColor(item.color)}
                >
                  {!item.color && <Text style={{fontSize: 8, color: '#fff', fontWeight: 'bold'}}>ORIG</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.optionsContainer}>
          <Text style={styles.sectionTitle}>Talla (US):</Text>
          <View style={styles.sizeGrid}>
            {SIZES.map((size) => (
              <TouchableOpacity key={size} style={[styles.sizeCard, selectedSize === size && styles.activeSizeCard]} onPress={() => setSelectedSize(size)}>
                <Text style={[styles.sizeText, selectedSize === size && styles.activeSizeText]}>{size}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Precio de lista</Text>
          <Text style={styles.price}>${shoe?.price?.toLocaleString()}</Text>
        </View>

        <TouchableOpacity style={styles.buyBtn} onPress={handleAddToCart} activeOpacity={0.8}>
          <Text style={styles.buyBtnText}>AÑADIR AL CARRITO</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loader: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
  viewerContainer: { height: width, backgroundColor: '#0a0a0a', overflow: 'hidden', position: 'relative' },
  mainImage: { width: '100%', height: '100%' },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: -1 },
  backBtn: { position: 'absolute', top: 50, left: 20, backgroundColor: 'rgba(0,0,0,0.6)', padding: 12, borderRadius: 14, zIndex: 50 },
  toggleBtn: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#bb0000', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25, zIndex: 50 },
  toggleText: { color: '#fff', fontWeight: 'bold', fontSize: 11, letterSpacing: 1 },
  infoSection: { padding: 25, backgroundColor: '#000', borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -25, borderTopWidth: 1, borderColor: '#0a0a0a' },
  brand: { color: '#bb0000', fontWeight: 'bold', letterSpacing: 2, fontSize: 12 },
  name: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginVertical: 5 },
  optionsContainer: { marginVertical: 12 },
  sectionTitle: { color: '#555', fontSize: 12, marginBottom: 12, fontWeight: 'bold' },
  colorCircle: { width: 44, height: 44, borderRadius: 22, marginRight: 15, borderWidth: 2, borderColor: '#1c1c1c', justifyContent: 'center', alignItems: 'center' },
  activeColorCircle: { borderColor: '#fff', transform: [{ scale: 1.08 }] },
  sizeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  sizeCard: { width: 58, height: 46, borderRadius: 12, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#1a1a1a' },
  activeSizeCard: { backgroundColor: '#bb0000', borderColor: '#bb0000' },
  sizeText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  activeSizeText: { color: '#fff' },
  priceContainer: { marginVertical: 20 },
  priceLabel: { color: '#555', fontSize: 13, fontWeight: 'bold' },
  price: { color: '#fff', fontSize: 34, fontWeight: 'bold', marginTop: 2 },
  buyBtn: { backgroundColor: '#fff', padding: 20, borderRadius: 14, alignItems: 'center', marginBottom: 40 },
  buyBtnText: { color: '#000', fontWeight: 'bold', fontSize: 15 }
});