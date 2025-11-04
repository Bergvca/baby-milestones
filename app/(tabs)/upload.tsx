import React, { useEffect, useState } from 'react';
import {View, StyleSheet, Alert, ActivityIndicator, Text, TouchableOpacity, ScrollView} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import DateTimePicker from '@react-native-community/datetimepicker';
import ImageViewer from '@/components/ImageViewer';
import PostTextField from '@/components/PostTextField';
import Button from '@/components/Button';
import { API_BASE_URL } from '@/app/constants/api';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import {uploadPostBinary} from "@/components/UploadPostBinary";
import {Colors} from "@/components/colors";
import {DatePicker} from "@/components/DatePicker";


export default function Upload() {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [postText, setPostText] = useState<string>('');
    const [token, setToken] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    const onDateChange = (event: any, date?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (date) {
            setSelectedDate(date);
        }
    };

    const handleWebDateChange = (date: Date) => {
        setSelectedDate(date);
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            try {
                if (user) {
                    const idToken = await user.getIdToken();
                    setToken(idToken);
                } else {
                    setToken(null);
                }
            } catch {
                setToken(null);
            }
        });
        return unsubscribe;
    }, []);

    const pickImageAsync = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert('Permission required', 'Please grant photo library access to choose an image.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 1,
        });

        if (!result.canceled) {
            setSelectedImage(result.assets[0].uri);
            setUploadSuccess(false); // reset success state when picking a new image
        }
    };

    const onCreatePost = async () => {
        if (!token) {
            Alert.alert('Not signed in', 'Please sign in before creating a post.');
            return;
        }
        if (!selectedImage) {
            Alert.alert('Image required', 'Please choose an image to create a post.');
            return;
        }

        try {
            setUploading(true);

            // Derive name and type if needed
            const fileName = selectedImage.split('/').pop() || 'upload.jpg';

            await uploadPostBinary({
                apiBaseUrl: API_BASE_URL,
                token,
                imageUri: selectedImage,
                text: postText,
                date: selectedDate,
            });

            setUploadSuccess(true); // show success message instead of image
            Alert.alert('Success', 'Your post has been created.');
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Unknown error';
            console.error('Upload error:', e);
            Alert.alert('Error', message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {uploadSuccess ? (
                <Text style={styles.successText}>Milestone Created!</Text>
            ) : (
                <ImageViewer selectedImage={selectedImage}/>
            )}

            {/* Date Picker Section */}
            <DatePicker
                onPress={() => setShowDatePicker(true)}
                disabled={uploading}
                s={formatDate(selectedDate)}
                onDateChange={handleWebDateChange}
                selectedDate={selectedDate}
            />

            {/* Only show DateTimePicker on mobile platforms */}
            {showDatePicker && Platform.OS !== 'web' && (
                <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onDateChange}
                />
            )}

            <PostTextField value={postText} onChangeText={setPostText}/>

            <View style={styles.actions}>
                <Button title="Choose image" onPress={pickImageAsync} disabled={uploading}/>
                <Button title="Create post" variant="secondary" onPress={onCreatePost} disabled={uploading}/>
            </View>

            {uploading && (
                <View style={styles.overlay}>
                    <ActivityIndicator size="large" color="#fff"/>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.neutral.offWhite,

        paddingHorizontal: 16,
        gap: 16,
    },
    contentContainer: {
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100%',
    },

    actions: {
        marginTop: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    overlay: {
        position: 'absolute',
        bottom: 24,
    },
    successText: {
        color: Colors.primary,
        fontSize: 18,
        fontWeight: '600',
    },
    datePickerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    dateLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: Colors.neutral?.darkGray || '#333',
    },
    dateButton: {
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    dateButtonText: {
        fontSize: 16,
        color: Colors.neutral?.darkGray || '#333',
    },
});