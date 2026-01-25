import React, {useEffect, useState} from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import  alert from '@/components/Alert';
import {getAuth} from "firebase/auth";
import {USER_PATH} from "@/app/constants/api";
import ProfileAvatar from "@/components/ProfileAvatar";
import {Colors} from "@/components/colors";
import { screenStyles } from '@/components/screenStyles';


type Family = {
    name: string;
    description: string;
    id: number;
    created_at: string;
};

type UserProfile = {
    email: string;
    full_name: string;
    firebase_uid: string;
    profile_picture_id: number;
    id: number;
    families: Family[];
};



export default function Profile() {
    const { logout } = useAuth();
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    // Fetch user profile from API
    const fetchUserProfile = async () => {
        try {
            setLoading(true);
            setError(null);

            const auth = getAuth();
            const user = auth.currentUser;

            if (!user) {
                throw new Error('No authenticated user');
            }

            const token = await user.getIdToken();
            const response = await fetch(`${USER_PATH}/${user.uid}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch user profile: ${response.status}`);
            }

            const userData = await response.json();
            setUserProfile(userData);
        } catch (err) {
            console.error('Error fetching user profile:', err);
            setError(err instanceof Error ? err.message : 'Failed to load profile');
        } finally {
            setLoading(false);
        }
    };



    useEffect(() => {
        fetchUserProfile();
    }, []);

    const handleAddFamily = () => {
        router.push('/add-family');
    };

    const handleFamilyPress = (family: Family) => {
        router.push({pathname: '/add-family',
        params: {
                editMode: 'true',
                name: family.name,
                description: family.description,
                id: family.id
        }});
    };


    const handleEditProfile = () => {
        alert('Edit Profile', 'Edit profile functionality coming soon!', []);
    };

    const handleSettings = () => {
        alert('Settings', 'Settings page coming soon!', []);
    };

    const handleLogout = () => {
        alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                {
                    text: 'Cancel',
                    onPress: () => {},
                    style: 'cancel',
                },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await logout();
                            router.replace('/login');
                        } catch (error) {
                            alert('Error', 'Failed to logout. Please try again.', []);
                        }
                    },
                },
            ]
        );
    };


    return (
        <SafeAreaView style={screenStyles.container}>
            <ScrollView contentContainerStyle={screenStyles.scrollContainer}>
                {/* Header */}
                <View style={screenStyles.header}>
                    <TouchableOpacity
                        style={screenStyles.backButton}
                        onPress={() => router.back()}
                    >
                        <MaterialCommunityIcons name="arrow-left" style={screenStyles.arrowIcon} />
                    </TouchableOpacity>
                </View>

                {/* Profile Info */}
                <View style={screenStyles.profileSection}>
                    <View style={screenStyles.avatarWrapper}>
                        <ProfileAvatar
                            size={130}
                            editable={true}
                            isChild={false}
                            childId={null}
                        />
                    </View>
                    <Text style={screenStyles.userName}>
                        {userProfile?.full_name ||
                            `${userProfile?.full_name}`.trim() ||
                            'Unknown User'}
                    </Text>
                    <Text style={screenStyles.userEmail}>
                        {userProfile?.email || 'No email available'}
                    </Text>
                </View>

                {/* Families Section */}
                <View style={screenStyles.menuSection}>
                    <Text style={screenStyles.sectionHeader}>Families</Text>

                        <View>
                            {userProfile?.families?.map((family) => (
                                <TouchableOpacity
                                    key={family.id}
                                    style={screenStyles.menuItem}
                                    onPress={() => handleFamilyPress(family)}
                                >
                                    <MaterialCommunityIcons name="account-supervisor-outline" style={screenStyles.primaryIcon} />
                                    <Text style={screenStyles.menuText}>{family.name}</Text>
                                    <MaterialCommunityIcons name="chevron-right" style={screenStyles.arrowIcon} />

                                </TouchableOpacity>
                            ))}

                            <TouchableOpacity
                                style={screenStyles.menuItem}
                                onPress={handleAddFamily}
                            >
                                <MaterialCommunityIcons name="account-supervisor-outline" style={screenStyles.primaryIcon} />
                                <Text style={screenStyles.menuText}>Add Family</Text>
                                <MaterialCommunityIcons name="plus" style={screenStyles.arrowIcon} />
                            </TouchableOpacity>
                        </View>

                </View>


                {/* Menu Options */}
                <View style={screenStyles.menuSection}>
                    <TouchableOpacity style={screenStyles.menuItem} onPress={handleSettings}>
                        <MaterialCommunityIcons name="cog" style={screenStyles.primaryIcon} />
                        <Text style={screenStyles.menuText}>Settings</Text>
                        <MaterialCommunityIcons name="chevron-right" style={screenStyles.arrowIcon} />
                    </TouchableOpacity>

                    <TouchableOpacity style={screenStyles.menuItem}>
                        <MaterialCommunityIcons name="help-circle" style={screenStyles.primaryIcon} />
                        <Text style={screenStyles.menuText}>Help & Support</Text>
                        <MaterialCommunityIcons name="chevron-right" style={screenStyles.arrowIcon} />
                    </TouchableOpacity>

                    <TouchableOpacity style={screenStyles.menuItem}>
                        <MaterialCommunityIcons name="information" style={screenStyles.primaryIcon} />
                        <Text style={screenStyles.menuText}>About</Text>
                        <MaterialCommunityIcons name="chevron-right" style={screenStyles.arrowIcon} />
                    </TouchableOpacity>

                    <TouchableOpacity style={screenStyles.menuItem}>
                        <MaterialCommunityIcons name="shield-check" style={screenStyles.primaryIcon} />
                        <Text style={screenStyles.menuText}>Privacy Policy</Text>
                        <MaterialCommunityIcons name="chevron-right" style={screenStyles.arrowIcon} />
                    </TouchableOpacity>
                </View>

                {/* Logout Button */}
                <TouchableOpacity style={screenStyles.logoutButton} onPress={handleLogout}>
                    <MaterialCommunityIcons name="logout" style={screenStyles.logoutIcon} />
                    <Text style={screenStyles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}
