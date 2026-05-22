import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from './colors';
import AuthenticatedImage from './AuthenticatedImage';

interface ImageViewerProps {
  selectedImages: string[];
  onRemoveImage?: (index: number) => void;
  onPickImages?: () => void;
  imageHeaders?: { [key: string]: string };
}

export default function ImageViewer({
  selectedImages,
  onRemoveImage,
  onPickImages,
  imageHeaders,
}: ImageViewerProps) {
  if (selectedImages.length === 0) {
    if (!onPickImages) {
      return null;
    }

    return (
      <View style={styles.centerWrapper}>
        <TouchableOpacity style={styles.placeholder} onPress={onPickImages}>
          <MaterialIcons name="image" size={48} color={Colors.neutral.lightGray} />
          <Text style={styles.placeholderText}>No images selected</Text>
          <Text style={styles.tapToSelectText}>Tap to choose images</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Single image layout - full width with original aspect ratio
  if (selectedImages.length === 1) {
    return (
      <View style={styles.centerWrapper}>
        <View style={styles.singleImageContainer}>
          <AuthenticatedImage
            uri={selectedImages[0] ?? ''}
            headers={imageHeaders}
            style={styles.singleImage}
            contentFit="cover"
            transition={200}
          />
          {onRemoveImage && (
            <TouchableOpacity style={styles.removeButton} onPress={() => onRemoveImage(0)}>
              <MaterialIcons name="close" size={20} color={Colors.neutral.white} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // Multiple images layout - flex-based sizing
  return (
    <View style={styles.centerWrapper}>
      <View style={styles.container}>
        {/* First (main) image on the left */}
        <View style={styles.mainImageContainer}>
          <AuthenticatedImage
            uri={selectedImages[0] ?? ''}
            headers={imageHeaders}
            style={styles.mainImage}
            contentFit="cover"
          />
          {onRemoveImage && (
            <TouchableOpacity style={styles.removeButton} onPress={() => onRemoveImage(0)}>
              <MaterialIcons name="close" size={20} color={Colors.neutral.white} />
            </TouchableOpacity>
          )}
        </View>

        {/* Right side with smaller images */}
        {selectedImages.length > 1 && (
          <View style={styles.sideImagesContainer}>
            {/* Second image */}
            {selectedImages[1] && (
              <View style={styles.smallImageContainer}>
                <AuthenticatedImage
                  uri={selectedImages[1]}
                  headers={imageHeaders}
                  style={styles.smallImage}
                  contentFit="cover"
                />
                {onRemoveImage && (
                  <TouchableOpacity
                    style={styles.smallRemoveButton}
                    onPress={() => onRemoveImage(1)}
                  >
                    <MaterialIcons name="close" size={16} color={Colors.neutral.white} />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Third image (with overlay if more images exist) */}
            {selectedImages[2] && (
              <View style={styles.smallImageContainer}>
                <AuthenticatedImage
                  uri={selectedImages[2]}
                  headers={imageHeaders}
                  style={styles.smallImage}
                  contentFit="cover"
                />

                {/* Gray overlay for third image */}
                <View style={styles.overlay} />

                {/* Show number of additional images if more than 3 */}
                {selectedImages.length > 3 && (
                  <View style={styles.additionalCountContainer}>
                    <Text style={styles.additionalCountText}>+{selectedImages.length - 3}</Text>
                  </View>
                )}

                {onRemoveImage && (
                  <TouchableOpacity
                    style={styles.smallRemoveButton}
                    onPress={() => onRemoveImage(2)}
                  >
                    <MaterialIcons name="close" size={16} color={Colors.neutral.white} />
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centerWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    width: '100%',
    flexDirection: 'row',
    gap: 8,
  },
  singleImageContainer: {
    width: '100%',
    position: 'relative',
  },
  singleImage: {
    width: '100%',
    borderRadius: 8,
    aspectRatio: 1,
  },
  placeholder: {
    width: 300,
    height: 150,
    backgroundColor: Colors.neutral.border,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.neutral.lightGray,
    borderStyle: 'dashed',
  },
  placeholderText: {
    color: Colors.neutral.lightGray,
    marginTop: 8,
    fontSize: 14,
  },
  tapToSelectText: {
    color: Colors.primary,
    marginTop: 4,
    fontSize: 12,
    fontWeight: '500',
  },
  mainImageContainer: {
    flex: 3,
    position: 'relative',
  },
  mainImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
  },
  sideImagesContainer: {
    flex: 2,
    flexDirection: 'column',
    gap: 8,
  },
  smallImageContainer: {
    flex: 1,
    position: 'relative',
  },
  smallImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(128, 128, 128, 0.5)',
    borderRadius: 8,
  },
  additionalCountContainer: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  additionalCountText: {
    color: Colors.neutral.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 4,
  },
  smallRemoveButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 10,
    padding: 2,
  },
});
