import React, { useEffect, useState, useRef } from 'react';
import { 
  View, Text, StyleSheet, FlatList, Dimensions, 
  Image, TouchableOpacity, ActivityIndicator, Animated, Alert 
} from 'react-native';
import { db } from '../../services/firebaseConfig';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { deleteShoe, deleteBanner } from '../../services/shoeService'; 
import { useAuth } from '../../context/AuthContext'; 
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; 

const { width } = Dimensions.get('window');

export default function CatalogScreen() {
  const { user } = useAuth();
  const [shoes, setShoes] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  
  const router = useRouter();
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const qShoes = query(collection(db, "shoes"), orderBy("createdAt", "desc"));
    const unsubShoes = onSnapshot(qShoes, (snap) => {
      setShoes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setFetching(false);
    });

    const qBanners = query(collection(db, "banners"), orderBy("createdAt", "desc"));
    const unsubBanners = onSnapshot(qBanners, (snap) => {
      setBanners(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubShoes(); unsubBanners(); };
  }, []);

  // Loop Automático
  useEffect(() => {
    if (banners.length > 1) {
      const timer = setInterval(() => {
        let nextIndex = (activeIndex + 1) % banners.length;
        flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
        setActiveIndex(nextIndex);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [activeIndex, banners]);

  const renderHeader = () => (
    <View>
      <Animated.FlatList
        ref={flatListRef}
        data={banners}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / width));
        }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        renderItem={({ item, index }) => {
          const scale = scrollX.interpolate({
            inputRange: [(index - 1) * width, index * width, (index + 1) * width],
            outputRange: [0.9, 1, 0.9],
            extrapolate: 'clamp',
          });

          return (
            <View style={{ width: width, alignItems: 'center', paddingVertical: 10 }}>
              <Animated.View style={[styles.bannerCard, { transform: [{ scale }] }]}>
                {user?.rol === 'admin' && (
                  <TouchableOpacity 
                    style={styles.deleteBannerBtn} 
                    onPress={() => Alert.alert("Borrar", "¿Quitar banner?", [
                      { text: "No" }, { text: "Sí", onPress: () => deleteBanner(item.id, item.imageUrl) }
                    ])}
                  >
                    <Ionicons name="close-circle" size={26} color="#ff0000" />
                  </TouchableOpacity>
                )}
                <Image source={{ uri: item.imageUrl }} style={styles.bannerImage} />
              </Animated.View>
            </View>
          );
        }}
      />
      
      {/* INDICADORES CORREGIDOS (USANDO scaleX) */}
      <View style={styles.indicatorContainer}>
        {banners.map((_, index) => {
          const scaleX = scrollX.interpolate({
            inputRange: [(index - 1) * width, index * width, (index + 1) * width],
            outputRange: [1, 2.5, 1],
            extrapolate: 'clamp',
          });
          const opacity = scrollX.interpolate({
            inputRange: [(index - 1) * width, index * width, (index + 1) * width],
            outputRange: [0.4, 1, 0.4],
            extrapolate: 'clamp',
          });
          return (
            <Animated.View 
              key={index} 
              style={[styles.indicator, { opacity, transform: [{ scaleX }] }]} 
            />
          );
        })}
      </View>
      <Text style={styles.sectionTitle}>PRODUCTOS DISPONIBLES</Text>
    </View>
  );

  const renderShoeItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      {user?.rol === 'admin' && (
        <TouchableOpacity style={styles.deleteBadge} onPress={() => {
            Alert.alert("Eliminar", "¿Borrar zapato?", [
                { text: "No" }, { text: "Sí", onPress: () => deleteShoe(item.id, item.modelUrl, item.imageUrls) }
            ])
        }}>
          <Ionicons name="trash" size={16} color="#fff" />
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={() => router.push(`/(detail)/${item.id}`)}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: item.imageUrls?.[0] }} style={styles.productImage} resizeMode="contain" />
        </View>
        <Text style={styles.shoeName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.shoePrice}>${item.price}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={require('../../assets/images/kronoslogo.png')} style={styles.smallLogo} resizeMode="contain" />
        <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={styles.userIcon}>
          <Text style={styles.userInitial}>{user?.name?.charAt(0).toUpperCase() || 'U'}</Text>
        </TouchableOpacity>
      </View>

      {fetching ? (
        <ActivityIndicator size="large" color="#bb0000" style={{marginTop: 50}} />
      ) : (
        <FlatList
          ListHeaderComponent={renderHeader}
          data={shoes}
          numColumns={2}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={renderShoeItem}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 10 },
  smallLogo: { width: 100, height: 40 },
  userIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#bb0000', justifyContent: 'center', alignItems: 'center' },
  userInitial: { color: '#fff', fontWeight: 'bold' },
  carouselContainer: { height: 180 },
  bannerCard: { width: width - 40, height: 160, borderRadius: 15, backgroundColor: '#111', overflow: 'hidden', borderWidth: 1, borderColor: '#333' },
  bannerImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  deleteBannerBtn: { position: 'absolute', top: 10, right: 10, zIndex: 30, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 15 },
  indicatorContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 10, marginBottom: 20 },
  indicator: { height: 8, width: 8, borderRadius: 4, backgroundColor: '#bb0000', marginHorizontal: 6 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginHorizontal: 20, borderLeftWidth: 3, borderLeftColor: '#bb0000', paddingLeft: 10, marginBottom: 15 },
  listContent: { paddingHorizontal: 5 },
  card: { flex: 1, backgroundColor: '#0a0a0a', margin: 8, borderRadius: 15, padding: 10, borderWidth: 1, borderColor: '#1a1a1a' },
  imageContainer: { height: 120, backgroundColor: '#111', borderRadius: 10, justifyContent: 'center', marginBottom: 10 },
  productImage: { width: '100%', height: '100%' },
  shoeName: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  shoePrice: { color: '#666', fontSize: 13 },
  deleteBadge: { position: 'absolute', top: 5, right: 5, backgroundColor: 'rgba(255,0,0,0.8)', padding: 6, borderRadius: 15, zIndex: 10 }
});