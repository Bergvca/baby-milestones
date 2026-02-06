import React, { useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import * as FileSystemLegacy from 'expo-file-system/legacy';
import * as Crypto from 'expo-crypto';

type Headers = Record<string, string>;

interface AuthenticatedImageProps {
  uri: string;
  headers?: Headers;
  style?: any;
  contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  transition?: number;

  /**
   * Native only:
   * If provided, we will "load from cache" by reading this file if it exists.
   * If NOT provided, we may still auto-cache when headers are required.
   */
  cacheFilePath?: string;
}

async function ensureDirForFile(filePath: string) {
  const idx = filePath.lastIndexOf('/');
  if (idx < 0) return;
  const dir = filePath.slice(0, idx + 1);
  const info = await FileSystemLegacy.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystemLegacy.makeDirectoryAsync(dir, { intermediates: true });
  }
}

function stripQuery(u: string) {
  const q = u.indexOf('?');
  return q >= 0 ? u.slice(0, q) : u;
}

export async function deleteCachedImageFile(filePath: string) {
  try {
    const info = await FileSystemLegacy.getInfoAsync(filePath);
    if (info.exists) {
      await FileSystemLegacy.deleteAsync(filePath, { idempotent: true });
    }
  } catch (e) {
    console.warn('Failed to delete cached image file:', e);
  }
}

export default function AuthenticatedImage({
  uri,
  headers,
  style,
  contentFit = 'cover',
  transition = 200,
  cacheFilePath,
}: AuthenticatedImageProps) {
  const [displayUri, setDisplayUri] = useState<string | null>(null);

  // Important: include header VALUES so token changes trigger a re-run.
  const headersSig = useMemo(() => {
    if (!headers) return '';
    const entries = Object.entries(headers).sort(([a], [b]) => a.localeCompare(b));
    return JSON.stringify(entries);
  }, [headers]);

  useEffect(() => {
    let cancelled = false;

    const setSafe = (v: string | null) => {
      if (!cancelled) setDisplayUri(v);
    };

    const run = async () => {
      if (!uri) {
        setSafe(null);
        return;
      }

      // Web:
      if (Platform.OS === 'web') {
        if (headers && Object.keys(headers).length > 0) {
          const res = await fetch(uri, { headers });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const blob = await res.blob();
          const blobUrl = URL.createObjectURL(blob);
          setSafe(blobUrl);
          return;
        }

        setSafe(uri);
        return;
      }

      // Native:
      const hasAuthHeaders = !!(headers && Object.keys(headers).length > 0);

      // If we don't need auth, just render remote.
      if (!hasAuthHeaders) {
        setSafe(uri);
        return;
      }

      // We DO need auth. RN/ExpoImage can't attach headers to a remote request reliably,
      // so we download to a local file and render that.
      const baseUri = stripQuery(uri);

      const targetPath =
        cacheFilePath ??
        `${FileSystemLegacy.cacheDirectory}authenticated_images/${await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.MD5,
          baseUri
        )}.img`;

      await ensureDirForFile(targetPath);

      const info = await FileSystemLegacy.getInfoAsync(targetPath);
      if (info.exists) {
        setSafe(targetPath);
        return;
      }

      const dl = await FileSystemLegacy.downloadAsync(baseUri, targetPath, { headers });
      if (dl.status !== 200) throw new Error(`Download failed: ${dl.status}`);
      setSafe(dl.uri);
    };

    run().catch((e) => {
      console.warn('AuthenticatedImage failed to load:', e);
      setSafe(null);
    });

    return () => {
      cancelled = true;
      if (Platform.OS === 'web' && displayUri && displayUri.startsWith('blob:')) {
        URL.revokeObjectURL(displayUri);
      }
    };
  }, [uri, cacheFilePath, headersSig]);

  if (!displayUri) return null;

  return (
    <ExpoImage
      source={{ uri: displayUri }}
      style={style}
      contentFit={contentFit}
      transition={transition}
    />
  );
}