import { Platform } from 'react-native';
import { POSTS_PATH } from '@/app/constants/api';
import { api } from '@/utils/apiClient';

function guessContentType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'heic':
      return 'image/heic';
    default:
      return 'application/octet-stream';
  }
}

export async function add_image_to_form(imageUri: string, form: FormData) {
  // Derive a filename; ensure it has an extension for MIME guessing
  let fileName = decodeURIComponent(imageUri.split('/').pop() || 'upload.jpg');
  if (!fileName.includes('.')) fileName += '.jpg';
  const fallbackType = guessContentType(fileName);

  if (Platform.OS === 'web') {
    // On web, turn the URI into a Blob (actual binary) and append it.
    const resp = await fetch(imageUri);
    if (!resp.ok) {
      throw new Error(`Failed to read image (${resp.status})`);
    }
    const blob = await resp.blob();
    // Use the blob's type if provided, else our fallback
    const type = blob.type || fallbackType;

    // Prefer a File for better filename handling in browsers
    const file = new File([blob], fileName, { type });
    form.append('image', file);
  } else {
    // On native, RN will read the file bytes specified by the uri
    form.append('image', {
      uri: imageUri,
      name: fileName,
      type: fallbackType,
    } as unknown as Blob);
  }
  return form;
}

async function buildPostForm(
  imageUris: string[] | null | undefined,
  text: string | undefined,
  date: Date,
  selectedChildrenIds?: number[],
  id?: string | undefined,
) {
  let form = new FormData();

  if (imageUris && imageUris.length > 0) {
    for (const imageUri of imageUris) {
      form = await add_image_to_form(imageUri, form);
    }
  }

  // Always append text, even if empty string (API might require this field)
  form.append('text', text || '');

  if (id) form.append('post_id', id);

  form.append('date', date.toISOString());

  if (selectedChildrenIds) {
    form.append('selected_children_ids', JSON.stringify(selectedChildrenIds));
  }

  return form;
}

export async function uploadPostBinary(params: {
  imageUris: string[];
  text: string;
  date: Date;
  selectedChildrenIds: number[];
}) {
  const { imageUris, date, text, selectedChildrenIds } = params;
  const form = await buildPostForm(imageUris, text, date, selectedChildrenIds);
  await api.upload<unknown>(POSTS_PATH, form);
  return true;
}

export async function updatePostById(
  editingPostId: string | null,
  text: string,
  selectedDate: Date,
  imageUris: string[] | null,
  childrenIds: number[] | undefined,
) {
  if (!editingPostId) return;

  const form = await buildPostForm(imageUris, text, selectedDate, childrenIds, editingPostId);
  await api.put<unknown>(`${POSTS_PATH}/${editingPostId}`, form);
  return true;
}
