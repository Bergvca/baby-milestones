const base = process.env.EXPO_PUBLIC_API_BASE_URL;
if (!base) throw new Error('EXPO_PUBLIC_API_BASE_URL is not set');

export const API_BASE_URL = base;
export const POSTS_PATH = `${API_BASE_URL}/post`;
export const USER_PATH = `${API_BASE_URL}/user`;
export const USER_AVATAR_PATH = `${API_BASE_URL}/user/avatar`;
export const IMAGE_PATH = `${API_BASE_URL}/media/image`;
export const FAMILY_PATH = `${API_BASE_URL}/family`;
export const CHILD_PATH = `${API_BASE_URL}/child`;
export const CHILD_AVATAR_PATH = `${CHILD_PATH}/avatar`;
export const CHILD_ALL = `${CHILD_PATH}/all`;
