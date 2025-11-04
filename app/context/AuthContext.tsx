
import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth } from '../../firebaseConfig';
import {
    User,
    onAuthStateChanged,
    signOut,
    GoogleAuthProvider,
    signInWithCredential
} from 'firebase/auth';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';

// Complete the auth session for proper cleanup
WebBrowser.maybeCompleteAuthSession();

type AuthContextType = {
    user: User | null;
    loading: boolean;
    logout: () => Promise<void>;
    signInWithGoogle: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    logout: async () => {},
    signInWithGoogle: async () => {}
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Configure Google Auth Request with proper redirect URI for Expo Go
    const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
        clientId: '709551532680-8tclo8jnqk8l9197d209duqmi6l2j189.apps.googleusercontent.com',
        redirectUri: makeRedirectUri({
            scheme: undefined, // Use default for Expo Go
        }),
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
            await promptAsync();
        } catch (error) {
            console.error('Error with Google sign-in:', error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Error signing out:', error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, logout, signInWithGoogle }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);