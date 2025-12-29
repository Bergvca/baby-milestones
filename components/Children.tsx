import {fetchJsonWithAuth} from "@/components/utils";
import {FAMILY_PATH} from "@/app/constants/api";
import React, {PropsWithChildren, useCallback, useEffect, useState} from "react";
import {getAuth, onAuthStateChanged} from "firebase/auth";
import {ActivityIndicator, Button, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import {Colors} from "@/components/colors";
import {screenStyles} from "@/components/screenStyles";
import {router} from "expo-router";
import {MaterialCommunityIcons} from "@expo/vector-icons";

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


async function fetchChilds(token: string, familyID: number | null, signal?: AbortSignal): Promise<FamilyChild[]> {
    const data = await fetchJsonWithAuth<unknown>(`${FAMILY_PATH}/${familyID}/children`, token, signal);
    return isChildArray(data) ? data : [];
}

type Props = PropsWithChildren<{
    familyId: number | null;
    token: string | null;
}>;


export default function Children({ familyId, token }: Props) {
    const [children, setChildren] = useState<FamilyChild[]>([]);
    const [authLoading, setAuthLoading] = useState(true);
    const [childrenLoading, setChildrenLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleAddChild = () => {
        router.push({
            pathname: '/add-child',
            params: {
                familyId: familyId,
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
                <Text>{children.length}</Text>
            )
            }
            <TouchableOpacity
                style={screenStyles.menuItem}
                onPress={handleAddChild}
            >
                <MaterialCommunityIcons name="human-child" style={screenStyles.primaryIcon} />
                <Text style={screenStyles.menuText}>Add Child</Text>
                <MaterialCommunityIcons name="plus" style={screenStyles.arrowIcon} />
            </TouchableOpacity>

        </View>
    );

}

