import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { LineChart, BarChart } from "react-native-chart-kit";
import { getDashboardData } from '../../services/adminService';

const screenWidth = Dimensions.get("window").width;

export default function DashboardScreen() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardData().then(res => {
      setData(res);
      setLoading(false);
    });
  }, []);

  if (loading) return <ActivityIndicator color="#bb0000" size="large" style={{flex: 1, backgroundColor: '#000'}} />;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>PANEL DE CONTROL</Text>

      {/* METRICAS RAPIDAS */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>VENTAS TOTALES</Text>
          <Text style={styles.statValue}>${data.totalSales.toLocaleString()}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>CLIENTES</Text>
          <Text style={styles.statValue}>{data.userCount}</Text>
        </View>
      </View>

      {/* GRAFICO DE VENTAS */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Rendimiento de Ventas (Mensual)</Text>
        <LineChart
          data={{
            labels: ["Ene", "Feb", "Mar", "Abr", "May", "Jun"],
            datasets: [{ data: [20, 45, 28, 80, 99, 43] }] // Datos de ejemplo
          }}
          width={screenWidth - 40}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </View>

      {/* LISTA DE ÚLTIMOS CLIENTES */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>CLIENTES RECIENTES</Text>
        {data.users.slice(0, 5).map((u: any) => (
          <View key={u.id} style={styles.listRow}>
            <Text style={styles.rowName}>{u.name}</Text>
            <Text style={styles.rowDetail}>{u.email}</Text>
          </View>
        ))}
      </View>

      {/* ÚLTIMAS VENTAS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ÚLTIMAS TRANSACCIONES</Text>
        {data.orders.slice(0, 5).map((o: any) => (
          <View key={o.id} style={styles.listRow}>
            <Text style={styles.rowName}>Pedido #{o.id.slice(0,5)}</Text>
            <Text style={styles.rowPrice}>+ ${o.total}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const chartConfig = {
  backgroundColor: "#1a1a1a",
  backgroundGradientFrom: "#1a1a1a",
  backgroundGradientTo: "#000",
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(187, 0, 0, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  propsForDots: { r: "6", strokeWidth: "2", stroke: "#bb0000" }
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 20 },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 25, marginTop: 20 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  statCard: { backgroundColor: '#111', width: '48%', padding: 20, borderRadius: 15, borderWidth: 1, borderColor: '#222' },
  statLabel: { color: '#666', fontSize: 10, fontWeight: 'bold', marginBottom: 5 },
  statValue: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  chartContainer: { backgroundColor: '#111', borderRadius: 15, padding: 15, marginBottom: 20, borderWidth: 1, borderColor: '#222' },
  chartTitle: { color: '#fff', fontSize: 14, marginBottom: 15, fontWeight: 'bold' },
  chart: { borderRadius: 15, paddingRight: 40 },
  section: { marginBottom: 30 },
  sectionTitle: { color: '#bb0000', fontSize: 14, fontWeight: 'bold', marginBottom: 15, letterSpacing: 1 },
  listRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#111', padding: 15, borderRadius: 10, marginBottom: 10 },
  rowName: { color: '#fff', fontSize: 14, fontWeight: '500' },
  rowDetail: { color: '#666', fontSize: 12 },
  rowPrice: { color: '#00bb00', fontWeight: 'bold' }
});