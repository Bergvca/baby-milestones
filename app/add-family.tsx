import React, {useCallback, useEffect, useState} from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import {router, useFocusEffect, useLocalSearchParams} from 'expo-router';
import {getAuth, onAuthStateChanged} from 'firebase/auth';
import { Colors } from '@/components/colors';
import {FAMILY_PATH, POSTS_PATH} from '@/app/constants/api';
import CustomAlert from "@/components/CustomAlert";
import {fetchJsonWithAuth} from "@/utils/utils";
import Children from "@/components/Children";
import { screenStyles } from '@/components/screenStyles';


interface CreateFamilyRequest {
    name: string;
    description: string;
}

interface CreateFamilyResponse {
    id: number;
    name: string;
    description: string;
    created_at: string;
}

type MediaFile = {
    file_md5: string;
};

type FamilyChild = {
    id: number;
    nickname: string;
    birthdate: string;
    gender: string;
    birth_length: number;
    birth_weight: number;
    media_file: MediaFile;
}

function isChildArray(data: unknown): data is FamilyChild[] {
    return Array.isArray(data);
}


async function fetchChilds(token: string, familyID: string, signal?: AbortSignal): Promise<FamilyChild[]> {
    const data = await fetchJsonWithAuth<unknown>(`${FAMILY_PATH}/${familyID}`, token, signal);
    return isChildArray(data) ? data : [];
}


export default function AddFamily() {
    const [token, setToken] = useState<string | null>(null);
    const [familyName, setFamilyName] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [familyID, setFamilyID] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [showCancelAlert, setShowCancelAlert] = useState(false);
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);


    // Get params from navigation
    const params = useLocalSearchParams();

    useFocusEffect(
        useCallback(() => {
            // Trigger a refresh of the Children component by updating the key
            setRefreshKey(prev => prev + 1);
        }, [])
    );



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


    const handleCreateOrUpdateFamily = async () => {
        // Validation
        if (!familyName.trim()) {
            Alert.alert('Error', 'Please enter a family name');
            return;
        }

        if (!description.trim()) {
            Alert.alert('Error', 'Please enter a family description');
            return;
        }

        setLoading(true);

        try {
            const auth = getAuth();
            const user = auth.currentUser;

            if (!user) {
                Alert.alert('Error', 'You must be logged in to create a family');
                return;
            }

            const familyData: CreateFamilyRequest = {
                name: familyName.trim(),
                description: description.trim(),
            };
            let response: Response;
            if (isEditMode) {
                response = await fetch(`${FAMILY_PATH}/${familyID}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify(familyData),
                });
            } else {
                response = await fetch(FAMILY_PATH, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify(familyData),
                });
            }
            if (!response.ok) {
                const errorText = await response.text().catch(() => '');
                throw new Error(`Failed to create family (${response.status}): ${errorText || response.statusText}`);
            }

            const createdFamily: CreateFamilyResponse = await response.json();

            router.push('/(tabs)/profile');

        } catch (error) {
            console.error('Error creating family:', error);
            Alert.alert(
                'Error',
                error instanceof Error ? error.message : 'Failed to create family. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        if (familyName.trim() || description.trim()) {
            if (Platform.OS === 'web') {
                setShowCancelAlert(true);
            } else {
                Alert.alert(
                    'Discard Changes?',
                    'You have unsaved changes. Are you sure you want to go back?',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Discard',
                            style: 'destructive',
                            onPress: () => router.push('/(tabs)/profile'),
                        },
                    ]
                );
            }
        } else {
            router.push('/(tabs)/profile');
        }
    };



    useEffect(() => {
        const editMode = params.editMode;
        const familyId = params.id;

        if (editMode === 'true' && familyId && token) {
            setFamilyName(params.name as string);
            setDescription(params.description as string);
            setFamilyID(familyId as unknown as number);
            setIsEditMode(true);

    }}, [params.editMode, params.id, params.name, params.description, token]);

    function handleDelete() {
        if (Platform.OS === 'web') {
            setShowDeleteAlert(true);
        } else {
            Alert.alert(
                'Delete Family?',
                'Are you sure you want to delete this family? This action cannot be undone.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: () => deleteFamily,
                    }
                ]
            )
        }
    }
    // const handleCreateOrUpdateFamily = async () => {
   const deleteFamily = async () => {
        setLoading(true);

        try {
            const auth = getAuth();
            const user = auth.currentUser;

            if (!user) {
                Alert.alert('Error', 'You must be logged in to create a family');
                return;
            }
            const response = await fetch(`${FAMILY_PATH}/${familyID}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                }
            });

            if (!response.ok) {
                const errorText = await response.text().catch(() => '');
                throw new Error(`Failed to delete family (${response.status}): ${errorText || response.statusText}`);
            }


            router.push('/(tabs)/profile');

        } catch (error) {
            console.error('Error creating family:', error);
            Alert.alert(
                'Error',
                error instanceof Error ? error.message : 'Failed to create family. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <KeyboardAvoidingView
            style={screenStyles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <CustomAlert
                visible={showCancelAlert}
                title="Discard Changes?"
                message="You have unsaved changes. Are you sure you want to go back?"
                buttons={[
                    {
                        text: 'Cancel',
                        style: 'cancel',
                        onPress: () => setShowCancelAlert(false),
                    },
                    {
                        text: 'Discard',
                        style: 'destructive',
                        onPress: () => {
                            setShowCancelAlert(false);
                            router.push('/(tabs)/profile');
                        },
                    },
                ]}
                onRequestClose={() => setShowCancelAlert(false)}
            />

            <CustomAlert
                visible={showDeleteAlert}
                title="Delete Family?"
                message="Are you sure you want to delete this family? This action cannot be undone."
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
                            deleteFamily();
                        },
                    },
                ]}
                onRequestClose={() => setShowDeleteAlert(false)}
            />

            <ScrollView style={screenStyles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={screenStyles.header}>
                    <Text style={screenStyles.title}>
                        {isEditMode ? `Update Family` : 'Create New Family'}
                    </Text>
                    <Text style={screenStyles.subtitle}>
                        {isEditMode ? 'Update' : 'Create'} a family to organize and share milestones with your loved ones
                    </Text>
                </View>

                <View style={screenStyles.form}>
                    <View style={screenStyles.inputContainer}>
                        <Text style={screenStyles.label}>Family Name *</Text>
                        <TextInput
                            style={screenStyles.input}
                            placeholder="Enter family name"
                            placeholderTextColor={Colors.neutral.lightGray}
                            value={familyName}
                            onChangeText={setFamilyName}
                            maxLength={50}
                            autoCapitalize="words"
                        />
                        <Text style={screenStyles.helperTextRight}>
                            {familyName.length}/50
                        </Text>
                    </View>

                    <View style={screenStyles.inputContainer}>
                        <Text style={screenStyles.label}>Description *</Text>
                        <TextInput
                            style={[screenStyles.input, screenStyles.textArea]}
                            placeholder="Tell us about your family..."
                            placeholderTextColor={Colors.neutral.lightGray}
                            value={description}
                            onChangeText={setDescription}
                            maxLength={200}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                        <Text style={screenStyles.helperTextRight}>
                            {description.length}/200
                        </Text>
                    </View>
                </View>
                <Children  key={refreshKey}
                           familyId={familyID} token={token} />
            </ScrollView>

            <View style={screenStyles.buttonRow}>
                <TouchableOpacity
                    style={screenStyles.secondaryButton}
                    onPress={handleCancel}
                    disabled={loading}
                >
                    <Text style={screenStyles.secondaryButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={screenStyles.dangerButton}
                    onPress={handleDelete}
                    disabled={loading}
                >
                    <Text style={screenStyles.dangerButtonText}>Delete Family</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        screenStyles.primaryButton,
                        loading && screenStyles.disabledButton,
                    ]}
                    onPress={handleCreateOrUpdateFamily}
                    disabled={loading || !familyName.trim() || !description.trim()}
                >
                    <Text
                        style={[
                            screenStyles.primaryButtonText,
                            loading && screenStyles.disabledButtonText,
                        ]}
                    >
                        {loading ? 'Creating...' : isEditMode ? 'Update Family' : 'Create Family'}
                    </Text>
                </TouchableOpacity>
            </View>


        </KeyboardAvoidingView>
    );
}

