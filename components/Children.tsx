import {fetchJsonWithAuth} from "@/utils/utils";
import {CreateFamilyRequest, CreateFamilyResponse, createOrUpdateFamily} from "@/utils/familyUtils";
import {FAMILY_PATH} from "@/app/constants/api";
import React, {PropsWithChildren, useCallback, useEffect, useState} from "react";
import {getAuth, onAuthStateChanged} from "firebase/auth";
import {ActivityIndicator, Alert, Button, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import {Colors} from "@/components/colors";
import {screenStyles} from "@/components/screenStyles";
import {router} from "expo-router";
import {MaterialCommunityIcons} from "@expo/vector-icons";
import ProfileAvatar from "@/components/ProfileAvatar";

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

function isChildArray(data: unknown): data is FamilyChild[] {
    return Array.isArray(data);
}


async function fetchChilds(token: string, familyID: number | null, signal?: AbortSignal): Promise<FamilyChild[]> {
    const data = await fetchJsonWithAuth<unknown>(`${FAMILY_PATH}/${familyID}/children`, token, signal);
    return isChildArray(data) ? data : [];
}

type Props = PropsWithChildren<{
    familyId: number | null;
    token: string | null;
    familyName: string | null;
    familyDescription: string | null;
}>;


export default function Children({ familyId, token, familyName, familyDescription }: Props) {
    const [children, setChildren] = useState<FamilyChild[]>([]);
    const [authLoading, setAuthLoading] = useState(true);
    const [childrenLoading, setChildrenLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [loading, setLoading] = useState(false);
    const [familyID, setFamilyID] = useState<number | null>(null);

    const handleAddChild = async () => {
        // First, ensure the family name is set
        if (familyName !== null && !familyName.trim()) {
            Alert.alert('Error', 'Please enter a family name before adding a child');
            return;
        }

        // If family is not saved yet (no familyID), save it first
        if (familyId === null) {
            setLoading(true);
            try {
                const auth = getAuth();
                const user = auth.currentUser;

                if (!user) {
                    Alert.alert('Error', 'You must be logged in to create a family');
                    return;
                }
                if (familyName === null) {
                    // should not happen see above
                    familyName = '';
                }
                if (familyDescription === null) {
                    familyDescription = '';
                }

                let response = await createOrUpdateFamily(familyName, familyDescription, false, null, token);

                if (!response.ok) {
                    const errorText = await response.text().catch(() => '');
                    throw new Error(`Failed to create family (${response.status}): ${errorText || response.statusText}`);
                }

                const createdFamily: CreateFamilyResponse = await response.json();
                setFamilyID(createdFamily.id);

                // Navigate to add-child with the newly created family ID
                router.push({
                    pathname: '/add-child',
                    params: {
                        familyId: createdFamily.id,
                    }
                });
            } catch (error) {
                console.error('Error creating family:', error);
                Alert.alert(
                    'Error',
                    error instanceof Error ? error.message : 'Failed to create family. Please try again.'
                );
            } finally {
                setLoading(false);
            }
        } else {
            // Family already exists, navigate to add-child
            router.push({
                pathname: '/add-child',
                params: {
                    familyId: familyID,
                }
            });
        }
    };


    const handleSelectChild = (childId: number) => {
        router.push({
            pathname: '/add-child',
            params: {
                childId: childId,
                familyId: familyId,
                editMode: 'true'
            }
        });
    };



    const refreshChildren = useCallback(async () => {
        if (!token || familyId == null) return; // guard against null / undefined

        const controller = new AbortController();
        setChildrenLoading(true);
        setError(null);

        try {
            const newPosts = await fetchChilds(token, familyId, controller.signal);
            console.log('Fetched children:', newPosts);

            setChildren(newPosts);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Failed to fetch posts.');
            setChildren([]);
        } finally {
            setChildrenLoading(false);
        }
    }, [token, familyId]); // include familyId here


    // Fetch posts when we have a token or when refreshKey changes
    useEffect(() => {
        if (!token) return;
        refreshChildren();
        if (familyId !== null) {
            setFamilyID(familyId);
        }

    }, [token, familyId, refreshKey, refreshChildren]);

    return (
        <View style={screenStyles.menuSection}>
            <Text style={screenStyles.sectionHeader}>Children</Text>
            {childrenLoading ? (
                <View style={screenStyles.center}>
                    <ActivityIndicator color={Colors.primary || '#fff'} size="large" animating={true}
                                       style={{marginBottom: 16}}/>
                    <Text style={screenStyles.text}>Loading posts…</Text>
                </View>
            ) : error ? (
                <Text style={screenStyles.errorText}>Error: {error}</Text>
            ) : children.length === 0 ? (
                <Text style={screenStyles.text}>No children added yet</Text>
            ) : (
                <View>
                    {children.map((child) => (
                        <TouchableOpacity
                            key={child.id}
                            style={screenStyles.menuItem}
                            onPress={() => handleSelectChild(child.id)}
                        >
                            <ProfileAvatar
                                size={40}
                                editable={false}
                                isChild={true}
                                childId={child.id}
                            />
                            <Text style={screenStyles.menuText}>{child.full_name}</Text>
                            <MaterialCommunityIcons name="chevron-right" style={screenStyles.arrowIcon} />
                        </TouchableOpacity>
                    ))}
                </View>

            )
            }
            <TouchableOpacity
                style={screenStyles.menuItem}
                onPress={handleAddChild}
                disabled={loading || !familyName}

            >
                <MaterialCommunityIcons name="human-child" style={screenStyles.primaryIcon} />
                <Text style={screenStyles.menuText}
                    disabled={loading || !familyName}>Add child
                </Text>
                <MaterialCommunityIcons name="plus" style={screenStyles.arrowIcon} />
            </TouchableOpacity>

        </View>
    );

}

