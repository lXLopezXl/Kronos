import { db } from './firebaseConfig';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';

export const createOrder = async (userId: string, userName: string, items: any[], total: number) => {
  try {
    const orderData = {
      userId,
      userName,
      items, // Aquí pasa el arreglo unificado que genera CheckoutEnvio
      total,
      status: 'en preparación',
      createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, "orders"), orderData);
    return docRef.id;
  } catch (error) {
    console.error("Error al crear pedido:", error);
    throw error;
  }
};

export const getUserOrders = async (userId: string) => {
  try {
    const q = query(
      collection(db, "orders"), 
      where("userId", "==", userId)
    );
    const snap = await getDocs(q);
    
    const orders = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Las ordenamos manualmente por fecha para que no dependas de índices de Firebase en consola
    return orders.sort((a: any, b: any) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    });
  } catch (error) {
    console.error("Error en getUserOrders:", error);
    return [];
  }
};