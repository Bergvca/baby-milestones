import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, Platform } from 'react-native';
import { API_BASE_URL } from '@/app/constants/api'; // Adjust the import path as needed
import {Colors} from "@/components/colors";


interface MediaFile {
    file_md5: string;
}

interface PostProps {
    date: string;
    text: string;
    mediaFiles: MediaFile[];
    token: string;
}

interface ImageWithAuth {
    file_md5: string;
    uri: string;
}

const Post: React.FC<PostProps> = ({ date, text, mediaFiles, token }) => {
    const [authenticatedImages, setAuthenticatedImages] = useState<ImageWithAuth[]>([]);
    const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

    useEffect(() => {
        const fetchImages = async () => {
            if (Platform.OS === 'web') {
                // On web, fetch images with auth headers and convert to blob URLs
                const imagePromises = mediaFiles.map(async (mediaFile) => {
                    try {
                        const response = await fetch(`${API_BASE_URL}/image/${mediaFile.file_md5}`, {
                            headers: {
                                Authorization: `Bearer ${token}`
                            }
                        });

                        if (!response.ok) {
                            throw new Error(`Failed to fetch image: ${response.status}`);
                        }

                        const blob = await response.blob();
                        const blobUrl = URL.createObjectURL(blob);

                        return {
                            file_md5: mediaFile.file_md5,
                            uri: blobUrl
                        };
                    } catch (error) {
                        console.error('Error fetching image:', error);
                        setImageErrors(prev => new Set(prev).add(mediaFile.file_md5));
                        return null;
                    }
                });

                const results = await Promise.all(imagePromises);
                const validImages = results.filter((img): img is ImageWithAuth => img !== null);
                setAuthenticatedImages(validImages);
            } else {
                // On native platforms, use direct URI with headers
                const nativeImages = mediaFiles.map(mediaFile => ({
                    file_md5: mediaFile.file_md5,
                    uri: `${API_BASE_URL}/image/${mediaFile.file_md5}`
                }));
                setAuthenticatedImages(nativeImages);
            }
        };

        if (mediaFiles.length > 0 && token) {
            fetchImages();
        }

        // Cleanup blob URLs on unmount (web only)
        return () => {
            if (Platform.OS === 'web') {
                authenticatedImages.forEach(img => {
                    if (img.uri.startsWith('blob:')) {
                        URL.revokeObjectURL(img.uri);
                    }
                });
            }
        };
    }, [mediaFiles, token]);

    const getImageSource = (imageData: ImageWithAuth) => {
        if (Platform.OS === 'web') {
            return { uri: imageData.uri };
        } else {
            return {
                uri: imageData.uri,
                headers: {
                    Authorization: `Bearer ${token}`
                }
            };
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.date}>{date}</Text>

            {authenticatedImages.map((imageData) => (
                <Image
                    key={imageData.file_md5}
                    source={getImageSource(imageData)}
                    style={styles.image}
                    resizeMode="contain"
                    onError={(error) => {
                        console.error('Image load error:', error);
                        setImageErrors(prev => new Set(prev).add(imageData.file_md5));
                    }}
                />
            ))}

            {/* Show error message for failed images */}
            {imageErrors.size > 0 && (
                <Text style={styles.errorText}>
                    Some images failed to load
                </Text>
            )}

            <Text style={styles.text}>{text}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.neutral.offWhite,
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        shadowColor: Colors.neutral.darkGray || '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    date: {
        fontSize: 14,
        color: Colors.secondary,
        marginBottom: 8,
    },
    image: {
        width: '100%',
        height: 200,
        borderRadius: 4,
        marginBottom: 12,
    },
    text: {
        fontSize: 16,
        color: Colors.primary,
        lineHeight: 22,
    },
    errorText: {
        color: '#ff6b6b',
        fontSize: 12,
        fontStyle: 'italic',
        marginBottom: 8,
    },
});

export default Post;