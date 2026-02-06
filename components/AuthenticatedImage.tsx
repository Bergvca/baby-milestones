import React, { useEffect, useState } from 'react';
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
   * If NOT provided, we will NOT use a filesystem cache and will render directly from `uri`.
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




export default function AuthenticatedImage({
  uri,
  headers,
  style,
  contentFit = 'cover',
  transition = 200,
  cacheFilePath,
}: AuthenticatedImageProps) {
  const [displayUri, setDisplayUri] = useState<string | null>(null);

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
      // Only use filesystem cache when an explicit cacheFilePath is provided.
      // Otherwise render directly from the remote URI (no file cache).
      if (!cacheFilePath) {
        setSafe(uri);
        return;
      }

      await ensureDirForFile(cacheFilePath);

      const info = await FileSystemLegacy.getInfoAsync(cacheFilePath);
      if (info.exists) {
        setSafe(cacheFilePath);
        return;
      }

      const dl = await FileSystemLegacy.downloadAsync(uri, cacheFilePath, headers ? { headers } : undefined);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uri, cacheFilePath, JSON.stringify(Object.keys(headers ?? {}).sort())]);

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