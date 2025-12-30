
import {fetchJsonWithAuth} from "@/utils/utils";
import {CHILD_PATH, CHILD_ALL} from "@/app/constants/api";

export interface CreateChildRequest {
    full_name: string;
    gender: string;
    birthdate: Date;
    birth_length: number;
    birth_weight: number;
    family_id: number | null;
}

export async function fetchFullChildData(token: string, childID: number, signal?: AbortSignal): Promise<FamilyChild | null> {
    try {
        const data = await fetchJsonWithAuth<unknown>(`${CHILD_PATH}/${childID}`, token, signal);
        return isFullChildData(data) ? data : null;
    } catch (error) {
        console.error('Failed to fetch full child data:', error);
        return null;
    }
}

export async function fetchAllChildren(token: string, signal?: AbortSignal): Promise<FamilyChild[]> {
    try {
        const data = await fetchJsonWithAuth<unknown>(CHILD_ALL, token, signal);
        return isChildArray(data) ? data : [];
    } catch (error) {
        console.error('Failed to fetch all children:', error);
        return [];
    }
}

type MediaFile = {
    file_md5: string;
};

export type FamilyChild = {
    id: number;
    full_name: string;
    birthdate: string;
    gender: string;
    birth_length: number;
    birth_weight: number;
    media_file: MediaFile;
}

function isFullChildData(data: unknown): data is FamilyChild {
    return typeof data === 'object' && data !== null && 'id' in data;
}

function isChildArray(data: unknown): data is FamilyChild[] {
    return Array.isArray(data);
}