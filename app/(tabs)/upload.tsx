import React, {useCallback, useEffect, useState} from 'react';
import {View, StyleSheet, Alert, ActivityIndicator, Text, TouchableOpacity, ScrollView} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import DateTimePicker from '@react-native-community/datetimepicker';
import ImageViewer from '@/components/ImageViewer';
import PostTextField from '@/components/PostTextField';
import Button from '@/components/Button';
import {IMAGE_PATH, POSTS_PATH} from '@/app/constants/api';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import {uploadPostBinary, updatePostById} from "@/components/UploadPostBinary";
import {Colors} from "@/components/colors";
import {DatePicker} from "@/components/DatePicker";
import {router, useFocusEffect, useLocalSearchParams} from "expo-router";


export default function Upload() {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [postText, setPostText] = useState<string>('');
    const [token, setToken] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingPostId, setEditingPostId] = useState<string | null>(null);
    const [loadingPostData, setLoadingPostData] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    // Get params from navigation
    const params = useLocalSearchParams();


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

    // Load post data for editing
    const loadPostForEditing = async (postId: string, token: string) => {
        setLoadingPostData(true);
        try {
            // Fetch post details
            const response = await fetch(`${POSTS_PATH}/${postId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to load post data');
            }

            const postData = await response.json();

            // Set the form data
            setPostText(postData.description || '');
            setSelectedDate(new Date(postData.date));

            // Load the first image if available
            if (postData.media_files && postData.media_files.length > 0) {
                const imageResponse = await fetch(`${IMAGE_PATH}/${postData.media_files[0].file_md5}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (imageResponse.ok) {
                    if (Platform.OS === 'web') {
                        const blob = await imageResponse.blob();
                        const blobUrl = URL.createObjectURL(blob);
                        setSelectedImage(blobUrl);
                    } else {
                        setSelectedImage(`${IMAGE_PATH}/${postData.media_files[0].file_md5}`);
                    }
                }
            }
        } catch (error) {
            console.error('Error loading post for editing:', error);
            Alert.alert('Error', 'Failed to load post data for editing');
        } finally {
            setLoadingPostData(false);
        }
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

    const resetFormState = () => {
        setSelectedImage(null);
        setPostText('');
        setSelectedDate(new Date());
        setIsEditMode(false);
        setEditingPostId(null);
        setUploadSuccess(false);
    };

    // Handle edit mode setup
// Update the edit mode useEffect to handle new edits
    useEffect(() => {
        const editMode = params.editMode;
        const postId = params.postId;

        if (editMode === 'true' && postId && token) {
            // Check if we're switching to a different post
            if (editingPostId && editingPostId !== postId) {
                // Reset state before loading new post
                resetFormState();
            }

            // Only proceed if not already editing this specific post
            if (editingPostId !== postId) {
                setIsEditMode(true);
                setEditingPostId(postId as string);

                // Use params data if available
                if (params.text) {
                    setPostText(params.text as string);
                }
                if (params.date) {
                    setSelectedDate(new Date(params.date as string));
                }

                // Load complete post data including image
                loadPostForEditing(postId as string, token);
            }
        } else if (editMode !== 'true' && isEditMode) {
            // If we're no longer in edit mode, reset the form
            resetFormState();
        }
    }, [params.editMode, params.postId, params.text, params.date, token, editingPostId, isEditMode]);

    // Also add a useFocusEffect to handle navigation changes
    useFocusEffect(
        useCallback(() => {
            // Reset form when navigating to upload without edit params
            if (!params.editMode && isEditMode) {
                resetFormState();
            }
        }, [params.editMode, isEditMode])
    );


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

    const handleUploadSuccess = async () => {
        setUploadSuccess(true);
        setUploading(false);
        const successMessage = isEditMode ? 'Milestone Updated!' : 'Milestone Created!';

        // Show success message for 1 second, then navigate
        setTimeout(() => {
            setUploadSuccess(false);
            router.push('/(tabs)'); // Navigate to home/index
        }, 1000);
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

            if (isEditMode && editingPostId) {
                // Update existing post
                await updatePostById(editingPostId, token, postText, selectedDate, selectedImage);
            } else {
                // Create new post
                await uploadPostBinary({
                    token,
                    imageUri: selectedImage,
                    text: postText,
                    date: selectedDate,
                });
            }
            setUploadSuccess(true); // show success message instead of image
            handleUploadSuccess();

        } catch (e) {
            const message = e instanceof Error ? e.message : 'Unknown error';
            console.error('Upload error:', e);
            Alert.alert('Error', message);
        } finally {
            setUploading(false);
        }
    };

    if (loadingPostData) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading post data...</Text>
            </View>
        );
    }


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
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.neutral.offWhite,
    },
    loadingText: {
        color: Colors.primary,
        fontSize: 14,
        marginTop: 8,
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