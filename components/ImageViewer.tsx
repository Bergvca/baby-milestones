import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from './colors';

interface ImageViewerProps {
    selectedImages: string[];
    onRemoveImage?: (index: number) => void;
    onPickImages?: () => void;
}

export default function ImageViewer({ selectedImages, onRemoveImage, onPickImages }: ImageViewerProps) {
    if (selectedImages.length === 0) {
        return (
            <TouchableOpacity style={styles.placeholder} onPress={onPickImages}>
                <MaterialIcons name="image" size={48} color={Colors.neutral.lightGray} />
                <Text style={styles.placeholderText}>No images selected</Text>
                <Text style={styles.tapToSelectText}>Tap to choose images</Text>
            </TouchableOpacity>
        );
    }

    return (
        <View style={styles.container}>
            {/* First (main) image on the left */}
            <View style={styles.mainImageContainer}>
                <Image source={{ uri: selectedImages[0] }} style={styles.mainImage} />
                {onRemoveImage && (
                    <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => onRemoveImage(0)}
                    >
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
                            <Image source={{ uri: selectedImages[1] }} style={styles.smallImage} />
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
                            <Image source={{ uri: selectedImages[2] }} style={styles.smallImage} />

                            {/* Gray overlay for third image */}
                            <View style={styles.overlay} />

                            {/* Show number of additional images if more than 3 */}
                            {selectedImages.length > 3 && (
                                <View style={styles.additionalCountContainer}>
                                    <Text style={styles.additionalCountText}>
                                        +{selectedImages.length - 3}
                                    </Text>
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
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'flex-start',
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
        position: 'relative',
    },
    mainImage: {
        width: 300,
        height: 300,
        borderRadius: 8,
    },
    sideImagesContainer: {
        flexDirection: 'column',
        gap: 8,
    },
    smallImageContainer: {
        position: 'relative',
    },
    smallImage: {
        width: 200,
        height: 146,
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