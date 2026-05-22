import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Alert,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/app/context/AuthContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import ImageViewer from '@/components/ImageViewer';
import PostTextField from '@/components/PostTextField';
import Button from '@/components/Button';
import { IMAGE_PATH, POSTS_PATH } from '@/app/constants/api';
import { api } from '@/utils/apiClient';
import { uploadPostBinary, updatePostById } from '@/components/UploadPostBinary';
import { screenStyles } from '@/components/screenStyles';
import { Colors } from '@/components/colors';
import { DatePicker } from '@/components/DatePicker';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { fetchAllChildren, type FamilyChild } from '@/utils/childUtils';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import ProfileAvatar from '@/components/ProfileAvatar';
import CustomAlert from '@/components/CustomAlert';
import * as FileSystemLegacy from 'expo-file-system/legacy';

export default function Upload() {
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
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
  const [children, setChildren] = useState<FamilyChild[]>([]);
  const [selectedChildrenIds, setSelectedChildrenIds] = useState<number[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(false);
  const { user, getToken } = useAuth();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 640;

  // Alert state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  // Get params from navigation
  const params = useLocalSearchParams();

  const showAlert = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

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
      day: 'numeric',
    });
  };

  // Fetch all children
  const loadChildren = async (authToken: string) => {
    setLoadingChildren(true);
    try {
      const allChildren = await fetchAllChildren(authToken);
      setChildren(allChildren);
    } catch (error) {
      console.error('Error loading children:', error);
      Alert.alert('Error', 'Failed to load children');
    } finally {
      setLoadingChildren(false);
    }
  };

  // Toggle child selection
  const toggleChildSelection = (childId: number) => {
    setSelectedChildrenIds((prev) => {
      if (prev.includes(childId)) {
        return prev.filter((id) => id !== childId);
      } else {
        return [...prev, childId];
      }
    });
  };

  // Load images for editing from media file MD5 hashes
  const loadImagesForEditing = async (mediaFiles: { file_md5: string }[], token: string) => {
    const loadedImages: string[] = [];

    for (const mediaFile of mediaFiles) {
      try {
        if (Platform.OS === 'web') {
          const imageResponse = await api.raw(`${IMAGE_PATH}/${mediaFile.file_md5}`);
          const blob = await imageResponse.blob();
          const blobUrl = URL.createObjectURL(blob);
          loadedImages.push(blobUrl);
        } else {
          // Download to a local file so FormData can read it during update
          const localDir = `${FileSystemLegacy.cacheDirectory}edit_images/`;
          const dirInfo = await FileSystemLegacy.getInfoAsync(localDir);
          if (!dirInfo.exists) {
            await FileSystemLegacy.makeDirectoryAsync(localDir, { intermediates: true });
          }
          const localPath = `${localDir}${mediaFile.file_md5}.jpg`;
          const dl = await FileSystemLegacy.downloadAsync(
            `${IMAGE_PATH}/${mediaFile.file_md5}`,
            localPath,
            { headers: { Authorization: `Bearer ${token}` } },
          );
          if (dl.status === 200) {
            loadedImages.push(dl.uri);
          }
        }
      } catch (error) {
        console.error('Error loading image:', error);
      }
    }

    return loadedImages;
  };

  // Load post data for editing
  const loadPostForEditing = async (
    postId: string,
    token: string,
    paramMediaFiles?: { file_md5: string }[],
  ) => {
    setLoadingPostData(true);
    try {
      // Fetch post details
      const postData = await api.get<{
        description?: string;
        date: string;
        selected_children_ids?: number[];
        media_files?: { file_md5: string }[];
      }>(`${POSTS_PATH}/${postId}`);

      // Set the form data
      setPostText(postData.description || '');
      setSelectedDate(new Date(postData.date));

      // Set selected children IDs if available
      if (postData.selected_children_ids && Array.isArray(postData.selected_children_ids)) {
        setSelectedChildrenIds(postData.selected_children_ids);
      }

      // Use media files from params (reliable), falling back to API response
      const mediaFiles =
        paramMediaFiles ??
        (postData.media_files && Array.isArray(postData.media_files) ? postData.media_files : []);

      if (mediaFiles.length > 0) {
        const loadedImages = await loadImagesForEditing(mediaFiles, token);
        setSelectedImages(loadedImages);
      }
    } catch (error) {
      console.error('Error loading post for editing:', error);
      Alert.alert('Error', 'Failed to load post data for editing');
    } finally {
      setLoadingPostData(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setToken(null);
      setChildren([]);
      return;
    }
    getToken()
      .then(async (idToken) => {
        setToken(idToken);
        if (idToken) {
          await loadChildren(idToken);
        }
      })
      .catch(() => {
        setToken(null);
        setChildren([]);
      });
  }, [user, getToken]);

  // Guard ref: when we clear edit params after consuming them,
  // prevent the else-if branch from resetting the form
  const isSettingUpEdit = useRef(false);

  useFocusEffect(
    useCallback(() => {
      // Reset form when leaving the upload screen
      return () => {
        resetFormState();
      };
    }, []),
  );

  const resetFormState = () => {
    setSelectedImages([]);
    setPostText('');
    setSelectedDate(new Date());
    setIsEditMode(false);
    setEditingPostId(null);
    setUploadSuccess(false);
    setSelectedChildrenIds([]);
  };

  // Handle edit mode setup
  useEffect(() => {
    const editMode = params.editMode;
    const postId = params.postId;

    if (editMode === 'true' && postId && token) {
      if (editingPostId !== postId) {
        isSettingUpEdit.current = true;
        setIsEditMode(true);
        setEditingPostId(postId as string);

        // Parse media files from navigation params if available
        let paramMediaFiles: { file_md5: string }[] | undefined;
        if (params.mediaFiles) {
          try {
            paramMediaFiles = JSON.parse(params.mediaFiles as string);
          } catch (e) {
            console.warn('Failed to parse mediaFiles param:', e);
          }
        }

        // Load complete post data including images
        loadPostForEditing(postId as string, token, paramMediaFiles);

        // Clear edit params so they don't re-trigger on next tab focus
        router.setParams({ editMode: '', postId: '', mediaFiles: '' });
      }
    } else if (editMode !== 'true' && isEditMode) {
      // When params are cleared (by us above), skip the reset
      if (!isSettingUpEdit.current) {
        resetFormState();
      }
      isSettingUpEdit.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.editMode, params.postId, params.mediaFiles, token, editingPostId, isEditMode]);

  const pickImageAsync = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Please grant photo library access to choose images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      const newImages = result.assets.map((asset) => asset.uri);
      setSelectedImages((prev) => [...prev, ...newImages]);
      setUploadSuccess(false); // reset success state when picking new images
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadSuccess = async () => {
    setUploadSuccess(true);
    setUploading(false);
    const successMessage = isEditMode ? 'Milestone Updated!' : 'Milestone Created!';

    // Show success message for 1 second, then reset and navigate
    setTimeout(() => {
      resetFormState();
      router.push('/(tabs)'); // Navigate to home/index
    }, 1000);
  };

  const onCreatePost = async () => {
    if (!token) {
      showAlert('Not signed in', 'Please sign in before creating a post.');
      return;
    }
    if (selectedImages.length === 0 && !postText.trim()) {
      showAlert(
        'Content required',
        'Please choose at least one image or add some text to create a post.',
      );
      return;
    }

    try {
      setUploading(true);

      if (isEditMode && editingPostId) {
        // Update existing post with multiple images
        await updatePostById(
          editingPostId,
          postText,
          selectedDate,
          selectedImages,
          selectedChildrenIds,
        );
      } else {
        // Create new post with multiple images
        await uploadPostBinary({
          imageUris: selectedImages,
          text: postText,
          date: selectedDate,
          selectedChildrenIds: selectedChildrenIds,
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
      <View style={screenStyles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={screenStyles.text}>Loading post data...</Text>
      </View>
    );
  }

  return (
    <>
      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        buttons={[
          {
            text: 'OK',
            onPress: () => setAlertVisible(false),
          },
        ]}
        onRequestClose={() => setAlertVisible(false)}
      />

      <KeyboardAvoidingView
        style={screenStyles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={screenStyles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={screenStyles.header}>
            <Text style={screenStyles.title}>
              {isEditMode ? 'Edit Milestone' : 'Create Milestone'}
            </Text>
            <Text style={screenStyles.subtitle}>
              {isEditMode ? 'Update your precious moment' : 'Share your precious moments'}
            </Text>
          </View>

          <View style={screenStyles.form}>
            {uploadSuccess ? (
              <View style={screenStyles.center}>
                <Text style={[screenStyles.title, { color: Colors.primary }]}>
                  {isEditMode ? 'Milestone Updated!' : 'Milestone Created!'}
                </Text>
              </View>
            ) : (
              <>
                <View style={screenStyles.addButtonContainer}>
                  <ImageViewer
                    selectedImages={selectedImages}
                    onRemoveImage={removeImage}
                    onPickImages={pickImageAsync}
                    imageHeaders={token ? { Authorization: `Bearer ${token}` } : undefined}
                  />
                </View>

                <View style={screenStyles.inputContainer}>
                  <Text style={screenStyles.label}>Date</Text>
                  <DatePicker
                    onPress={() => setShowDatePicker(true)}
                    disabled={uploading}
                    s={formatDate(selectedDate)}
                    onDateChange={handleWebDateChange}
                    selectedDate={selectedDate}
                  />
                </View>

                {/* Only show DateTimePicker on mobile platforms */}
                {showDatePicker && Platform.OS !== 'web' && (
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onDateChange}
                  />
                )}

                {/* Children Multi-Select Section */}
                <View style={screenStyles.inputContainer}>
                  <Text style={screenStyles.label}>Children in this Milestone:</Text>
                  {loadingChildren ? (
                    <ActivityIndicator size="small" color={Colors.primary} />
                  ) : children.length === 0 ? (
                    <Text style={screenStyles.text}>No children available</Text>
                  ) : (
                    <View style={{ gap: 12 }}>
                      {children.map((child) => (
                        <TouchableOpacity
                          key={child.id}
                          style={[
                            {
                              flexDirection: 'row',
                              alignItems: 'center',
                              padding: 12,
                              borderWidth: 1,
                              borderColor: selectedChildrenIds.includes(child.id)
                                ? Colors.primary
                                : Colors.neutral.border,
                              borderRadius: 8,
                              backgroundColor: selectedChildrenIds.includes(child.id)
                                ? `${Colors.primary}15`
                                : Colors.neutral.white,
                            },
                          ]}
                          onPress={() => toggleChildSelection(child.id)}
                        >
                          <View
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: 4,
                              borderWidth: 2,
                              borderColor: selectedChildrenIds.includes(child.id)
                                ? Colors.primary
                                : Colors.neutral.lightGray,
                              backgroundColor: selectedChildrenIds.includes(child.id)
                                ? Colors.primary
                                : Colors.neutral.white,
                              justifyContent: 'center',
                              alignItems: 'center',
                              marginRight: 12,
                            }}
                          >
                            {selectedChildrenIds.includes(child.id) && (
                              <MaterialCommunityIcons
                                name="check"
                                size={16}
                                color={Colors.neutral.white}
                              />
                            )}
                          </View>
                          <ProfileAvatar
                            size={40}
                            editable={false}
                            isChild={true}
                            childId={child.id}
                          />
                          <Text style={screenStyles.menuText}>{child.full_name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                <View style={screenStyles.inputContainer}>
                  <Text style={screenStyles.label}>Milestone Description:</Text>
                  <PostTextField value={postText} onChangeText={setPostText} />
                </View>
              </>
            )}
          </View>
        </ScrollView>

        {!uploadSuccess && (
          <View style={screenStyles.buttonRow}>
            <TouchableOpacity
              style={screenStyles.secondaryButton}
              onPress={pickImageAsync}
              disabled={uploading}
            >
              <MaterialIcons name="image" size={20} color={Colors.neutral.darkGray} />
              {!isSmallScreen && (
                <Text style={screenStyles.secondaryButtonText}>Choose Images</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[screenStyles.primaryButton, uploading && screenStyles.disabledButton]}
              onPress={onCreatePost}
              disabled={uploading}
            >
              <Text
                style={[
                  screenStyles.primaryButtonText,
                  uploading && screenStyles.disabledButtonText,
                ]}
              >
                {uploading ? 'Uploading...' : isEditMode ? 'Update Post' : 'Create Post'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {uploading && (
          <View style={screenStyles.center}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        )}
      </KeyboardAvoidingView>
    </>
  );
}
