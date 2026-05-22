import { api, ApiError } from '@/utils/apiClient';
import { CHILD_ALL, CHILD_PATH } from '@/app/constants/api';
import type { Child } from '@/types/api';

export type { Child } from '@/types/api';
// Back-compat alias for existing call sites.
export type FamilyChild = Child;

export interface CreateChildRequest {
    full_name: string;
    gender: string;
    birthdate: Date;
    birth_length: number;
    birth_weight: number;
    family_id: number | null;
}

export async function fetchFullChildData(
    _token: string,
    childID: number,
    signal?: AbortSignal,
): Promise<Child | null> {
    try {
        const data = await api.get<unknown>(`${CHILD_PATH}/${childID}`, { signal });
        return isFullChildData(data) ? data : null;
    } catch (error) {
        if (error instanceof ApiError && error.status === 404) return null;
        console.error('Failed to fetch full child data:', error);
        return null;
    }
}

export async function fetchAllChildren(
    _token: string,
    signal?: AbortSignal,
): Promise<Child[]> {
    try {
        const data = await api.get<unknown>(CHILD_ALL, { signal });
        return isChildArray(data) ? data : [];
    } catch (error) {
        console.error('Failed to fetch all children:', error);
        return [];
    }
}

function isFullChildData(data: unknown): data is Child {
    return typeof data === 'object' && data !== null && 'id' in data;
}

function isChildArray(data: unknown): data is Child[] {
    return Array.isArray(data);
}
