import { Platform } from 'react-native';

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

export async function uploadPostBinary(params: {
  apiBaseUrl: string;
  token: string;
  imageUri: string; // from ImagePicker result.assets[0].uri
  text?: string;
}) {
  const { apiBaseUrl, token, imageUri, text } = params;

  // Derive a filename; ensure it has an extension for MIME guessing
  let fileName = decodeURIComponent(imageUri.split('/').pop() || 'upload.jpg');
  if (!fileName.includes('.')) fileName += '.jpg';
  const fallbackType = guessContentType(fileName);

  const form = new FormData();

  if (Platform.OS === 'web') {
    // On web, turn the URI into a Blob (actual binary) and append it.
    const resp = await fetch(imageUri);
    if (!resp.ok) {
      throw new Error(`Failed to read image (${resp.status})`);
    }
    const blob = await resp.blob();
    // Use the blob’s type if provided, else our fallback
    const type = blob.type || fallbackType;

    // Prefer a File for better filename handling in browsers
    const file = new File([blob], fileName, { type });
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

  if (text) form.append('text', text);

  const res = await fetch(`${apiBaseUrl}/post`, {
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