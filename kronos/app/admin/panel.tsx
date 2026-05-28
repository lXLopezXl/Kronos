// Archivo: app/admin/panel.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image
} from 'react-native';

import * as DocumentPicker from 'expo-document-picker';
import { uploadFullShoe, uploadBanner } from '../../services/shoeService';

export default function AdminPanel() {
  // --- ESTADOS PARA PRODUCTOS ---
  const [form, setForm] = useState({
    name: '',
    price: '',
    brand: ''
  });
  const [file, setFile] = useState<any>(null); 
  const [images, setImages] = useState<any[]>([]); 
  const [loading, setLoading] = useState(false);

  // --- ESTADOS PARA BANNERS ---
  const [bannerLoading, setBannerLoading] = useState(false);

  // Seleccionar modelo 3D
  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        setFile(result.assets[0]);
        Alert.alert("Modelo 3D", "Archivo .glb listo");
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo seleccionar el modelo");
    }
  };

  // Seleccionar Imágenes del Producto
  const handlePickImages = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: true,
        multiple: true 
      });

      if (!result.canceled) {
        setImages([...images, ...result.assets]);
      }
    } catch (error) {
      Alert.alert("Error", "No se pudieron seleccionar las imágenes");
    }
  };

  // Lógica para publicar producto
  const handlePublish = async () => {
    if (!form.name || !form.price || !form.brand || !file || images.length === 0) {
      Alert.alert("Error", "Llena todos los campos y sube al menos una foto.");
      return;
    }

    setLoading(true);
    try {
      await uploadFullShoe(form, file, images);
      Alert.alert("Exito", "Producto y multimedia subidos correctamente.");
      setForm({ name: '', price: '', brand: '' });
      setFile(null);
      setImages([]);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Hubo un problema al subir el producto.");
    } finally {
      setLoading(false);
    }
  };

  // --- LÓGICA PARA SUBIR BANNER AL CARRUSEL ---
  const handleUploadBanner = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      setBannerLoading(true);
      await uploadBanner(result.assets[0].uri);
      
      Alert.alert("Exito", "Imagen añadida al carrusel correctamente.");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo subir el banner.");
    } finally {
      setBannerLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 50 }}>
      {/* SECCIÓN DE PRODUCTOS */}
      <Text style={styles.title}>NUEVO PRODUCTO</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Nombre del Zapato"
          placeholderTextColor="#666"
          value={form.name}
          onChangeText={(val) => setForm({ ...form, name: val })}
        />

        <TextInput
          style={styles.input}
          placeholder="Marca"
          placeholderTextColor="#666"
          value={form.brand}
          onChangeText={(val) => setForm({ ...form, brand: val })}
        />

        <TextInput
          style={styles.input}
          placeholder="Precio"
          placeholderTextColor="#666"
          keyboardType="numeric"
          value={form.price}
          onChangeText={(val) => setForm({ ...form, price: val })}
        />

        <TouchableOpacity style={[styles.fileBtn, file && styles.successBtn]} onPress={handlePickDocument}>
          <Text style={styles.fileBtnText}>
            {file ? "MODELO 3D CARGADO" : "SELECCIONAR .GLB"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.fileBtn, images.length > 0 && styles.successBtn]} onPress={handlePickImages}>
          <Text style={styles.fileBtnText}>
            {images.length > 0 ? `${images.length} FOTOS CARGADAS` : "SELECCIONAR FOTOS"}
          </Text>
        </TouchableOpacity>

        <ScrollView horizontal style={styles.previewContainer}>
          {images.map((img, index) => (
            <Image key={index} source={{ uri: img.uri }} style={styles.previewImg} />
          ))}
        </ScrollView>

        <TouchableOpacity 
          style={styles.publishBtn} 
          onPress={handlePublish} 
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.publishBtnText}>PUBLICAR EN TIENDA</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* SEPARADOR VISUAL */}
      <View style={styles.separator} />

      {/* SECCIÓN DE BANNERS */}
      <Text style={styles.title}>CARRUSEL</Text>
      <View style={styles.bannerBox}>
        <Text style={styles.bannerSubtitle}>añadir imagen</Text>
        
        <TouchableOpacity 
          style={[styles.bannerBtn, bannerLoading && { opacity: 0.6 }]} 
          onPress={handleUploadBanner}
          disabled={bannerLoading}
        >
          {bannerLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.bannerBtnText}>SUBIR NUEVO BANNER</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 20 },
  title: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginTop: 20, marginBottom: 15, textAlign: 'left', letterSpacing: 1 },
  form: { gap: 15 },
  input: { backgroundColor: '#111', padding: 18, borderRadius: 10, color: '#fff', borderWidth: 1, borderColor: '#333' },
  fileBtn: { backgroundColor: '#1a1a1a', padding: 15, borderRadius: 10, alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#444' },
  successBtn: { borderColor: '#00bb00', backgroundColor: '#001a00' },
  fileBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  previewContainer: { flexDirection: 'row', marginVertical: 5 },
  previewImg: { width: 60, height: 60, borderRadius: 8, marginRight: 10, borderWidth: 1, borderColor: '#333' },
  publishBtn: { backgroundColor: '#bb0000', padding: 20, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  publishBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  
  separator: { height: 1, backgroundColor: '#222', marginVertical: 30 },
  bannerBox: { backgroundColor: '#111', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#222' },
  bannerSubtitle: { color: '#888', fontSize: 13, marginBottom: 20 },
  bannerBtn: { backgroundColor: '#333', padding: 15, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#444' },
  bannerBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 }
});