import { db } from './firebaseConfig';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

export const getDashboardData = async () => {
  try {
    // Traer Usuarios
    const usersSnap = await getDocs(collection(db, "users"));
    const usersList = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Traer Ventas (historial reciente)
    const ordersSnap = await getDocs(query(collection(db, "orders"), orderBy("createdAt", "desc")));
    const ordersList = ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Calcular total de ventas (ejemplo simple)
    const totalSales = ordersList.reduce((acc: number, order: any) => acc + (order.total || 0), 0);

    return {
      users: usersList,
      orders: ordersList,
      totalSales,
      userCount: usersList.length,
      orderCount: ordersList.length
    };
  } catch (error) {
    console.error("Error al obtener dashboard:", error);
    throw error;
  }
};