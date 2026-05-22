import React, { useMemo, useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from './colors';
import * as ImagePicker from 'expo-image-picker';
import alert from '@/components/Alert';
import { CHILD_AVATAR_PATH, USER_AVATAR_PATH } from '@/app/constants/api';
import { useAuth } from '@/app/context/AuthContext';
import { add_image_to_form } from '@/components/UploadPostBinary';
import { api, ApiError } from '@/utils/apiClient';
import { Image as ExpoImage } from 'expo-image';
import AuthenticatedImage, { deleteCachedImageFile } from '@/components/AuthenticatedImage';
import * as FileSystemLegacy from 'expo-file-system/legacy';

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

const ProfileAvatar = React.forwardRef<ProfileAvatarRef, ProfileAvatarProps>(function ProfileAvatar(
  {
    size = 120,
    iconColor = Colors.accent.yellow,
    onImageChange,
    editable = false,
    isChild = false,
    childId,
  },
  ref,
) {
  const { user, getToken } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [pendingLocalUri, setPendingLocalUri] = useState<string | null>(null);
  const [loadingAvatar, setLoadingAvatar] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const avatarApiPath = () => {
    if (!user) return '';
    return isChild ? `${CHILD_AVATAR_PATH}/${childId}` : `${USER_AVATAR_PATH}/${user.uid}`;
  };

  // Deterministic cache path (native only)
  // refreshKey is included so that after an upload the path changes,
  // preventing ExpoImage from serving its stale internal cache.
  const avatarCachePath = useMemo(() => {
    if (Platform.OS === 'web') return undefined;
    const base = FileSystemLegacy.cacheDirectory;
    if (!base || !user) return undefined;

    if (isChild) {
      if (!childId) return undefined;
      return `${base}avatars/child_${childId}_v${refreshKey}.jpg`;
    }
    return `${base}avatars/user_${user.uid}_v${refreshKey}.jpg`;
  }, [user, isChild, childId, refreshKey]);

  React.useImperativeHandle(ref, () => ({
    uploadAvatarForChild: async (childIdToUpload: number) => {
      if (!pendingLocalUri || !user) return false;
      try {
        let form = new FormData();
        form = await add_image_to_form(pendingLocalUri, form);

        await api.upload<unknown>(`${CHILD_AVATAR_PATH}/${childIdToUpload}`, form);

        // Clear ExpoImage cache for this avatar — needed because the component
        // navigates away immediately, so the versioned cache path trick won't help.
        await ExpoImage.clearMemoryCache();
        await ExpoImage.clearDiskCache();
        if (avatarCachePath) await deleteCachedImageFile(avatarCachePath);

        setPendingLocalUri(null);
        setRefreshKey((k) => k + 1);
        return true;
      } catch (error) {
        console.error('Error uploading child avatar:', error);
        return false;
      }
    },
    getAvatarUri: () => pendingLocalUri,
  }));

  const fetchAvatar = async () => {
    if (!user || (!childId && isChild)) {
      setAvatarUri(null);
      return;
    }

    setLoadingAvatar(true);
    try {
      const userToken = await getToken();
      if (!userToken) {
        setAvatarUri(null);
        return;
      }
      setToken(userToken);

      // We only use this request to check existence / 404.
      // Actual image bytes are loaded by AuthenticatedImage into the deterministic path.
      const response = await api.raw(avatarApiPath());

      if (Platform.OS === 'web') {
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        setAvatarUri(blobUrl);
      } else {
        setAvatarUri(avatarApiPath());
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        setAvatarUri(null);
      } else {
        console.error('Error fetching avatar:', error);
        setAvatarUri(null);
      }
    } finally {
      setLoadingAvatar(false);
    }
  };

  useEffect(() => {
    if (user) fetchAvatar();
    else {
      setAvatarUri(null);
      setToken(null);
    }

    return () => {
      if (Platform.OS === 'web' && avatarUri && avatarUri.startsWith('blob:')) {
        URL.revokeObjectURL(avatarUri);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, childId, isChild, refreshKey]);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert(
        'Permission Required',
        'Sorry, we need camera roll permissions to change your profile picture.',
        [],
      );
      return false;
    }
    return true;
  };

  const uploadAvatar = async (imageUri: string) => {
    if (!user) {
      alert('Error', 'User not authenticated', []);
      return;
    }

    if (isChild) {
      setAvatarUri(imageUri);
      setPendingLocalUri(imageUri);
      onImageChange?.(imageUri);
      return;
    }

    setUploading(true);
    try {
      const userToken = await getToken();
      if (!userToken) {
        alert('Error', 'No auth token available', []);
        return;
      }
      setToken(userToken);

      let form = new FormData();
      form = await add_image_to_form(imageUri, form);

      await api.upload<unknown>(avatarApiPath(), form);

      // Delete deterministic cache file so next render re-downloads
      if (avatarCachePath) await deleteCachedImageFile(avatarCachePath);

      setRefreshKey((k) => k + 1);
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
        aspect: [1, 1],
        quality: 0.5,
        base64: false,
        allowsMultipleSelection: false,
        selectionLimit: 1,
        presentationStyle: ImagePicker.UIImagePickerPresentationStyle.POPOVER,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        await uploadAvatar(result.assets[0].uri);
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

  const penIconSize = Math.max(12, size * 0.15);
  const penCircleSize = Math.max(24, size * 0.25);

  const headers = token && Platform.OS !== 'web' ? { Authorization: `Bearer ${token}` } : undefined;

  return (
    <View style={[styles.avatarContainer, { width: size, height: size }]}>
      <TouchableOpacity
        onPress={handleAvatarPress}
        style={styles.touchableArea}
        activeOpacity={editable ? 0.8 : 1}
        disabled={!editable || uploading}
      >
        {avatarUri ? (
          <AuthenticatedImage
            // key forces full re-mount so ExpoImage doesn't serve stale in-memory cache
            key={refreshKey}
            uri={
              Platform.OS === 'web' || avatarUri.startsWith('file:')
                ? avatarUri
                : `${avatarUri}${avatarUri.includes('?') ? '&' : '?'}rk=${refreshKey}`
            }
            headers={avatarUri.startsWith('file:') ? undefined : headers}
            cacheFilePath={avatarUri.startsWith('http') ? avatarCachePath : undefined}
            style={[
              styles.avatarImage,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
              },
            ]}
            contentFit="cover"
          />
        ) : (
          <MaterialCommunityIcons name="account-circle" size={size} color={iconColor} />
        )}

        {(uploading || loadingAvatar) && (
          <View
            style={[
              styles.loadingOverlay,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
              },
            ]}
          >
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}

        {editable && !uploading && !loadingAvatar && (
          <View
            style={[
              styles.penIconContainer,
              {
                width: penCircleSize,
                height: penCircleSize,
                borderRadius: penCircleSize / 2,
                right: penCircleSize * 0.05,
                bottom: penCircleSize * 0.05,
              },
            ]}
          >
            <MaterialCommunityIcons name="pencil" size={penIconSize} color="#fff" />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  avatarContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  touchableArea: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    backgroundColor: Colors.neutral.lightGray,
  },
  loadingOverlay: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  penIconContainer: {
    position: 'absolute',
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.neutral.white,
  },
});

export default ProfileAvatar;
