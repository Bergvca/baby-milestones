whenimport React, {useEffect, useState} from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Platform,
    useWindowDimensions,
    ActivityIndicator,
} from 'react-native';
import {router, useLocalSearchParams} from 'expo-router';
import {MaterialIcons} from '@expo/vector-icons';
import {useAuth} from '@/app/context/AuthContext';
import {IMAGE_PATH} from '@/app/constants/api';
import {fetchFullChildData, FamilyChild} from '@/utils/childUtils';
import {formatDate} from '@/utils/utils';
import {Colors} from '@/components/colors';
import ProfileAvatar from '@/components/ProfileAvatar';
import AuthenticatedImage from '@/components/AuthenticatedImage';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

interface MediaFile {
    file_md5: string;
}

function calculateAgeAtDate(birthdate: string, postDate: string): string {
    const birth = new Date(birthdate);
    const post = new Date(postDate);

    let years = post.getFullYear() - birth.getFullYear();
    let months = post.getMonth() - birth.getMonth();

    if (months < 0) {
        years--;
        months += 12;
    }

    // Adjust if day hasn't been reached yet in the month
    if (post.getDate() < birth.getDate()) {
        months--;
        if (months < 0) {
            years--;
            months += 12;
        }
    }

    if (years < 0) return '';

    const parts: string[] = [];
    if (years > 0) parts.push(`${years} year${years !== 1 ? 's' : ''}`);
    if (months > 0) parts.push(`${months} month${months !== 1 ? 's' : ''}`);

    return parts.length > 0 ? parts.join(', ') : 'newborn';
}

export default function PostDetailScreen() {
    const params = useLocalSearchParams<{
        postId: string;
        date: string;
        description: string;
        selectedChildrenIds: string;
        mediaFiles: string;
    }>();
    const {user} = useAuth();
    const {width: screenWidth} = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const [token, setToken] = useState<string | null>(null);
    const [children, setChildren] = useState<FamilyChild[]>([]);
    const [loadingChildren, setLoadingChildren] = useState(true);
    const [authenticatedImages, setAuthenticatedImages] = useState<{file_md5: string; uri: string}[]>([]);

    const selectedChildrenIds: number[] = params.selectedChildrenIds
        ? JSON.parse(params.selectedChildrenIds)
        : [];
    const mediaFiles: MediaFile[] = params.mediaFiles
        ? JSON.parse(params.mediaFiles)
        : [];

    useEffect(() => {
        if (!user) return;
        user.getIdToken().then(setToken);
    }, [user]);

    // Fetch child data
    useEffect(() => {
        if (!token || selectedChildrenIds.length === 0) {
            setLoadingChildren(false);
            return;
        }

        const fetchChildren = async () => {
            setLoadingChildren(true);
            const results = await Promise.all(
                selectedChildrenIds.map((id) => fetchFullChildData(token, id))
            );
            setChildren(results.filter((c): c is FamilyChild => c !== null));
            setLoadingChildren(false);
        };

        fetchChildren();
    }, [token]);

    // Fetch images (same pattern as Post.tsx)
    useEffect(() => {
        if (!token || mediaFiles.length === 0) return;

        const fetchImages = async () => {
            if (Platform.OS === 'web') {
                const imagePromises = mediaFiles.map(async (mediaFile) => {
                    try {
                        const response = await fetch(`${IMAGE_PATH}/${mediaFile.file_md5}`, {
                            headers: {Authorization: `Bearer ${token}`},
                        });
                        if (!response.ok) throw new Error(`Failed: ${response.status}`);
                        const blob = await response.blob();
                        return {file_md5: mediaFile.file_md5, uri: URL.createObjectURL(blob)};
                    } catch {
                        return null;
                    }
                });
                const results = await Promise.all(imagePromises);
                setAuthenticatedImages(results.filter((img): img is {file_md5: string; uri: string} => img !== null));
            } else {
                setAuthenticatedImages(
                    mediaFiles.map((mf) => ({file_md5: mf.file_md5, uri: `${IMAGE_PATH}/${mf.file_md5}`}))
                );
            }
        };

        fetchImages();

        return () => {
            if (Platform.OS === 'web') {
                authenticatedImages.forEach((img) => {
                    if (img.uri.startsWith('blob:')) URL.revokeObjectURL(img.uri);
                });
            }
        };
    }, [token]);

    const imageWidth = screenWidth - 32;
    const authHeaders = token && Platform.OS !== 'web' ? {Authorization: `Bearer ${token}`} : undefined;

    return (
        <View style={[styles.screen, {paddingTop: insets.top}]}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <MaterialIcons name="arrow-back" size={28} color={Colors.neutral.darkGray} />
            </TouchableOpacity>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Date */}
                <Text style={styles.dateText}>{formatDate(params.date)}</Text>

                {/* Children */}
                {loadingChildren ? (
                    <ActivityIndicator color={Colors.primary} style={{marginVertical: 12}} />
                ) : children.length > 0 ? (
                    <View style={styles.childrenRow}>
                        {children.map((child) => (
                            <View key={child.id} style={styles.childCard}>
                                <ProfileAvatar
                                    size={60}
                                    editable={false}
                                    isChild={true}
                                    childId={child.id}
                                />
                                <Text style={styles.childName}>{child.full_name}</Text>
                                <Text style={styles.childAge}>
                                    {calculateAgeAtDate(child.birthdate, params.date)}
                                </Text>
                            </View>
                        ))}
                    </View>
                ) : null}

                {/* Description */}
                {params.description ? (
                    <Text style={styles.description}>{params.description}</Text>
                ) : null}

                {/* Images stacked full-width */}
                {authenticatedImages.map((img) => (
                    <AuthenticatedImage
                        key={img.file_md5}
                        uri={img.uri}
                        headers={authHeaders}
                        style={[styles.postImage, {width: imageWidth}]}
                        contentFit="contain"
                    />
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: Colors.neutral.offWhite,
    },
    backButton: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        alignSelf: 'flex-start',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    dateText: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.secondary,
        marginBottom: 16,
    },
    childrenRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 20,
    },
    childCard: {
        alignItems: 'center',
        gap: 4,
    },
    childName: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.neutral.darkGray,
        marginTop: 4,
    },
    childAge: {
        fontSize: 12,
        color: Colors.neutral.lightGray,
    },
    description: {
        fontSize: 16,
        color: Colors.neutral.darkGray,
        lineHeight: 24,
        marginBottom: 20,
    },
    postImage: {
        borderRadius: 8,
        marginBottom: 12,
        aspectRatio: 1,
        minHeight: 250,
    },
});
