import { Platform } from 'react-native';
import { POSTS_PATH } from "@/app/constants/api";

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
    const file = new File([blob], fileName, {type});
    form.append('image', file);
  } else {
    // On native, RN will read the file bytes specified by the uri
    form.append(
        'image',
        {
          uri: imageUri,
          name: fileName,
          type: fallbackType,
        } as unknown as Blob
    );
  }
  return form;
}

async function buildPostForm(imageUri: string | null | undefined, text: string | undefined, date: Date, id?: string | undefined) {
  let form = new FormData();

  if (imageUri) {
    form = await add_image_to_form(imageUri, form);
  }

  // Always append text, even if empty string (API might require this field)
  form.append('text', text || '');

  if (id) form.append('post_id', id);

  form.append('date', date.toISOString());
  return form;
}


export async function uploadPostBinary(params: {
  token: string;
  imageUri: string; // from ImagePicker result.assets[0].uri
  date: Date;
  text?: string;
}) {
  const { token, imageUri, date, text } = params;
  const form = await buildPostForm(imageUri, text, date);

  const res = await fetch(`${POSTS_PATH}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      // Do not set Content-Type; the browser/Polyfill will set multipart boundary
    },
    body: form,
  });

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(err || `Upload failed (${res.status})`);
  }

  // If your API returns JSON:
  // return await res.json();
  return true;
}


export async function updatePostById(editingPostId: string | null, token: string | null, text: string, selectedDate: Date, imageUri: string | null) {

    if (!editingPostId || !token) return;

    const form = await buildPostForm(imageUri, text, selectedDate, editingPostId);

    const response = await fetch(`${POSTS_PATH}/${editingPostId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Update failed (${response.status}): ${text || response.statusText}`);
    }

  return true;
}
