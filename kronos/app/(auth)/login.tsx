import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { logIn } from '../../services/authService';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Ingresa tus credenciales.');
      return;
    }

    setLoading(true);
    try {
      await logIn(email, password);
      // El AuthContext detectará el cambio automáticamente
      router.replace('/(tabs)'); 
    } catch (error: any) {
      Alert.alert('Error de acceso', 'Correo o contraseña incorrectos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image 
        source={require('../../assets/images/kronoslogo.png')} 
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.title}>BIENVENIDO</Text>
      <Text style={styles.subtitle}>Accede a Kronnos Store</Text>

      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Correo electrónico"
          placeholderTextColor="#666"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        <TextInput
          placeholder="Contraseña"
          placeholderTextColor="#666"
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>ENTRAR</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/(auth)/register')} style={styles.linkButton}>
        <Text style={styles.linkText}>¿No tienes cuenta? <Text style={{color: '#bb0000'}}>Regístrate</Text></Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 30, justifyContent: 'center' },
  logo: { width: width * 0.5, height: 120, alignSelf: 'center', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
  subtitle: { fontSize: 12, color: '#666', textAlign: 'center', marginBottom: 30, textTransform: 'uppercase' },
  inputContainer: { gap: 15, marginBottom: 30 },
  input: { backgroundColor: '#1a1a1a', padding: 18, borderRadius: 8, color: '#fff', borderWidth: 1, borderColor: '#333' },
  button: { backgroundColor: '#bb0000', padding: 18, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', letterSpacing: 2 },
  linkButton: { marginTop: 25, alignItems: 'center' },
  linkText: { color: '#666' }
});