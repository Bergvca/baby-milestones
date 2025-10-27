import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from './context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import alert from '../components/Alert';

export default function Profile() {
    const { user, logout } = useAuth();


    const handleEditProfile = () => {
        alert('Edit Profile', 'Edit profile functionality coming soon!');
    };

    const handleSettings = () => {
        alert('Settings', 'Settings page coming soon!');
    };

    const handleLogout = () => {
        alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                {
                    text: 'Cancel',
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
                            alert('Error', 'Failed to logout. Please try again.');
                        }
                    },
                },
            ]
        );
    };


    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <MaterialCommunityIcons name="arrow-left" size={24} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Profile</Text>
                    <View style={styles.placeholder} />
                </View>

                {/* Profile Info */}
                <View style={styles.profileSection}>
                    <View style={styles.avatarContainer}>
                        <MaterialCommunityIcons name="account-circle" size={120} color="#6200ee" />
                    </View>
                    <Text style={styles.userName}>{user?.displayName || 'John Doe'}</Text>
                    <Text style={styles.userEmail}>{user?.email || 'john.doe@example.com'}</Text>
                </View>

                {/* Stats Section */}
                <View style={styles.statsSection}>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>12</Text>
                        <Text style={styles.statLabel}>Cards Created</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>45</Text>
                        <Text style={styles.statLabel}>Photos Used</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>8</Text>
                        <Text style={styles.statLabel}>Favorites</Text>
                    </View>
                </View>

                {/* Menu Options */}
                <View style={styles.menuSection}>
                    <TouchableOpacity style={styles.menuItem} onPress={handleEditProfile}>
                        <MaterialCommunityIcons name="account-edit" size={24} color="#6200ee" />
                        <Text style={styles.menuText}>Edit Profile</Text>
                        <MaterialCommunityIcons name="chevron-right" size={24} color="#757575" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={handleSettings}>
                        <MaterialCommunityIcons name="cog" size={24} color="#6200ee" />
                        <Text style={styles.menuText}>Settings</Text>
                        <MaterialCommunityIcons name="chevron-right" size={24} color="#757575" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem}>
                        <MaterialCommunityIcons name="help-circle" size={24} color="#6200ee" />
                        <Text style={styles.menuText}>Help & Support</Text>
                        <MaterialCommunityIcons name="chevron-right" size={24} color="#757575" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem}>
                        <MaterialCommunityIcons name="information" size={24} color="#6200ee" />
                        <Text style={styles.menuText}>About</Text>
                        <MaterialCommunityIcons name="chevron-right" size={24} color="#757575" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem}>
                        <MaterialCommunityIcons name="shield-check" size={24} color="#6200ee" />
                        <Text style={styles.menuText}>Privacy Policy</Text>
                        <MaterialCommunityIcons name="chevron-right" size={24} color="#757575" />
                    </TouchableOpacity>
                </View>

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <MaterialCommunityIcons name="logout" size={24} color="#fff" />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollContainer: {
        paddingBottom: 30,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#000',
    },
    placeholder: {
        width: 40,
    },
    profileSection: {
        backgroundColor: '#fff',
        alignItems: 'center',
        paddingVertical: 30,
        marginBottom: 16,
    },
    avatarContainer: {
        marginBottom: 16,
    },
    userName: {
        fontSize: 24,
        fontWeight: '600',
        color: '#000',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 16,
        color: '#757575',
    },
    statsSection: {
        backgroundColor: '#fff',
        flexDirection: 'row',
        paddingVertical: 20,
        marginBottom: 16,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 24,
        fontWeight: '700',
        color: '#6200ee',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#757575',
        textAlign: 'center',
    },
    statDivider: {
        width: 1,
        backgroundColor: '#e0e0e0',
        marginHorizontal: 16,
    },
    menuSection: {
        backgroundColor: '#fff',
        marginBottom: 16,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    menuText: {
        flex: 1,
        fontSize: 16,
        color: '#000',
        marginLeft: 16,
    },
    logoutButton: {
        backgroundColor: '#d32f2f',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        marginHorizontal: 16,
        borderRadius: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    logoutText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
});
