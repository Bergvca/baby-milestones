import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {Platform, TouchableOpacity} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';
import { router } from 'expo-router';
import { Colors } from '@/components/colors';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function Layout() {
    const { user } = useAuth();

    useEffect(() => {
        if (!user) {
            router.replace('/login');
        }
    }, [user]);

    if (!user) {
        return null;
    }

    return (

        <SafeAreaView style={{ flex: 1 }}>
        <Tabs


        screenOptions={{
            // Material Design styling
            tabBarStyle: {
                backgroundColor: Colors.neutral.white,
                height: Platform.OS === 'ios' ? 88 : 60,
                paddingBottom: Platform.OS === 'ios' ? 30 : 0,
                paddingTop: 5,
                elevation: 8, // Android shadow
                shadowColor: Colors.neutral.darkGray, // iOS shadow
                shadowOffset: {
                    width: 0,
                    height: 4,
                },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            tabBarActiveTintColor: Colors.primary, // Material Design primary color
            tabBarInactiveTintColor: Colors.neutral.lightGray,
            tabBarLabelStyle: {
                fontSize: 12,
                fontWeight: '500',
            },
            headerShown: false,

        }}
    >
      {/* Example tab configuration - adjust according to your needs */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" size={size} color={color} />
          ),
        }}
      />
        <Tabs.Screen
            name="upload"
            options={{
                title: 'Upload',
                tabBarLabel: 'Upload',
                tabBarIcon: ({ color, size }) => (
                    <MaterialCommunityIcons name="upload" size={size} color={color}/>
                ),
            }}
        />
      {/* Add other tab screens as needed */}
      <Tabs.Screen
        name="about"
        options={{
          title: 'About',
          tabBarLabel: 'About',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" size={size} color={color} />
          ),
        }}
      />

        <Tabs.Screen
            name="profile"
            options={{
                title: 'Profile',
                tabBarLabel: 'Profile',
                tabBarIcon: ({ color, size }) => (
                    <MaterialCommunityIcons name="account-circle" size={size} color={color} />
                ),
            }}
        />
      {/* Add more tabs as needed */}
    </Tabs>
</SafeAreaView>

);
}