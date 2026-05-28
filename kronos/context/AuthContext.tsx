import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../services/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export interface UserType {
  uid: string;
  email: string | null;
  name?: string;
  displayName?: string | null; // Corregido
  rol?: string;
}

interface AuthContextData {
  user: UserType | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          const userData = userDoc.exists() ? userDoc.data() : {};
          const name = userData.name || firebaseUser.displayName || 'Usuario';
          
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: name,
            displayName: name,
            rol: userData.rol || 'user',
          });
        } catch (e) { setUser(null); }
      } else { setUser(null); }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);