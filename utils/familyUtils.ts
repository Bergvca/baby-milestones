import {FAMILY_PATH} from "@/app/constants/api";

export interface CreateFamilyRequest {
    name: string;
    description: string;
}

export interface CreateFamilyResponse {
    id: number;
    name: string;
    description: string;
    created_at: string;
}

export async function createOrUpdateFamily(familyName: string, description: string, isEditMode: boolean, familyID: number | null, token: string | null) {
    const familyData: CreateFamilyRequest = {
        name: familyName.trim(),
        description: description.trim(),
    };
    if (isEditMode) {
        return await fetch(`${FAMILY_PATH}/${familyID}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(familyData),
        });
    } else {
        return await fetch(FAMILY_PATH, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(familyData),
        });
    }
}