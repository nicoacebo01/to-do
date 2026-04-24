import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
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
    let unsubUsers: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (unsubUsers) {
        unsubUsers();
        unsubUsers = null;
      }

      if (!firebaseUser || !firebaseUser.email) {
        setState({ firebaseUser: null, appUser: null, role: null, loading: false, isAmbassador: false });
        return;
      }

      const emailLower = firebaseUser.email.toLowerCase();
      const q = query(collection(db, 'idea_users'), where('email', '==', emailLower));

      unsubUsers = onSnapshot(q, (snap) => {
        if (snap.empty) {
          setState({
            firebaseUser,
            appUser: null,
            role: null,
            loading: false,
            isAmbassador: false,
          });
        } else {
          const appUser = snap.docs[0].data() as AppUser;
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
      if (unsubUsers) unsubUsers();
    };
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
};
