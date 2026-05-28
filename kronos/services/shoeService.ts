import { db, storage } from './firebaseConfig';
import { collection, addDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  uploadBytes
} from 'firebase/storage';

// --- SECCIÓN DE PRODUCTOS ---
export const uploadFullShoe = async (shoeData: any, modelFile: any, imageFiles: any[]) => {
  try {
    if (!modelFile || !modelFile.uri) throw new Error("Modelo 3D inválido");
    const safeName = shoeData.name.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");
    const timestamp = Date.now();

    const modelResponse = await fetch(modelFile.uri);
    const modelBlob = await modelResponse.blob();
    const modelRef = ref(storage, `models/${safeName}_${timestamp}.glb`);
    const uploadTask = uploadBytesResumable(modelRef, modelBlob, { contentType: 'model/gltf-binary' });

    await new Promise<void>((resolve, reject) => {
      uploadTask.on('state_changed', null, (err) => reject(err), () => resolve());
    });
    const modelUrl = await getDownloadURL(uploadTask.snapshot.ref);

    const imageUrls = await Promise.all(
      imageFiles.map(async (img, index) => {
        const imgRes = await fetch(img.uri);
        const imgBlob = await imgRes.blob();
        const imgRef = ref(storage, `images/${safeName}_${timestamp}_${index}.jpg`);
        await uploadBytes(imgRef, imgBlob);
        return getDownloadURL(imgRef);
      })
    );

    const docRef = await addDoc(collection(db, "shoes"), {
      ...shoeData,
      price: parseFloat(shoeData.price),
      modelUrl,
      imageUrls,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error en subida:", error);
    throw error;
  }
};

export const deleteShoe = async (shoeId: string, modelUrl: string, imageUrls: string[]) => {
  try {
    if (modelUrl) await deleteObject(ref(storage, modelUrl));
    if (imageUrls) await Promise.all(imageUrls.map(url => deleteObject(ref(storage, url))));
    await deleteDoc(doc(db, "shoes", shoeId));
    return true;
  } catch (error) {
    console.error("Error al eliminar zapato:", error);
    throw error;
  }
};

// --- SECCIÓN DE BANNERS ---
export const uploadBanner = async (imageUri: string) => {
  try {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    const bannerRef = ref(storage, `banners/banner_${Date.now()}.jpg`);
    await uploadBytes(bannerRef, blob);
    const downloadURL = await getDownloadURL(bannerRef);
    await addDoc(collection(db, "banners"), { imageUrl: downloadURL, createdAt: serverTimestamp() });
    return true;
  } catch (error) { throw error; }
};

export const deleteBanner = async (bannerId: string, imageUrl: string) => {
  try {
    await deleteObject(ref(storage, imageUrl));
    await deleteDoc(doc(db, "banners", bannerId));
    return true;
  } catch (error) { throw error; }
};
export const addToCartFirebase = async (userId: string, shoe: any, size: string, customColor: string | null) => {
  try {
    const cartItem = {
      userId: userId,           // 'userId' coincide con tu índice de órdenes
      shoeId: shoe.id,         // ID real del documento del zapato
      name: shoe.name,
      price: shoe.price,
      image: shoe.imageUrls?.[0] || '',
      size: size,
      customColor: customColor,
      quantity: 1,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "cart"), cartItem);
    return docRef.id;
  } catch (error) {
    console.error("Error al agregar al carrito:", error);
    throw error;
  }
};

/**
 * Procesa la compra: Crea la orden y LIMPIA el carrito del usuario
 */
export const checkoutOrder = async (userId: string, cartItems: any[], total: number) => {
  try {
    // 1. Crear el pedido en la colección 'orders'
    const orderData = {
      userId: userId,
      items: cartItems,
      total: total,
      status: 'pending',
      createdAt: serverTimestamp(), // Esto es vital para el índice que creaste
    };

    const orderRef = await addDoc(collection(db, "orders"), orderData);

    // 2. Limpiar el carrito del usuario en Firestore
    // (Buscamos todos los docs del usuario en 'cart' y los borramos)
    const { getDocs, query, where, writeBatch } = require('firebase/firestore');
    const q = query(collection(db, "cart"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    
    const batch = writeBatch(db);
    querySnapshot.forEach((doc: any) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();

    return orderRef.id;
  } catch (error) {
    console.error("Error en el checkout:", error);
    throw error;
  }
};