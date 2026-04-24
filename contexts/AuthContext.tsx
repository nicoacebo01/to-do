import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { AppUser, UserRole } from '../types';

interface AuthState {
  firebaseUser: User | null;
  appUser: AppUser | null;
  role: UserRole | null;
  loading: boolean;
  isAmbassador: boolean;
}

const AuthContext = createContext<AuthState>({
  firebaseUser: null,
  appUser: null,
  role: null,
  loading: true,
  isAmbassador: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    firebaseUser: null,
    appUser: null,
    role: null,
    loading: true,
    isAmbassador: false,
  });

  useEffect(() => {
    let unsubUser: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (unsubUser) { unsubUser(); unsubUser = null; }

      if (!firebaseUser || !firebaseUser.email) {
        setState({ firebaseUser: null, appUser: null, role: null, loading: false, isAmbassador: false });
        return;
      }

      const emailLower = firebaseUser.email.toLowerCase();
      // El documento tiene como ID el email del usuario
      unsubUser = onSnapshot(doc(db, 'idea_users', emailLower), (snap) => {
        if (!snap.exists()) {
          setState({ firebaseUser, appUser: null, role: null, loading: false, isAmbassador: false });
        } else {
          const appUser = snap.data() as AppUser;
          setState({
            firebaseUser,
            appUser,
            role: appUser.role,
            loading: false,
            isAmbassador: appUser.role === 'AMBASSADOR',
          });
        }
      });
    });

    return () => {
      unsubAuth();
      if (unsubUser) unsubUser();
    };
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
};
