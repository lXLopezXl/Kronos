// 📂 Archivo: kronos/services/couponService.ts

const API_BASE_URL = "https://kronos-1bsm.onrender.com";

export const validarCupon = async (codigo: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/cupones/${codigo.toUpperCase()}`);
    const data = await response.json();
    
    return data; // Esto devolverá { valido: true, porcentaje: 20, mensaje: "..." }
  } catch (error) {
    console.error("Error al conectar con la API de cupones:", error);
    return { 
      valido: false, 
      mensaje: "No se pudo conectar al servidor. Intenta de nuevo más tarde." 
    };
  }
};