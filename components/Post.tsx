
import React, {useEffect, useState} from 'react';
import {View, Text, Image, StyleSheet, Platform} from 'react-native';
import {IMAGE_PATH} from '@/app/constants/api';
import {Colors} from "@/components/colors";
import {screenStyles} from "@/components/screenStyles";
import PostMenu from './PostMenu';
import {formatDate} from "@/utils/utils";
import ProfileAvatar, { ProfileAvatarRef } from '@/components/ProfileAvatar';



interface MediaFile {
    file_md5: string;
}

interface PostProps {
    id: number,
    date: string,
    text: string,
    mediaFiles: MediaFile[],
    token: string,
    onEdit: () => void,
    onDelete: () => void,
    selectedChildrenIds?: number[]
}


interface ImageWithAuth {
    file_md5: string;
    uri: string;
}

const Post: React.FC<PostProps> = ({
                                       id,
                                       date,
                                       text,
                                       mediaFiles,
                                       token,
                                       onEdit,
                                       onDelete,
                                       selectedChildrenIds
                                   }: PostProps) => {
    const [authenticatedImages, setAuthenticatedImages] = useState<ImageWithAuth[]>([]);
    const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

    useEffect(() => {
        const fetchImages = async () => {
            if (Platform.OS === 'web') {
                // On web, fetch images with auth headers and convert to blob URLs
                const imagePromises = mediaFiles.map(async (mediaFile) => {
                    try {
                        const response = await fetch(`${IMAGE_PATH}/${mediaFile.file_md5}`, {
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
                    uri: `${IMAGE_PATH}/${mediaFile.file_md5}`
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
            return {uri: imageData.uri};
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
            <View style={styles.postHeader}>
                <View style={styles.childAvatarsContainer}>
                    {selectedChildrenIds && selectedChildrenIds.length > 0 && (
                        selectedChildrenIds.map((childId) => (
                            <View key={childId} style={styles.avatarWrapper}>
                                <ProfileAvatar
                                    size={40}
                                    editable={false}
                                    isChild={true}
                                    childId={childId}
                                />
                            </View>
                        ))
                    )}
                </View>

                <Text style={styles.date}>{formatDate(date)}</Text>
                <PostMenu
                    postId={id}
                    token={token}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            </View>


            {authenticatedImages.map((imageData) => (
                <View key={imageData.file_md5} style={styles.imageContainer}>

                    <Image
                        source={getImageSource(imageData)}
                        style={styles.image}
                        resizeMode="cover"
                        onError={(error) => {
                            console.error('Image load error:', error);
                            setImageErrors(prev => new Set(prev).add(imageData.file_md5));
                        }}
                    />
                </View>

            ))}

            {/* Show error message for failed images */}
            {imageErrors.size > 0 && (
                <Text style={screenStyles.errorText}>
                    Some images failed to load
                </Text>
            )}

            <Text style={screenStyles.text}>{text}</Text>

        </View>
    );
};


const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.neutral.white,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: Colors.neutral.darkGray,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 5,
    },
    childAvatarsContainer: {
        flexDirection: 'row',
        gap: 8,
        flex: 1,
    },
    avatarWrapper: {
        width: 32,
        height: 32,
    },
    postHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    imageContainer: {
        width: '100%',
        height: 300,
        marginBottom: 12,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: 'transparent',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    date: {
        color: Colors.secondary,
        fontSize: 14,
        marginBottom: 8,
    },
});


export default Post;