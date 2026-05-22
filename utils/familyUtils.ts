import { FAMILY_PATH } from '@/app/constants/api';
import { api } from '@/utils/apiClient';

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

export async function createOrUpdateFamily(
    familyName: string,
    description: string,
    isEditMode: boolean,
    familyID: number | null,
): Promise<CreateFamilyResponse> {
    const familyData: CreateFamilyRequest = {
        name: familyName.trim(),
        description: description.trim(),
    };
    if (isEditMode) {
        return api.put<CreateFamilyResponse>(`${FAMILY_PATH}/${familyID}`, familyData);
    }
    return api.post<CreateFamilyResponse>(FAMILY_PATH, familyData);
}
