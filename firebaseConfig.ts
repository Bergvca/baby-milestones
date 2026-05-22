import { initializeApp } from 'firebase/app';
// firebase v11's main `firebase/auth` typings omit `getReactNativePersistence`,
// but the runtime export exists when Metro resolves the rn entry point.
// @ts-expect-error - missing in published type defs, present at runtime on native
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Replace with your Firebase config
const firebaseConfig = {
  apiKey: 'AIzaSyCw3kPEPYqhsYXu7NFjjsgAYs_DCVSLPPM',
  authDomain: 'babycards-steps.firebaseapp.com',
  projectId: 'babycards-steps',
  storageBucket: 'babycards-steps.firebasestorage.app',
  messagingSenderId: '709551532680',
  appId: '1:709551532680:web:7c1fce2cfdcf09a9118d3d',
  measurementId: 'G-HVGR1YF344',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// On native, use AsyncStorage for auth persistence so sessions survive reloads.
// On web, getAuth() already uses indexedDB/localStorage.
export const auth =
  Platform.OS === 'web'
    ? getAuth(app)
    : initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
