import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { auth } from '../../firebaseConfig';
import {
  User,
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { Platform } from 'react-native';

// Complete the auth session for proper cleanup
WebBrowser.maybeCompleteAuthSession();

type AuthContextType = {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  getToken: (forceRefresh?: boolean) => Promise<string | null>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
  signInWithGoogle: async () => {},
  getToken: async () => null,
});

let _getToken: ((force?: boolean) => Promise<string | null>) | null = null;
export const registerTokenProvider = (fn: ((force?: boolean) => Promise<string | null>) | null) => {
  _getToken = fn;
};
export const getCurrentToken = (force = false): Promise<string | null> =>
  _getToken ? _getToken(force) : Promise.resolve(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // Configure redirect URI based on platform
  const getRedirectUri = () => {
    if (Platform.OS === 'web') {
      // Check if we're running locally or on production
      if (typeof window !== 'undefined') {
        const currentUrl = window.location.origin + window.location.pathname;

        // For local development
        if (currentUrl.includes('localhost') || currentUrl.includes('127.0.0.1')) {
          return window.location.origin + '/';
        }

        // For production (GitHub Pages)
        return 'https://bergvca.github.io/baby-milestones/';
      }

      // Fallback
      return 'https://bergvca.github.io/baby-milestones/';
    } else {
      // For Expo Go and mobile development
      return makeRedirectUri({
        scheme: undefined,
        preferLocalhost: true,
      });
    }
  };

  // Configure Google Auth Request with proper redirect URI for Expo Go
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: '709551532680-8tclo8jnqk8l9197d209duqmi6l2j189.apps.googleusercontent.com',
    redirectUri: getRedirectUri(),
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Handle Google Auth Response
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;

      if (id_token) {
        // Create Firebase credential and sign in
        const credential = GoogleAuthProvider.credential(id_token);
        signInWithCredential(auth, credential)
          .then((result) => {
            console.log('Google sign-in successful:', result.user.email);
          })
          .catch((error) => {
            console.error('Firebase sign-in error:', error);
          });
      }
    } else if (response?.type === 'error') {
      console.error('Google Auth error:', response.error);
    }
  }, [response]);

  const signInWithGoogle = async () => {
    try {
      console.log('Redirect URI:', getRedirectUri());
      console.log('Request URL:', request?.url);
      await promptAsync();
    } catch (error) {
      console.error('Error with Google sign-in:', error);
      throw error;
    }
  };

  const getToken = useCallback(async (forceRefresh = false): Promise<string | null> => {
    const u = auth.currentUser;
    if (!u) return null;
    return u.getIdToken(forceRefresh);
  }, []);

  useEffect(() => {
    registerTokenProvider(getToken);
    return () => registerTokenProvider(null);
  }, [getToken]);

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, signInWithGoogle, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
