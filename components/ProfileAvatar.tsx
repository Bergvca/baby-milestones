
import React, { useState, useEffect } from 'react';
import {View, Image, StyleSheet, TouchableOpacity, ActivityIndicator} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from './colors';
import * as ImagePicker from 'expo-image-picker';
import alert from '@/components/Alert';
import {CHILD_AVATAR_PATH, USER_AVATAR_PATH} from '@/app/constants/api';
import { useAuth } from '@/app/context/AuthContext';
import {add_image_to_form} from '@/components/UploadPostBinary'


export type ProfileAvatarRef = {
    uploadAvatarForChild: (childId: number) => Promise<boolean>;
    getAvatarUri: () => string | null;
};


type ProfileAvatarProps = {
    size?: number;
    iconColor?: string;
    onImageChange?: (uri: string) => void;
    editable?: boolean;
    isChild?: boolean;
    childId: number | null;
};

const ProfileAvatar = React.forwardRef<ProfileAvatarRef, ProfileAvatarProps>(
    function ProfileAvatar({
                               size = 120,
                               iconColor = Colors.accent.yellow,
                               onImageChange,
                               editable = false,
                               isChild = false,
                               childId
                           }, ref) {


    const { user } = useAuth();
    const [uploading, setUploading] = useState(false);
    const [avatarUri, setAvatarUri] = useState<string | null>(null);
    const [loadingAvatar, setLoadingAvatar] = useState(false);

    const avatarApiPath =  () => {
        if (!user) {
            return '';
        }
        let avatarApiPath = `${USER_AVATAR_PATH}/${user.uid}`;
        if(isChild){
            avatarApiPath = `${CHILD_AVATAR_PATH}/${childId}`;
        }
        return avatarApiPath;
    };

    // Expose methods to parent component
    React.useImperativeHandle(ref, () => ({
        uploadAvatarForChild: async (childId: number) => {
            if (!avatarUri || !user) {
                return false;
            }
            try {
                const token = await user.getIdToken();
                let form = new FormData();
                form = await add_image_to_form(avatarUri, form);

                const response = await fetch(`${CHILD_AVATAR_PATH}/${childId}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: form,
                });

                if (!response.ok) {
                    throw new Error(`Upload failed: ${response.status}`);
                }

                return true;
            } catch (error) {
                console.error('Error uploading child avatar:', error);
                alert('Error', 'Failed to upload child avatar. Please try again.', []);
                return false;
            }
        },
        getAvatarUri: () => avatarUri,
    }));



    const fetchAvatar = async () => {
        if (!user) {
            return;
        }

        setLoadingAvatar(true);

        try {
            const token = await user.getIdToken();
            const response = await fetch(avatarApiPath(), {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    // No avatar found, this is fine
                    setAvatarUri(null);
                    return;
                }
                throw new Error(`Failed to fetch image: ${response.status}`);
            }

            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            setAvatarUri(blobUrl);
        } catch (error) {
            console.error('Error fetching avatar:', error);
            setAvatarUri(null);
        } finally {
            setLoadingAvatar(false);
        }
    };

    // Fetch avatar when user changes
    useEffect(() => {
        if (user) {
            fetchAvatar();
        } else {
            setAvatarUri(null);
        }

        // Cleanup blob URL on unmount
        return () => {
            if (avatarUri && avatarUri.startsWith('blob:')) {
                URL.revokeObjectURL(avatarUri);
            }
        };
    }, [user]);

    // Cleanup blob URL when avatarUri changes
    useEffect(() => {
        return () => {
            if (avatarUri && avatarUri.startsWith('blob:')) {
                URL.revokeObjectURL(avatarUri);
            }
        };
    }, [avatarUri]);

    const requestPermissions = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            alert('Permission Required', 'Sorry, we need camera roll permissions to change your profile picture.', []);
            return false;
        }
        return true;
    };

    const uploadAvatar = async (imageUri: string) => {
        if (!user) {
            alert('Error', 'User not authenticated', []);
            return;
        }

        // Don't upload if this is a child avatar being created (childId will be null initially)
        if (isChild && !childId) {
            // Just store the image locally for preview, don't upload yet
            setAvatarUri(imageUri);
            onImageChange?.(imageUri);
            return;
        }


        setUploading(true);

        try {
            // Get the JWT token from Firebase user
            const token = await user.getIdToken();

            // Create FormData for file upload
            let form = new FormData();

            form = await add_image_to_form(imageUri, form);

            const response = await fetch(avatarApiPath(), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: form,
            });

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.status}`);
            }

            const result = await response.json();

            // Refresh the avatar after successful upload
            await fetchAvatar();

            // Call the callback with the new image URI
            onImageChange?.(imageUri);


        } catch (error) {
            console.error('Error uploading avatar:', error);
            alert('Error', 'Failed to upload profile picture. Please try again.', []);
        } finally {
            setUploading(false);
        }
    };

    const pickImage = async () => {
        try {
            const hasPermission = await requestPermissions();
            if (!hasPermission) return;

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1], // Square aspect ratio for profile pictures
                quality: 0.5, // Reduced from 0.8 for faster processing
                base64: false,
                allowsMultipleSelection: false, // Explicitly disable multiple selection
                selectionLimit: 1, // Limit to single selection
                presentationStyle: ImagePicker.UIImagePickerPresentationStyle.POPOVER, // Better on iPad
            });

            if (!result.canceled && result.assets && result.assets[0]) {
                const imageUri = result.assets[0].uri;
                await uploadAvatar(imageUri);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            alert('Error', 'Failed to pick image. Please try again.', []);
        }
    };

    const handleAvatarPress = () => {
        if (!editable || uploading) return;
        pickImage();
    };

    const avatarContent = avatarUri ? (
        <Image
            source={{ uri: avatarUri }}
            style={[styles.avatarImage, {
                width: size,
                height: size,
                borderRadius: size / 2
            }]}
            resizeMode="cover"
        />
    ) : (
        <MaterialCommunityIcons
            name="account-circle"
            size={size}
            color={iconColor}
        />
    );

    // Calculate pen icon size based on avatar size
    const penIconSize = Math.max(12, size * 0.15);
    const penCircleSize = Math.max(24, size * 0.25);

    return (
        <View style={[styles.avatarContainer, { width: size, height: size }]}>
            <TouchableOpacity
                onPress={handleAvatarPress}
                style={styles.touchableArea}
                activeOpacity={editable ? 0.8 : 1}
                disabled={!editable || uploading}
            >
                {avatarContent}

                {/* Show loading spinner when uploading or loading avatar */}
                {(uploading || loadingAvatar) && (
                    <View style={[styles.loadingOverlay, {
                        width: size,
                        height: size,
                        borderRadius: size / 2
                    }]}>
                        <ActivityIndicator size="large" color="#fff" />
                    </View>
                )}

                {editable && !uploading && !loadingAvatar && (
                    <View style={[
                        styles.penIconContainer,
                        {
                            width: penCircleSize,
                            height: penCircleSize,
                            borderRadius: penCircleSize / 2,
                            right: penCircleSize * 0.05,
                            bottom: penCircleSize * 0.05,
                        }
                    ]}>
                        <MaterialCommunityIcons
                            name="pencil"
                            size={penIconSize}
                            color="#fff"
                        />
                    </View>
                )}
            </TouchableOpacity>
        </View>
    );
}
);

const styles = StyleSheet.create({
    avatarContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    touchableArea: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarImage: {
        borderWidth: 3,
        borderColor: '#fff',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    penIconContainer: {
        position: 'absolute',
        backgroundColor: 'rgba(128, 128, 128, 0.8)', // Transparent gray
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1,
    },
    loadingOverlay: {
        position: 'absolute',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default ProfileAvatar;
