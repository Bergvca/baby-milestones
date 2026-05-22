import React, {useEffect, useRef, useState} from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import {router, useLocalSearchParams} from 'expo-router';
import {useAuth} from '@/app/context/AuthContext';
import {Colors} from '@/components/colors';
import {CHILD_PATH} from '@/app/constants/api';
import CustomAlert from "@/components/CustomAlert";
import {screenStyles} from '@/components/screenStyles';
import {DatePicker} from "@/components/DatePicker";
import type {ProfileAvatarRef} from '@/components/ProfileAvatar';
import ProfileAvatar from "@/components/ProfileAvatar";
import {CreateChildRequest, fetchFullChildData} from "@/utils/childUtils";
import {api} from "@/utils/apiClient";
import DateTimePicker from "@react-native-community/datetimepicker";


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
    const [dataLoading, setDataLoading] = useState(false);
    const avatarRef = useRef<ProfileAvatarRef>(null);
    const {user, getToken} = useAuth();


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


    const onDateChange = (event: any, date?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (date) {
            setBirthdate(date);
        }
    };

    useEffect(() => {
        if (!user) {
            setToken(null);
            return;
        }
        getToken().then(setToken).catch(() => setToken(null));
    }, [user, getToken]);

    useEffect(() => {
        if (params.editMode === 'true') {
            setIsEditMode(true);
            const childIdParam = params.childId ? parseInt(params.childId as string, 10) : null;
            if (childIdParam) {
                setChildID(childIdParam);
            }
        }
    }, [params.editMode, params.childId]);

    useEffect(() => {
        const loadChildData = async () => {
            if (isEditMode && childID && token) {
                setDataLoading(true);
                try {
                    const childData = await fetchFullChildData(token, childID);
                    if (childData) {
                        setChildName(childData.full_name);
                        setBirthdate(new Date(childData.birthdate));
                        setGender(childData.gender);
                        setBirth_length(childData.birth_length);
                        setBirth_weight(childData.birth_weight);
                        console.log('Loaded child data:', childData);
                    }
                } catch (error) {
                    console.error('Error loading child data:', error);
                    Alert.alert('Error', 'Failed to load child data');
                } finally {
                    setDataLoading(false);
                }
            }
        };

        loadChildData();
    }, [isEditMode, childID, token]);


    const handleCreateOrUpdateChild = async () => {
        // Validation
        if (!childName.trim()) {
            Alert.alert('Error', 'Please enter a family name');
            return;
        }

        setLoading(true);

        try {
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
            const newChildData = isEditMode
                ? await api.put<{ id: number }>(`${CHILD_PATH}/${childID}`, childData)
                : await api.post<{ id: number }>(CHILD_PATH, childData);
            const newChildId = newChildData.id;
            console.log('newChildId', newChildId);
            // 2. Upload avatar if one was selected
            if (avatarRef.current?.getAvatarUri()) {
                const avatarUploaded = await avatarRef.current.uploadAvatarForChild(newChildId);
                if (!avatarUploaded) {
                    console.warn('Avatar upload failed, but child was created');
                }
            }

            router.push({
                pathname: '/add-family',
                params: {
                    id: familyId,
                }
            });


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
                'Delete Child?',
                'Are you sure you want to delete this child? This action cannot be undone.',
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
            if (!user) {
                Alert.alert('Error', 'You must be logged in to create a family');
                return;
            }
            await api.del<void>(`${CHILD_PATH}/${childID}`);

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

                    {/* Only show DateTimePicker on mobile platforms */}
                    {showDatePicker && Platform.OS !== 'web' && (
                        <DateTimePicker
                            value={birthdate}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={onDateChange}
                        />
                    )}

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

                {isEditMode && (
                    <TouchableOpacity
                        style={screenStyles.dangerButton}
                        onPress={handleDelete}
                        disabled={loading}
                    >
                        <Text style={screenStyles.dangerButtonText}>Delete Child</Text>
                    </TouchableOpacity>
                )}

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