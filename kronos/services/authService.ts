import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut 
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';

/**
 * Registro de usuario + Creación de documento en Firestore
 */
export const signUp = async (email: string, pass: string, name: string) => {
  try {
    // 1. Crear en Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const user = userCredential.user;

    // 2. Crear documento en la colección 'users' (Estructura vista en Firestore)
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      name: name,
      email: email,
      cart: [] // Inicializamos el carrito vacío
    });

    return user;
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') throw 'Este correo ya está registrado.';
    if (error.code === 'auth/weak-password') throw 'La contraseña debe tener al menos 6 caracteres.';
    throw error.message;
  }
};

/**
 * Inicio de sesión
 */
export const logIn = async (email: string, pass: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    return userCredential.user;
  } catch (error: any) {
    if (error.code === 'auth/invalid-credential') throw 'Correo o contraseña incorrectos.';
    throw error.message;
  }
};

/**
 * Cerrar sesión
 */
export const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error: any) {
    throw error.message;
  }
};