import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../services/firebaseConfig';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc,
  serverTimestamp, 
  writeBatch,
  onSnapshot 
} from 'firebase/firestore';
import { useAuth } from './AuthContext';

// Interfaz estricta y unificada para todo el flujo del carrito
export interface CartItem {
  id: string; // Representa el ID del calzado (shoeId en Firestore)
  name: string;
  brand?: string;
  price: number;
  size: string;
  quantity: number;
  image: string; 
  customColor?: string | null;
}

// Estructura para los datos de entrega que vienen del formulario
export interface ShippingDetails {
  direccion: string;
  ciudad: string;
  telefono: string;
  notas: string;
}

interface CartContextData {
  cart: CartItem[];
  total: number;
  addToCart: (product: Omit<CartItem, 'quantity' | 'size'>, size: string) => Promise<void>;
  removeFromCart: (productId: string, size: string) => Promise<void>;
  updateQuantity: (productId: string, size: string, newQuantity: number) => Promise<void>;
  clearCart: () => void;
  // 🌟 CORRECCIÓN: Ahora acepta el parámetro con los datos recolectados en app/envio.tsx
  processCheckout: (shippingDetails: ShippingDetails) => Promise<string | null>;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);

  // Sincronización en tiempo real con la colección "cart" de Firestore
  useEffect(() => {
    if (!user?.uid) {
      setCart([]);
      return;
    }

    const q = query(collection(db, "cart"), where("userId", "==", user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const firestoreCartItems: CartItem[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: data.shoeId || docSnap.id, // Mapeo crítico de shoeId al id de la UI
          name: data.name || '',
          brand: data.brand || '',
          price: Number(data.price) || 0,
          size: data.size || '40',
          quantity: Number(data.quantity) || 1,
          image: data.image || '',
          customColor: data.customColor || null
        };
      });
      
      setCart(firestoreCartItems);
    }, (error) => {
      console.error("Error en el listener del carrito:", error);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Recalcular subtotal automáticamente al cambiar el estado local 'cart'
  useEffect(() => {
    const newTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    setTotal(newTotal);
  }, [cart]);

  // FUNCIÓN: Añadir o incrementar cantidad en Firestore
  const addToCart = async (product: Omit<CartItem, 'quantity' | 'size'>, size: string) => {
    if (!user?.uid) return;

    try {
      const q = query(
        collection(db, "cart"),
        where("userId", "==", user.uid),
        where("shoeId", "==", product.id),
        where("size", "==", size)
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const cartDocRef = doc(db, "cart", snapshot.docs[0].id);
        const currentQty = snapshot.docs[0].data().quantity || 1;
        await updateDoc(cartDocRef, { quantity: currentQty + 1 });
      } else {
        await addDoc(collection(db, "cart"), {
          userId: user.uid,
          shoeId: product.id,
          name: product.name,
          brand: product.brand || '',
          price: product.price,
          image: product.image, 
          size: size,
          customColor: product.customColor || null,
          quantity: 1,
          createdAt: serverTimestamp()
        });
      }
    } catch (e) {
      console.error("Error al añadir a Firestore:", e);
    }
  };

  // FUNCIÓN: Actualizar cantidad numérica (+ o -)
  const updateQuantity = async (productId: string, size: string, newQuantity: number) => {
    if (newQuantity < 1 || !user?.uid) return;

    try {
      const q = query(
        collection(db, "cart"),
        where("userId", "==", user.uid),
        where("shoeId", "==", productId),
        where("size", "==", size)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const cartDocRef = doc(db, "cart", snapshot.docs[0].id);
        await updateDoc(cartDocRef, { quantity: newQuantity });
      }
    } catch (e) {
      console.error("Error al modificar cantidad:", e);
    }
  };

  // FUNCIÓN: Remover fila completa
  const removeFromCart = async (productId: string, size: string) => {
    if (!user?.uid) return;

    try {
      const q = query(
        collection(db, "cart"), 
        where("userId", "==", user.uid), 
        where("shoeId", "==", productId),
        where("size", "==", size)
      );
      const snapshot = await getDocs(q);
      
      const batch = writeBatch(db);
      snapshot.forEach((document) => {
        batch.delete(doc(db, "cart", document.id));
      });
      await batch.commit();
    } catch (e) {
      console.error("Error al eliminar documento:", e);
    }
  };

  const clearCart = () => setCart([]);

  // 🌟 FUNCIÓN CORREGIDA: Procesa la compra inyectando los datos de entrega
  const processCheckout = async (shippingDetails: ShippingDetails) => {
    if (!user?.uid || cart.length === 0) return null;

    try {
      // 1. Guardamos la orden oficial con la información de despacho completa
      const orderRef = await addDoc(collection(db, "orders"), {
        userId: user.uid,
        userName: user.name || 'Cliente Kronos',
        items: cart, 
        total: total,
        status: 'en preparación',
        shippingDetails: shippingDetails, // 👈 Aquí quedan vinculados dirección, ciudad, celular y notas
        createdAt: serverTimestamp() 
      });

      // 2. Traemos todos los documentos temporales del carrito de este usuario
      const q = query(collection(db, "cart"), where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      
      // 3. Borramos el carrito de Firestore en un solo lote atómico (Batch)
      const batch = writeBatch(db);
      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      // 4. Vaciamos el estado de la UI
      clearCart();
      
      return orderRef.id; 
    } catch (e) {
      console.error("Error en proceso de checkout:", e);
      return null;
    }
  };

  return (
    <CartContext.Provider value={{ cart, total, addToCart, removeFromCart, updateQuantity, clearCart, processCheckout }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);