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
import {router, useLocalSearchParams} from 'expo-router';
import {getAuth, onAuthStateChanged} from 'firebase/auth';
import { Colors } from '@/components/colors';
import {CHILD_PATH, FAMILY_PATH, POSTS_PATH} from '@/app/constants/api';
import CustomAlert from "@/components/CustomAlert";
import {fetchJsonWithAuth} from "@/components/utils";
import Children from "@/components/Children";
import { screenStyles } from '@/components/screenStyles';
import {DatePicker} from "@/components/DatePicker";
import ProfileAvatar from "@/components/ProfileAvatar";
import { useRef } from 'react';
import type { ProfileAvatarRef } from '@/components/ProfileAvatar';



interface CreateChildRequest {
    full_name: string;
    gender: string;
    birthdate: Date;
    birth_length: number;
    birth_weight: number;
    family_id: number | null;
}


type MediaFile = {
    file_md5: string;
};

type FamilyChild = {
    id: number;
    full_name: string;
    birthdate: string;
    gender: string;
    birth_length: number;
    birth_weight: number;
    media_file: MediaFile;
}


export default function AddChild() {
    const [token, setToken] = useState<string | null>(null);
    const [childName, setChildName] = useState<string>('');
    const [birthdate, setBirthdate] = useState(new Date());
    const [gender, setGender] = useState<string>('');
    const [birth_length, setBirth_length] = useState<number>(0);
    const [birth_weight, setBirth_weight] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [showCancelAlert, setShowCancelAlert] = useState(false);
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
    const [childID, setChildID] = useState<number | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const avatarRef = useRef<ProfileAvatarRef>(null);


    // Get params from navigation
    const params = useLocalSearchParams();
    const familyId = params.familyId ? parseInt(params.familyId as string, 10) : null;


    const formatDate = (date: Date) => {
        return date.toLocaleDateString('nl-NL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const handleWebDateChange = (date: Date) => {
        setBirthdate(date);
    };


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


    const handleCreateOrUpdateChild = async () => {
        // Validation
        if (!childName.trim()) {
            Alert.alert('Error', 'Please enter a family name');
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

            const childData: CreateChildRequest = {
                full_name: childName.trim(),
                birthdate: birthdate,
                birth_length: birth_length,
                birth_weight: birth_weight,
                gender: gender.trim(),
                family_id: familyId
            };
            let response: Response;
            if (isEditMode) {
                response = await fetch(`${CHILD_PATH}/${childID}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify(childData),
                });
            } else {
                response = await fetch(CHILD_PATH, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify(childData),
                });
            }
            if (!response.ok) {
                const errorText = await response.text().catch(() => '');
                throw new Error(`Failed to create child (${response.status}): ${errorText || response.statusText}`);
            }

            const newChildData = await response.json();
            const newChildId = newChildData.id;
            console.log('newChildId', newChildId);
            // 2. Upload avatar if one was selected
            if (avatarRef.current?.getAvatarUri()) {
                const avatarUploaded = await avatarRef.current.uploadAvatarForChild(newChildId);
                if (!avatarUploaded) {
                    console.warn('Avatar upload failed, but child was created');
                }
            }

            router.back();

        } catch (error) {
            console.error('Error creating child:', error);
            Alert.alert(
                'Error',
                error instanceof Error ? error.message : 'Failed to create child. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        if (childName.trim()) {
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
                            onPress: () =>  router.back(),
                        },
                    ]
                );
            }
        } else {
            router.back();
        }
    };

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
                        onPress: () => deleteChild,
                    }
                ]
            )
        }
    }
    // const handleCreateOrUpdateFamily = async () => {
    const deleteChild = async () => {
        setLoading(true);

        try {
            const auth = getAuth();
            const user = auth.currentUser;

            if (!user) {
                Alert.alert('Error', 'You must be logged in to create a family');
                return;
            }
            const response = await fetch(`${CHILD_PATH}/${childID}`, {
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


            router.back();

        } catch (error) {
            console.error('Error creating child:', error);
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
                            router.back();
                        },
                    },
                ]}
                onRequestClose={() => setShowCancelAlert(false)}
            />

            <CustomAlert
                visible={showDeleteAlert}
                title="Delete Child?"
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
                            deleteChild();
                        },
                    },
                ]}
                onRequestClose={() => setShowDeleteAlert(false)}
            />

            <ScrollView style={screenStyles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={screenStyles.header}>
                    <Text style={screenStyles.title}>
                        {isEditMode ? `Update Child` : 'Create New Child'}
                    </Text>
                    <Text style={screenStyles.subtitle}>
                        {isEditMode ? 'Update' : 'Create'} a child to keep track of their progress and growth.
                    </Text>
                </View>

                <View style={screenStyles.profileSection}>
                    <View style={screenStyles.avatarWrapper}>
                        <ProfileAvatar
                            ref={avatarRef}
                            size={130}
                            editable={true}
                            isChild={true}
                            childId={childID}
                        />
                    </View>
                </View>

                <View style={screenStyles.form}>
                    <View style={screenStyles.inputContainer}>
                        <Text style={screenStyles.label}>Name *</Text>
                        <TextInput
                            style={screenStyles.input}
                            placeholder="Enter child name"
                            placeholderTextColor={Colors.neutral.lightGray}
                            value={childName}
                            onChangeText={setChildName}
                            maxLength={50}
                            autoCapitalize="words"
                        />
                        <Text style={screenStyles.helperTextRight}>
                            {childName.length}/50
                        </Text>
                    </View>

                    <View style={screenStyles.inputContainer}>
                        <Text style={screenStyles.label}>Birthdate *</Text>
                        <DatePicker
                            onPress={() => setShowDatePicker(true)}
                            disabled={loading}
                            s={formatDate(birthdate)}
                            onDateChange={setBirthdate}
                            selectedDate={birthdate}
                        />
                    </View>
                    {/*gender input*/}
                    <View style={screenStyles.inputContainer}>
                    <Text style={screenStyles.label}>Gender *</Text>
                    <View style={screenStyles.radioButtonContainer}>
                        <TouchableOpacity
                            style={screenStyles.radioButton}
                            onPress={() => setGender('Boy')}
                        >
                            <View style={[
                                screenStyles.radioCircle,
                                gender === 'Boy' && screenStyles.radioCircleSelected
                            ]}>
                                {gender === 'Boy' && <View style={screenStyles.radioCircleInner} />}
                            </View>
                            <Text style={screenStyles.radioLabel}>Boy</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={screenStyles.radioButton}
                            onPress={() => setGender('Girl')}
                        >
                            <View style={[
                                screenStyles.radioCircle,
                                gender === 'Girl' && screenStyles.radioCircleSelected
                            ]}>
                                {gender === 'Girl' && <View style={screenStyles.radioCircleInner} />}
                            </View>
                            <Text style={screenStyles.radioLabel}>Girl</Text>
                        </TouchableOpacity>
                    </View>
                    </View>
                    {/*weight input*/}
                    <View style={screenStyles.inputContainer}>
                        <Text style={screenStyles.label}>Birth Weight (grams) *</Text>
                        <TextInput
                            style={screenStyles.input}
                            placeholder="Enter birth weight in grams"
                            placeholderTextColor={Colors.neutral.lightGray}
                            value={birth_weight > 0 ? birth_weight.toString() : ''}
                            onChangeText={(text) => {
                                // Only allow numbers
                                const numericValue = text.replace(/[^0-9]/g, '');
                                setBirth_weight(numericValue ? parseInt(numericValue, 10) : 0);
                            }}
                            keyboardType="number-pad"
                            maxLength={5}
                        />
                    </View>
                    {/*height input*/}
                    <View style={screenStyles.inputContainer}>
                        <Text style={screenStyles.label}>Birth length (cm) *</Text>
                        <TextInput
                            style={screenStyles.input}
                            placeholder="Enter birth length in cm"
                            placeholderTextColor={Colors.neutral.lightGray}
                            value={birth_length > 0 ? birth_length.toString() : ''}
                            onChangeText={(text) => {
                                // Only allow numbers
                                const numericValue = text.replace(/[^0-9]/g, '');
                                setBirth_length(numericValue ? parseInt(numericValue, 10) : 0);
                            }}
                            keyboardType="number-pad"
                            maxLength={5}
                        />
                    </View>

                </View>
            </ScrollView>
            {/* bottom button row*/}
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
                    <Text style={screenStyles.dangerButtonText}>Delete Child</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        screenStyles.primaryButton,
                        loading && screenStyles.disabledButton,
                    ]}
                    onPress={handleCreateOrUpdateChild}
                    disabled={loading || !childName.trim()}
                >
                    <Text
                        style={[
                            screenStyles.primaryButtonText,
                            loading && screenStyles.disabledButtonText,
                        ]}
                    >
                        {loading ? 'Creating...' : isEditMode ? 'Update Child' : 'Create Child'}
                    </Text>
                </TouchableOpacity>
            </View>


        </KeyboardAvoidingView>
    );
}

