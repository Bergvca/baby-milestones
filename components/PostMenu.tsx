import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import { Colors } from './colors';
import { POSTS_PATH } from '@/app/constants/api';
import { api } from '@/utils/apiClient';
import CustomAlert from './CustomAlert';
import { router } from 'expo-router';

interface PostMenuProps {
  postId: string | number;
  token: string;
  mediaFiles?: { file_md5: string }[];
  onEdit: () => void;
  onDelete: () => void;
}

export default function PostMenu({ postId, token, mediaFiles, onEdit, onDelete }: PostMenuProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleEdit = () => {
    setIsVisible(false);
    // Navigate to upload page with post data
    router.navigate({
      pathname: '/(tabs)/upload',
      params: {
        editMode: 'true',
        postId: postId,
        mediaFiles: mediaFiles ? JSON.stringify(mediaFiles) : undefined,
      },
    });
    onEdit();
  };

  const deletePost = async (postId: string | number): Promise<void> => {
    await api.del<void>(`${POSTS_PATH}/${postId}`);
  };

  const handleDelete = () => {
    setIsVisible(false);
    if (Platform.OS === 'web') {
      setShowDeleteAlert(true);
    } else {
      Alert.alert(
        'Delete Post',
        'Are you sure you want to delete this post? This action cannot be undone.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: performDelete,
          },
        ],
      );
    }
  };

  const performDelete = async () => {
    setIsDeleting(true);
    try {
      await deletePost(postId);
      if (Platform.OS === 'web') {
        setShowSuccessAlert(true);
      } else {
        Alert.alert('Success', 'Post deleted successfully', [
          {
            text: 'OK',
            onPress: () => {
              onDelete();
            },
          },
        ]);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred';

      if (Platform.OS === 'web') {
        setErrorMessage(`Failed to delete post: ${errorMsg}`);
        setShowErrorAlert(true);
      } else {
        Alert.alert('Error', `Failed to delete post: ${errorMsg}`);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => setIsVisible(true)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        disabled={isDeleting}
      >
        <View style={styles.dotsContainer}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setIsVisible(false)}>
          <View style={styles.dropdown}>
            <TouchableOpacity style={styles.menuItem} onPress={handleEdit} disabled={isDeleting}>
              <Text style={styles.menuText}>✏️ Edit</Text>
            </TouchableOpacity>

            <View style={styles.separator} />

            <TouchableOpacity style={styles.menuItem} onPress={handleDelete} disabled={isDeleting}>
              <Text style={[styles.menuText, styles.deleteText]}>
                {isDeleting ? '🔄 Deleting...' : '🗑️ Delete'}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Custom Alerts for Web */}
      <CustomAlert
        visible={showDeleteAlert}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
        buttons={[
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setShowDeleteAlert(false),
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              setShowDeleteAlert(false);
              performDelete();
            },
          },
        ]}
        onRequestClose={() => setShowDeleteAlert(false)}
      />

      <CustomAlert
        visible={showSuccessAlert}
        title="Success"
        message="Post deleted successfully"
        buttons={[
          {
            text: 'OK',
            onPress: () => {
              setShowSuccessAlert(false);
              onDelete();
            },
          },
        ]}
        onRequestClose={() => {
          setShowSuccessAlert(false);
          onDelete();
        }}
      />

      <CustomAlert
        visible={showErrorAlert}
        title="Error"
        message={errorMessage}
        buttons={[
          {
            text: 'OK',
            onPress: () => setShowErrorAlert(false),
          },
        ]}
        onRequestClose={() => setShowErrorAlert(false)}
      />
    </>
  );
}

// ... rest of your styles remain the same
const styles = StyleSheet.create({
  menuButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dotsContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.neutral?.lightGray || '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdown: {
    backgroundColor: Colors.neutral?.darkGray || '#2a2a2a',
    borderRadius: 8,
    minWidth: 120,
    paddingVertical: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuText: {
    color: Colors.neutral?.lightGray || '#fff',
    fontSize: 16,
  },
  deleteText: {
    color: '#ff6b6b',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 8,
  },
});
