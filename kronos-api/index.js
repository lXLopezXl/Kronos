// 📂 Archivo: index.js
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

// 🔓 Middlewares obligatorios
app.use(cors()); // Evita bloqueos de seguridad al conectar la app con la API
app.use(express.json()); // Permite que tu API entienda datos enviados en formato JSON

// 🎫 Simulación de Base de Datos de Cupones (En memoria)
const cupones = [
  { codigo: "ALIANZA20", porcentaje: 20, valido: true, mensaje: "Cupón de agencia aplicado correctamente" },
  { codigo: "KRONOS10", porcentaje: 10, valido: true, mensaje: "Descuento de bienvenida activado" },
  { codigo: "PROMO50", porcentaje: 50, valido: true, mensaje: "¡Mitad de precio!" },
  { codigo: "EXPIRADO", porcentaje: 15, valido: false, mensaje: "Este cupón ya caducó" }
];

// 🌐 RUTA DE PRUEBA: Verificar si la API responde de forma global
app.get('/', (req, res) => {
  res.json({ mensaje: "¡Bienvenido a Kronos API!" });
});

// 🌐 RUTA: Validar un cupón por su código (GET)
app.get('/api/cupones/:codigo', (req, res) => {
  // Convertimos el parámetro a mayúsculas para evitar problemas de escritura (ej: alianza20 -> ALIANZA20)
  const codigoBuscado = req.params.codigo.toUpperCase();
  
  // Buscamos el objeto dentro de nuestro array de cupones
  const cuponEncontrado = cupones.find(c => c.codigo === codigoBuscado);

  // 1. Si no existe el cupón
  if (!cuponEncontrado) {
    return res.status(404).json({
      valido: false,
      mensaje: "El cupón ingresado no existe."
    });
  }

  // 2. Si existe pero está marcado como inválido o expirado
  if (!cuponEncontrado.valido) {
    return res.status(400).json({
      valido: false,
      mensaje: cuponEncontrado.mensaje || "Este cupón ya expiró o no es válido."
    });
  }

  // 3. Si pasa todos los filtros, devolvemos el éxito del descuento
  return res.json({
    valido: true,
    porcentaje: cuponEncontrado.porcentaje,
    mensaje: cuponEncontrado.mensaje
  });
});

// 🚀 ACTIVACIÓN DEL SERVIDOR: Escuchando en toda la red local mediante '0.0.0.0'
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n=========================================`);
  console.log(`      🚀 KRONOS API ACTIVA Y CORRIENDO`);
  console.log(`=========================================`);
  console.log(`• Local:            http://localhost:${PORT}`);
  console.log(`• Ruta de cupones:  http://localhost:${PORT}/api/cupones/ALIANZA20`);
  console.log(`=========================================\n`);
});